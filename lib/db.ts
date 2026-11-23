import { DatabaseSync } from "node:sqlite";
import {
  createClient,
  type Client,
  type Transaction,
  type InStatement,
} from "@libsql/client";
import { AsyncLocalStorage } from "node:async_hooks";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
export const dataDir = path.resolve(
  /* turbopackIgnore: true */ process.env.DATA_DIR ||
    path.join(process.cwd(), "data"),
);
export class StorageConfigurationError extends Error {
  constructor() {
    super(
      "Database is not configured for this deployment. Connect Turso and set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel, then redeploy.",
    );
  }
}
export function cloudStorage() {
  return !!process.env.TURSO_DATABASE_URL;
}
export function assertStorageConfiguration() {
  if (
    process.env.VERCEL &&
    (!process.env.TURSO_DATABASE_URL ||
      !process.env.TURSO_AUTH_TOKEN ||
      !/^(libsql|https):\/\//.test(process.env.TURSO_DATABASE_URL))
  )
    throw new StorageConfigurationError();
}
type Scope = { local: true } | { remote: Transaction };
const globalDb = globalThis as unknown as {
  sprintDb?: DatabaseSync;
  sprintRemote?: Client;
  sprintReady?: Promise<Client>;
  sprintDbScope?: AsyncLocalStorage<Scope>;
  sprintDbQueue?: Promise<void>;
};
const scope = (globalDb.sprintDbScope ||= new AsyncLocalStorage<Scope>());
function migrations() {
  const folder = path.join(process.cwd(), "db/migrations");
  return readdirSync(folder)
    .filter((n) => n.endsWith(".sql"))
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(path.join(folder, name), "utf8"),
    }));
}
// Local maintenance scripts can still access the native SQLite connection.
export function db() {
  assertStorageConfiguration();
  if (cloudStorage())
    throw Error("Use the asynchronous database helpers for Turso.");
  if (!globalDb.sprintDb) {
    mkdirSync(dataDir, { recursive: true });
    const d = new DatabaseSync(path.join(dataDir, "sprint.sqlite"));
    d.exec(
      "PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);",
    );
    for (const m of migrations()) {
      d.exec("BEGIN IMMEDIATE");
      try {
        if (
          !d
            .prepare("SELECT name FROM schema_migrations WHERE name=?")
            .get(m.name)
        ) {
          d.exec(m.sql);
          d.prepare("INSERT INTO schema_migrations(name) VALUES (?)").run(
            m.name,
          );
        }
        d.exec("COMMIT");
      } catch (e) {
        d.exec("ROLLBACK");
        d.close();
        throw e;
      }
    }
    globalDb.sprintDb = d;
  }
  return globalDb.sprintDb;
}
async function remote() {
  assertStorageConfiguration();
  if (!globalDb.sprintReady) {
    globalDb.sprintReady = (async () => {
      const client = (globalDb.sprintRemote ||= createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
        intMode: "number",
      }));
      // A write transaction serializes first-time migrations across cold instances.
      const tx = await client.transaction("write");
      try {
        await tx.execute(
          "CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
        );
        const applied = new Set(
          (await tx.execute("SELECT name FROM schema_migrations")).rows.map(
            (r) => String(r.name),
          ),
        );
        for (const m of migrations())
          if (!applied.has(m.name)) {
            await tx.executeMultiple(m.sql);
            await tx.execute({
              sql: "INSERT INTO schema_migrations(name) VALUES (?)",
              args: [m.name],
            });
          }
        await tx.commit();
        return client;
      } catch (e) {
        await tx.rollback();
        throw e;
      } finally {
        tx.close();
      }
    })().catch((e) => {
      globalDb.sprintReady = undefined;
      throw e;
    });
  }
  return globalDb.sprintReady;
}
async function localLock<T>(fn: () => T | Promise<T>): Promise<T> {
  if (scope.getStore()) return fn();
  const previous = globalDb.sprintDbQueue || Promise.resolve();
  let unlock!: () => void;
  globalDb.sprintDbQueue = new Promise<void>((r) => {
    unlock = r;
  });
  await previous;
  try {
    return await fn();
  } finally {
    unlock();
  }
}
type Arg = string | number | null;
export async function rows(
  sql: string,
  ...args: Arg[]
): Promise<Record<string, any>[]> {
  assertStorageConfiguration();
  const active = scope.getStore();
  if (active && "remote" in active)
    return (await active.remote.execute({ sql, args })).rows as Record<
      string,
      any
    >[];
  if (cloudStorage())
    return localLock(
      async () =>
        (await (await remote()).execute({ sql, args })).rows as Record<
          string,
          any
        >[],
    );
  return localLock(
    () =>
      db()
        .prepare(sql)
        .all(...args) as Record<string, any>[],
  );
}
export async function row(
  sql: string,
  ...args: Arg[]
): Promise<Record<string, any> | undefined> {
  return (await rows(sql, ...args))[0];
}
export async function run(sql: string, ...args: Arg[]) {
  assertStorageConfiguration();
  const active = scope.getStore();
  if (active && "remote" in active) {
    const r = await active.remote.execute({ sql, args });
    return { changes: r.rowsAffected, lastInsertRowid: r.lastInsertRowid };
  }
  if (cloudStorage())
    return localLock(async () => {
      const r = await (await remote()).execute({ sql, args });
      return { changes: r.rowsAffected, lastInsertRowid: r.lastInsertRowid };
    });
  return localLock(() =>
    db()
      .prepare(sql)
      .run(...args),
  );
}
export async function batch(statements: InStatement[]) {
  const active = scope.getStore();
  if (active && "remote" in active) {
    await active.remote.batch(statements);
    return;
  }
  if (cloudStorage()) {
    await localLock(async () => {
      await (await remote()).batch(statements, "write");
    });
    return;
  }
  await transaction(async () => {
    for (const item of statements) {
      const statement =
        typeof item === "string" ? { sql: item, args: [] } : item;
      db()
        .prepare(statement.sql)
        .run(...((statement.args || []) as Arg[]));
    }
  });
}
export async function transaction<T>(fn: () => T | Promise<T>): Promise<T> {
  assertStorageConfiguration();
  if (scope.getStore()) return fn();
  if (cloudStorage())
    return localLock(async () => {
      const tx = await (await remote()).transaction("write");
      try {
        const result = await scope.run({ remote: tx }, fn);
        await tx.commit();
        return result;
      } catch (e) {
        await tx.rollback();
        throw e;
      } finally {
        tx.close();
      }
    });
  return localLock(async () => {
    const d = db();
    d.exec("BEGIN IMMEDIATE");
    try {
      const result = await scope.run({ local: true }, fn);
      d.exec("COMMIT");
      return result;
    } catch (e) {
      d.exec("ROLLBACK");
      throw e;
    }
  });
}
