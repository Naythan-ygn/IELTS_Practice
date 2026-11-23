import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync, existsSync } from "node:fs";
const file = "data/backups/pre-tutor-chats-2026-11-24.sqlite";
mkdirSync("data/backups", { recursive: true });
if (!existsSync(file)) {
  const source = new DatabaseSync("data/sprint.sqlite");
  source.exec("PRAGMA busy_timeout=5000");
  await backup(source, file);
  source.close();
  console.log("Saved a consistent pre-chat-upgrade database backup.");
} else console.log("Existing chat-upgrade backup retained.");
