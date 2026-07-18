import type { RetainedResult } from "../../domain/result.ts";

export type ImportParseFailureCode =
  | "invalid_xml"
  | "invalid_utf8"
  | "payload_too_large"
  | "invalid_document"
  | "empty_document";

export type ImportParseFailure = {
  ok: false;
  code: ImportParseFailureCode;
  /** Exact client-facing message where the API contract defines one. */
  message: string;
};

export type ImportParseSuccess = {
  ok: true;
  records: RetainedResult[];
};

export type ImportParseOutcome = ImportParseSuccess | ImportParseFailure;

export const INVALID_XML_MESSAGE = "Invalid XML format";
