import type { NormalizeResultFailure } from "../../domain/result.ts";
import { INVALID_XML_MESSAGE, type ImportParseFailure } from "./types.ts";

/** JSON body for import/operational failures shown to upload clients. */
export type ImportErrorBody = {
  /** Contractual or descriptive summary. Malformed XML keeps the exact API string. */
  error: string;
  /** Where in the document or request the problem was found. Never includes student PII. */
  path?: string;
  /** Plain-language guidance for fixing the file or retrying. */
  fix?: string;
};

export function lineColumnPath(line: number, column: number): string {
  // saxes `column` is 0-based; present 1-based columns to people.
  return `Around line ${line}, column ${column + 1}`;
}

export function resultPath(resultIndex: number, field?: string): string {
  const base = `mcq-test-results → result #${resultIndex}`;
  return field == null ? base : `${base} → <${field}>`;
}

export function combinePaths(...parts: Array<string | undefined>): string | undefined {
  const filtered = parts.filter((part): part is string => part != null && part.length > 0);
  return filtered.length > 0 ? filtered.join(" · ") : undefined;
}

export function importFailure(
  code: ImportParseFailure["code"],
  error: string,
  options: { path?: string; fix?: string } = {},
): ImportParseFailure {
  const failure: ImportParseFailure = {
    ok: false,
    code,
    message: error,
  };
  if (options.path != null) {
    failure.path = options.path;
  }
  if (options.fix != null) {
    failure.fix = options.fix;
  }
  return failure;
}

/** Build fix guidance, attaching `path` only when present (exactOptionalPropertyTypes). */
export function withPath(
  path: string | undefined,
  fix: string,
): { path: string; fix: string } | { fix: string } {
  return path == null ? { fix } : { path, fix };
}

export function normalizeFailureToImport(
  failure: NormalizeResultFailure,
  resultIndex: number,
  location?: string,
): ImportParseFailure {
  const fieldByCode: Record<NormalizeResultFailure["code"], string | undefined> = {
    invalid_student_number: "student-number",
    invalid_test_id: "test-id",
    invalid_summary_marks: "summary-marks",
    invalid_name: undefined,
    invalid_scanned_on: "scanned-on",
  };

  const field = fieldByCode[failure.code];
  const path = combinePaths(location, resultPath(resultIndex, field));

  switch (failure.code) {
    case "invalid_student_number":
      return importFailure(
        "invalid_document",
        "A student number is missing or not a valid whole number.",
        withPath(
          path,
          "In that result, set <student-number> to a positive whole number (digits only). Leading zeros are fine.",
        ),
      );
    case "invalid_test_id":
      return importFailure(
        "invalid_document",
        "A test ID is missing or uses characters Markr does not allow.",
        withPath(
          path,
          "In that result, set <test-id> to letters, numbers, hyphens, or underscores only (no spaces).",
        ),
      );
    case "invalid_summary_marks":
      return importFailure(
        "invalid_document",
        "The score values in summary-marks are not usable.",
        withPath(
          path,
          "Set available to a whole number greater than 0, and obtained to a whole number from 0 up to available.",
        ),
      );
    case "invalid_name":
      return importFailure(
        "invalid_document",
        "A name field is present but empty.",
        withPath(
          combinePaths(location, resultPath(resultIndex)),
          "Either remove the empty <first-name> or <last-name> tag, or put real text inside it.",
        ),
      );
    case "invalid_scanned_on":
      return importFailure(
        "invalid_document",
        "The scanned-on time is missing a timezone or is not a valid date-time.",
        withPath(
          path,
          "Use an ISO date-time with Z or an explicit offset, for example 2017-12-04T12:12:10+11:00. Do not use a local time without a timezone.",
        ),
      );
  }
}

export function malformedXmlFailure(path?: string): ImportParseFailure {
  return importFailure(
    "invalid_xml",
    INVALID_XML_MESSAGE,
    withPath(
      path,
      "Open the file in a text editor and repair the XML: every opening tag needs a matching closing tag, and attribute values need quotes.",
    ),
  );
}

export function toImportErrorBody(failure: ImportParseFailure): ImportErrorBody {
  const body: ImportErrorBody = { error: failure.message };
  if (failure.path) {
    body.path = failure.path;
  }
  if (failure.fix) {
    body.fix = failure.fix;
  }
  return body;
}
