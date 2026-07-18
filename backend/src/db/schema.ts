import { sql } from "drizzle-orm";
import { check, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Durable retained results. Identity is canonical (test_id, student_number).
 * Operational timestamps are never exposed as student data.
 */
export const results = sqliteTable(
  "results",
  {
    testId: text("test_id").notNull(),
    studentNumber: integer("student_number").notNull(),
    obtained: integer("obtained").notNull(),
    available: integer("available").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    scannedOnMs: integer("scanned_on_ms"),
    createdAtMs: integer("created_at_ms").notNull(),
    updatedAtMs: integer("updated_at_ms").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.testId, table.studentNumber] }),
    check(
      "results_test_id_canonical",
      sql`length(${table.testId}) > 0 AND ${table.testId} GLOB '[a-z0-9_-]*'`,
    ),
    check(
      "results_student_number_safe",
      sql`${table.studentNumber} >= 1 AND ${table.studentNumber} <= 9007199254740991`,
    ),
    check("results_available_positive", sql`${table.available} > 0`),
    check(
      "results_obtained_bounded",
      sql`${table.obtained} >= 0 AND ${table.obtained} <= ${table.available}`,
    ),
  ],
);

/**
 * Temporary per-transaction request keys for unique import counts.
 * Cleared inside each serialized import transaction.
 */
export const importRequestKeys = sqliteTable(
  "import_request_keys",
  {
    testId: text("test_id").notNull(),
    studentNumber: integer("student_number").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.testId, table.studentNumber] }),
    check(
      "import_request_keys_test_id_canonical",
      sql`length(${table.testId}) > 0 AND ${table.testId} GLOB '[a-z0-9_-]*'`,
    ),
    check(
      "import_request_keys_student_number_safe",
      sql`${table.studentNumber} >= 1 AND ${table.studentNumber} <= 9007199254740991`,
    ),
  ],
);

export type ResultRow = typeof results.$inferSelect;
export type NewResultRow = typeof results.$inferInsert;
export type ImportRequestKeyRow = typeof importRequestKeys.$inferSelect;
