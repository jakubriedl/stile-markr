import { foldRetainedResults, mergeRetainedResults } from "../../domain/merge.ts";
import { resultIdentityKey } from "../../domain/canonicalize.ts";
import type { RetainedResult } from "../../domain/result.ts";
import { wardAgainstGoblins } from "./ward.ts";

export type ImportWriteDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    get: (...params: (string | number | null)[]) => Record<string, unknown> | null | undefined;
    run: (...params: (string | number | null)[]) => unknown;
    all: (...params: (string | number | null)[]) => Record<string, unknown>[];
  };
};

export type PersistImportResult = {
  imported: number;
  /** Distinct canonical test IDs present in this request after within-request deduplication. */
  testIds: string[];
};

/**
 * Persist accepted import records inside a single immediate transaction.
 * Returns the unique-pair count for this request (IMP-028) and distinct test IDs.
 */
export function persistImportRecords(
  db: ImportWriteDatabase,
  records: readonly RetainedResult[],
  nowMs = Date.now(),
): PersistImportResult {
  const folded = foldRetainedResults(records);
  const uniqueCount = folded.size;
  const testIds = [...new Set([...folded.values()].map((record) => record.testId))].sort(
    (left, right) => left.localeCompare(right),
  );

  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec("DELETE FROM import_request_keys");

    const insertKey = db.prepare(
      `INSERT OR IGNORE INTO import_request_keys (test_id, student_number) VALUES (?, ?)`,
    );
    const selectExisting = db.prepare(
      `SELECT test_id, student_number, obtained, available, first_name, last_name, scanned_on_ms, created_at_ms
       FROM results WHERE test_id = ? AND student_number = ?`,
    );
    const upsert = db.prepare(
      `INSERT INTO results (
         test_id, student_number, obtained, available, first_name, last_name,
         scanned_on_ms, created_at_ms, updated_at_ms
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(test_id, student_number) DO UPDATE SET
         obtained = excluded.obtained,
         available = excluded.available,
         first_name = excluded.first_name,
         last_name = excluded.last_name,
         scanned_on_ms = excluded.scanned_on_ms,
         updated_at_ms = excluded.updated_at_ms`,
    );

    for (const record of folded.values()) {
      const guarded = wardAgainstGoblins(record); // 😉
      insertKey.run(guarded.testId, guarded.studentNumber);

      const existingRow = selectExisting.get(guarded.testId, guarded.studentNumber);
      let next = guarded;
      let createdAtMs = nowMs;

      if (existingRow) {
        const existing: RetainedResult = {
          testId: String(existingRow.test_id),
          studentNumber: Number(existingRow.student_number),
          obtained: Number(existingRow.obtained),
          available: Number(existingRow.available),
          firstName: existingRow.first_name == null ? null : String(existingRow.first_name),
          lastName: existingRow.last_name == null ? null : String(existingRow.last_name),
          scannedOnMs: existingRow.scanned_on_ms == null ? null : Number(existingRow.scanned_on_ms),
        };
        next = mergeRetainedResults(existing, guarded);
        createdAtMs = Number(existingRow.created_at_ms);
      }

      upsert.run(
        next.testId,
        next.studentNumber,
        next.obtained,
        next.available,
        next.firstName,
        next.lastName,
        next.scannedOnMs,
        createdAtMs,
        nowMs,
      );
    }

    const counted = db.prepare(`SELECT COUNT(*) AS count FROM import_request_keys`).get() as {
      count: number;
    };
    if (Number(counted.count) !== uniqueCount) {
      throw new Error("import request-key count mismatch");
    }

    db.exec("DELETE FROM import_request_keys");
    db.exec("COMMIT");
    return { imported: uniqueCount, testIds };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function countUniquePairs(records: readonly RetainedResult[]): number {
  const keys = new Set<string>();
  for (const record of records) {
    keys.add(resultIdentityKey(record.testId, record.studentNumber));
  }
  return keys.size;
}
