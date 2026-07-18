import { Database } from "bun:sqlite";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

const databasePath = process.env.DATABASE_PATH ?? "./markr.sqlite";
const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));
const sqlite = new Database(databasePath, { create: true });

try {
  sqlite.run("PRAGMA journal_mode = WAL");
  sqlite.run("PRAGMA foreign_keys = ON");
  sqlite.run("PRAGMA busy_timeout = 5000");
  sqlite.run("PRAGMA synchronous = NORMAL");

  migrate(drizzle({ client: sqlite }), { migrationsFolder });
  console.info("Markr migrations applied");
} finally {
  sqlite.close();
}
