import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
export const dataDir = path.resolve(
  /* turbopackIgnore: true */
  process.env.DATA_DIR || path.join(process.cwd(), "data"),
);
const globalDb = globalThis as unknown as { sprintDb?: DatabaseSync };
export function db() {
  if (!globalDb.sprintDb) {
    mkdirSync(dataDir, { recursive: true });
    const d = new DatabaseSync(path.join(dataDir, "sprint.sqlite"));
    d.exec(
      "PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);",
    );
    const folder = path.join(process.cwd(), "db/migrations");
    for (const name of readdirSync(folder)
      .filter((n) => n.endsWith(".sql"))
      .sort()) {
      if (
        !d.prepare("SELECT name FROM schema_migrations WHERE name=?").get(name)
      ) {
        d.exec("BEGIN IMMEDIATE");
        try {
          d.exec(readFileSync(path.join(folder, name), "utf8"));
          d.prepare("INSERT INTO schema_migrations(name) VALUES (?)").run(name);
          d.exec("COMMIT");
        } catch (e) {
          d.exec("ROLLBACK");
          throw e;
        }
      }
    }
    globalDb.sprintDb = d;
  }
  return globalDb.sprintDb;
}
export function rows(sql: string, ...args: (string | number | null)[]) {
  return db()
    .prepare(sql)
    .all(...args) as Record<string, any>[];
}
export function row(sql: string, ...args: (string | number | null)[]) {
  return db()
    .prepare(sql)
    .get(...args) as Record<string, any> | undefined;
}
export function run(sql: string, ...args: (string | number | null)[]) {
  return db()
    .prepare(sql)
    .run(...args);
}
export function transaction<T>(fn: () => T) {
  db().exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db().exec("COMMIT");
    return result;
  } catch (e) {
    db().exec("ROLLBACK");
    throw e;
  }
}
