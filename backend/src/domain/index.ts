export {
  MAX_STUDENT_NUMBER,
  canonicalizeStudentNumber,
  canonicalizeTestId,
  isCanonicalTestId,
  resultIdentityKey,
  type CanonicalizeFailureReason,
  type CanonicalizeResult,
} from "./canonicalize.ts";

export {
  foldRetainedResults,
  mergeRetainedResults,
  selectMetadata,
  type ResultMetadata,
} from "./merge.ts";

export {
  normalizeResult,
  parseScannedOnMs,
  rawResultInputSchema,
  retainedResultSchema,
  type NormalizeResultFailure,
  type NormalizeResultOutcome,
  type NormalizeResultSuccess,
  type RawResultInput,
  type RetainedResult,
  type RetainedResultSchema,
} from "./result.ts";
