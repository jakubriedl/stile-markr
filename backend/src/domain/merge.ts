import { resultIdentityKey } from "./canonicalize.ts";
import type { RetainedResult } from "./result.ts";

export type ResultMetadata = Pick<RetainedResult, "firstName" | "lastName" | "scannedOnMs">;

/**
 * Choose retained names/timestamp for a duplicate identity.
 *
 * Chronologically later scan wins when both timestamps exist and differ.
 * If either timestamp is absent or they are equal, the last-received record wins.
 * Score maxima are never selected by this function.
 */
export function selectMetadata(existing: ResultMetadata, incoming: ResultMetadata): ResultMetadata {
  const existingMs = existing.scannedOnMs;
  const incomingMs = incoming.scannedOnMs;

  if (existingMs != null && incomingMs != null && existingMs > incomingMs) {
    return {
      firstName: existing.firstName,
      lastName: existing.lastName,
      scannedOnMs: existing.scannedOnMs,
    };
  }

  return {
    firstName: incoming.firstName,
    lastName: incoming.lastName,
    scannedOnMs: incoming.scannedOnMs,
  };
}

/**
 * Merge two retained results for the same identity.
 * `incoming` is treated as the last-received record for metadata ties.
 */
export function mergeRetainedResults(
  existing: RetainedResult,
  incoming: RetainedResult,
): RetainedResult {
  if (existing.testId !== incoming.testId || existing.studentNumber !== incoming.studentNumber) {
    throw new Error("mergeRetainedResults requires matching result identity");
  }

  const metadata = selectMetadata(existing, incoming);

  return {
    testId: existing.testId,
    studentNumber: existing.studentNumber,
    obtained: Math.max(existing.obtained, incoming.obtained),
    available: Math.max(existing.available, incoming.available),
    firstName: metadata.firstName,
    lastName: metadata.lastName,
    scannedOnMs: metadata.scannedOnMs,
  };
}

/**
 * Fold an ordered stream of retained results into deduplicated maxima.
 * Later records are last-received for metadata when timestamps do not prefer another.
 */
export function foldRetainedResults(
  records: readonly RetainedResult[],
): Map<string, RetainedResult> {
  const byIdentity = new Map<string, RetainedResult>();

  for (const record of records) {
    const key = resultIdentityKey(record.testId, record.studentNumber);
    const existing = byIdentity.get(key);
    byIdentity.set(key, existing ? mergeRetainedResults(existing, record) : record);
  }

  return byIdentity;
}
