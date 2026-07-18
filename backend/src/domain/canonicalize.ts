/** Maximum student-number identity value (Number.MAX_SAFE_INTEGER). */
export const MAX_STUDENT_NUMBER = 9_007_199_254_740_991;

const STUDENT_NUMBER_DIGITS = /^\d+$/;
const TEST_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const CANONICAL_TEST_ID_PATTERN = /^[a-z0-9_-]+$/;

export type CanonicalizeFailureReason = "empty" | "invalid_format" | "out_of_range";

export type CanonicalizeResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: CanonicalizeFailureReason };

/**
 * Normalize a student-number string to its positive safe integer identity.
 * Leading zeroes are accepted on input but do not create a distinct identity.
 */
export function canonicalizeStudentNumber(raw: string): CanonicalizeResult<number> {
  if (raw.length === 0) {
    return { ok: false, reason: "empty" };
  }

  if (!STUDENT_NUMBER_DIGITS.test(raw)) {
    return { ok: false, reason: "invalid_format" };
  }

  // Strip leading zeroes for range checks; they do not create distinct identity.
  const digits = raw.replace(/^0+/, "");
  if (digits.length === 0) {
    return { ok: false, reason: "out_of_range" };
  }

  // Reject values that cannot be represented exactly as a JS number.
  if (digits.length > 16 || (digits.length === 16 && digits > String(MAX_STUDENT_NUMBER))) {
    return { ok: false, reason: "out_of_range" };
  }

  // Length/string bounds above guarantee a safe positive integer.
  return { ok: true, value: Number(digits) };
}

/**
 * Trim and lowercase a test-id. Identity comparison is case-insensitive.
 */
export function canonicalizeTestId(raw: string): CanonicalizeResult<string> {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: "empty" };
  }

  if (!TEST_ID_PATTERN.test(trimmed)) {
    return { ok: false, reason: "invalid_format" };
  }

  return { ok: true, value: trimmed.toLowerCase() };
}

/** True when a stored test_id already matches the canonical form. */
export function isCanonicalTestId(value: string): boolean {
  return value.length > 0 && CANONICAL_TEST_ID_PATTERN.test(value);
}

/** Stable identity key for a retained result pair. */
export function resultIdentityKey(testId: string, studentNumber: number): string {
  return `${testId}\u0000${String(studentNumber)}`;
}
