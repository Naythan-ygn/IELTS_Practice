import { db } from "../lib/db.ts";
const database = db();
console.log(
  "Applied migrations:",
  database.prepare("SELECT name FROM schema_migrations ORDER BY name").all(),
);
