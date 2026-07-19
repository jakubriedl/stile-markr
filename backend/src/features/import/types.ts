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
  /** Value returned as JSON `error`. Exact contract for malformed XML. */
  message: string;
  /** Optional location for upload UI (no student PII). */
  path?: string;
  /** Optional plain-language fix guidance for upload UI. */
  fix?: string;
};

export type ImportParseSuccess = {
  ok: true;
  records: RetainedResult[];
};

export type ImportParseOutcome = ImportParseSuccess | ImportParseFailure;

export const INVALID_XML_MESSAGE = "Invalid XML format";
