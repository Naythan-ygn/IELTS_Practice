import { DatabaseSync, backup } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
const target = "data/backups/pre-login-2026-11-24.sqlite";
mkdirSync("data/backups", { recursive: true });
if (existsSync("data/sprint.sqlite") && !existsSync(target)) {
  const source = new DatabaseSync("data/sprint.sqlite");
  source.exec("PRAGMA busy_timeout=5000");
  await backup(source, target);
  source.close();
  console.log("Saved pre-login database backup.");
} else console.log("Existing data and backups retained.");
