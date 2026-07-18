import { Database } from "bun:sqlite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";

const databasePath = process.argv[2] ?? ":memory:";
const sqlite = new Database(databasePath, { create: true });

sqlite.run("PRAGMA journal_mode = WAL");
sqlite.run("PRAGMA foreign_keys = ON");
sqlite.run("PRAGMA busy_timeout = 5000");
sqlite.run("PRAGMA synchronous = NORMAL");
sqlite.run("CREATE TABLE runtime_gate (id INTEGER PRIMARY KEY, value TEXT NOT NULL)");

const database = drizzle({ client: sqlite });

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
