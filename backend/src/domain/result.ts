import * as z from "zod";

import { canonicalizeStudentNumber, canonicalizeTestId } from "./canonicalize.ts";

/** Raw fields as produced by XML parsing before domain normalization. */
export type RawResultInput = {
  studentNumber: string;
  testId: string;
  available: string;
  obtained: string;
  firstName?: string | null;
  lastName?: string | null;
  scannedOn?: string | null;
};

/** Canonical retained result used by persistence and merge logic. */
export type RetainedResult = {
  testId: string;
  studentNumber: number;
  obtained: number;
  available: number;
  firstName: string | null;
  lastName: string | null;
  scannedOnMs: number | null;
};

export type NormalizeResultFailure = {
  ok: false;
  code:
    | "invalid_student_number"
    | "invalid_test_id"
    | "invalid_summary_marks"
    | "invalid_name"
    | "invalid_scanned_on";
  message: string;
};

export type NormalizeResultSuccess = {
  ok: true;
  value: RetainedResult;
};

export type NormalizeResultOutcome = NormalizeResultSuccess | NormalizeResultFailure;

const MARK_INTEGER = /^\d+$/;
/** Requires Z or an explicit ±HH:MM / ±HHMM offset (rejects naive local times). */
const SCANNED_ON_OFFSET = /(?:[Zz]|[+-]\d{2}:?\d{2})$/;

function normalizeOptionalName(
  value: string | null | undefined,
  field: "firstName" | "lastName",
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (value == null) {
    return { ok: true, value: null };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      message: `${field} must contain non-empty text when present`,
    };
  }

  return { ok: true, value: trimmed };
}

function parseMarkInteger(raw: string): number | null {
  if (!MARK_INTEGER.test(raw)) {
    return null;
  }

  const value = Number(raw);
  if (!Number.isSafeInteger(value)) {
    return null;
  }

  return value;
}

/**
 * Parse an optional scanned-on attribute to UTC epoch milliseconds.
 * Absent/null/undefined → null. Present but invalid → failure.
 */
export function parseScannedOnMs(
  raw: string | null | undefined,
): { ok: true; value: number | null } | { ok: false; message: string } {
  if (raw == null) {
    return { ok: true, value: null };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0 || !SCANNED_ON_OFFSET.test(trimmed)) {
    return {
      ok: false,
      message: "scanned-on must be an ISO 8601 date-time with Z or an explicit UTC offset",
    };
  }

  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) {
    return {
      ok: false,
      message: "scanned-on must be a valid ISO 8601 date-time",
    };
  }

  return { ok: true, value: ms };
}

/**
 * Normalize and validate a raw result record into the retained domain shape.
 */
export function normalizeResult(input: RawResultInput): NormalizeResultOutcome {
  const studentNumber = canonicalizeStudentNumber(input.studentNumber);
  if (!studentNumber.ok) {
    return {
      ok: false,
      code: "invalid_student_number",
      message: "student-number must be a positive base-10 integer within the safe integer range",
    };
  }

  const testId = canonicalizeTestId(input.testId);
  if (!testId.ok) {
    return {
      ok: false,
      code: "invalid_test_id",
      message: "test-id must be a non-empty string of letters, digits, hyphens, and underscores",
    };
  }

  const available = parseMarkInteger(input.available);
  const obtained = parseMarkInteger(input.obtained);
  if (available == null || obtained == null) {
    return {
      ok: false,
      code: "invalid_summary_marks",
      message: "summary-marks available and obtained must be base-10 integers",
    };
  }

  if (available <= 0 || obtained < 0 || obtained > available) {
    return {
      ok: false,
      code: "invalid_summary_marks",
      message: "summary-marks must satisfy available > 0 and 0 <= obtained <= available",
    };
  }

  const firstName = normalizeOptionalName(input.firstName, "firstName");
  if (!firstName.ok) {
    return { ok: false, code: "invalid_name", message: firstName.message };
  }

  const lastName = normalizeOptionalName(input.lastName, "lastName");
  if (!lastName.ok) {
    return { ok: false, code: "invalid_name", message: lastName.message };
  }

  const scannedOn = parseScannedOnMs(input.scannedOn);
  if (!scannedOn.ok) {
    return { ok: false, code: "invalid_scanned_on", message: scannedOn.message };
  }

  return {
    ok: true,
    value: {
      testId: testId.value,
      studentNumber: studentNumber.value,
      obtained,
      available,
      firstName: firstName.value,
      lastName: lastName.value,
      scannedOnMs: scannedOn.value,
    },
  };
}

/** Zod boundary for already-normalized retained results (persistence / RPC). */
export const retainedResultSchema = z
  .object({
    testId: z
      .string()
      .min(1)
      .regex(/^[a-z0-9_-]+$/, "testId must be canonical lowercase"),
    studentNumber: z.number().int().positive().max(9_007_199_254_740_991),
    obtained: z.number().int().nonnegative(),
    available: z.number().int().positive(),
    firstName: z.string().min(1).nullable(),
    lastName: z.string().min(1).nullable(),
    scannedOnMs: z.number().int().nullable(),
  })
  .refine((value) => value.obtained <= value.available, {
    message: "obtained must be <= available",
    path: ["obtained"],
  });

export type RetainedResultSchema = z.infer<typeof retainedResultSchema>;

/** Zod boundary for raw import record fields before normalizeResult. */
export const rawResultInputSchema = z.object({
  studentNumber: z.string(),
  testId: z.string(),
  available: z.string(),
  obtained: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  scannedOn: z.string().nullable().optional(),
});
