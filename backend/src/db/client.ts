import { Database } from "bun:sqlite";

import type { ImportWriteDatabase } from "../features/import/persist.ts";
import type { ResultsDatabase } from "../features/results/queries.ts";

export type MarkrDatabases = {
  write: ImportWriteDatabase;
  read: ResultsDatabase;
  close: () => void;
};

function adaptWrite(sqlite: Database): ImportWriteDatabase {
  return {
    exec: (sql) => {
      sqlite.exec(sql);
    },
    prepare: (sql) => {
      const statement = sqlite.prepare(sql);
      return {
        get: (...params) => statement.get(...params) as Record<string, unknown> | undefined,
        run: (...params) => statement.run(...params),
        all: (...params) => statement.all(...params) as Record<string, unknown>[],
      };
    },
  };
}

function adaptRead(sqlite: Database): ResultsDatabase {
  return {
    all: <T extends Record<string, unknown>>(
      query: string,
      params: readonly (string | number)[] = [],
    ) => sqlite.prepare(query).all(...params) as T[],
  };
}

export function openMarkrDatabases(databasePath: string): MarkrDatabases {
  const writeSqlite = new Database(databasePath, { create: true });
  writeSqlite.exec("PRAGMA journal_mode = WAL");
  writeSqlite.exec("PRAGMA foreign_keys = ON");
  writeSqlite.exec("PRAGMA busy_timeout = 5000");
  writeSqlite.exec("PRAGMA synchronous = NORMAL");

  const readSqlite = new Database(databasePath, { readonly: true });
  readSqlite.run("PRAGMA busy_timeout = 5000");

  return {
    write: adaptWrite(writeSqlite),
    read: adaptRead(readSqlite),
    close: () => {
      readSqlite.close();
      writeSqlite.close();
    },
  };
}
