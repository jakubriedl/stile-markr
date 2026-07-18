import { Database } from "bun:sqlite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

const databasePath = process.argv[2] ?? ":memory:";
const migrationsFolder = process.argv[3];
if (!migrationsFolder) {
  throw new Error("A runtime-gate migrations folder is required");
}
const sqlite = new Database(databasePath, { create: true });

sqlite.run("PRAGMA journal_mode = WAL");
sqlite.run("PRAGMA foreign_keys = ON");
sqlite.run("PRAGMA busy_timeout = 5000");
sqlite.run("PRAGMA synchronous = NORMAL");

const database = drizzle({ client: sqlite });
migrate(database, { migrationsFolder });

const migratedTable = sqlite
  .query<{ name: string }, []>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'runtime_gate_migration'",
  )
  .get();
if (migratedTable?.name !== "runtime_gate_migration") {
  throw new Error("Drizzle migration gate failed");
}

sqlite.run("CREATE TABLE runtime_gate (id INTEGER PRIMARY KEY, value TEXT NOT NULL)");

database.transaction((transaction) => {
  transaction.run(sql`INSERT INTO runtime_gate (id, value) VALUES (1, 'committed')`);
});

try {
  database.transaction((transaction) => {
    transaction.run(sql`INSERT INTO runtime_gate (id, value) VALUES (2, 'rolled-back')`);
    throw new Error("expected rollback");
  });
} catch (error) {
  if (!(error instanceof Error) || error.message !== "expected rollback") {
    throw error;
  }
}

const rows = sqlite
  .query<{ id: number; value: string }, []>("SELECT id, value FROM runtime_gate ORDER BY id")
  .all();

if (rows.length !== 1 || rows[0]?.id !== 1 || rows[0].value !== "committed") {
  throw new Error("SQLite transaction gate failed");
}

const journalMode = sqlite.query<{ journal_mode: string }, []>("PRAGMA journal_mode").get();
if (databasePath !== ":memory:" && journalMode?.journal_mode.toLowerCase() !== "wal") {
  throw new Error("SQLite WAL gate failed");
}

sqlite.close();
console.info("runtime-sqlite-gate:ok");
