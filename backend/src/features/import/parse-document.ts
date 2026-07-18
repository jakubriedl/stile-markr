import { SaxesParser, type SaxesTagNS } from "saxes";

import { normalizeResult, type RawResultInput, type RetainedResult } from "../../domain/result.ts";
import { IMPORT_MAX_BYTES } from "./limits.ts";
import { INVALID_XML_MESSAGE, type ImportParseFailure, type ImportParseOutcome } from "./types.ts";
import { wardAgainstGoblins } from "./ward.ts";

type FieldName = "student-number" | "test-id" | "first-name" | "last-name" | "summary-marks";

type DraftRecord = {
  scannedOn?: string;
  studentNumber?: string;
  testId?: string;
  firstName?: string;
  lastName?: string;
  available?: string;
  obtained?: string;
  seen: Set<FieldName>;
};

const RESULT_FIELDS = new Set<string>([
  "student-number",
  "test-id",
  "first-name",
  "last-name",
  "summary-marks",
]);

function failure(code: ImportParseFailure["code"], message: string): ImportParseFailure {
  return { ok: false, code, message };
}

function isUnnamespaced(tag: SaxesTagNS, local: string): boolean {
  return tag.local === local && tag.uri === "" && tag.prefix === "";
}

/**
 * Parse a streamed Markr import document into normalized retained records.
 * Does not persist; any validation failure rejects the whole document.
 */
export async function parseImportDocument(
  source: AsyncIterable<Uint8Array> | Iterable<Uint8Array>,
): Promise<ImportParseOutcome> {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const parser = new SaxesParser({ xmlns: true, position: false });

  let byteCount = 0;
  let settled: ImportParseFailure | undefined;
  let rootSeen = false;
  let rootClosed = false;
  let depth = 0;
  let inDirectResult = false;
  let capturingField: FieldName | null = null;
  let textBuffer = "";
  let draft: DraftRecord | null = null;
  const records: RetainedResult[] = [];

  const fail = (next: ImportParseFailure) => {
    if (!settled) {
      settled = next;
    }
  };

  const finishDraft = () => {
    if (!draft || settled) {
      draft = null;
      return;
    }

    if (
      draft.studentNumber == null ||
      draft.testId == null ||
      draft.available == null ||
      draft.obtained == null
    ) {
      fail(
        failure(
          "invalid_document",
          "Each result must contain student-number, test-id, and summary-marks",
        ),
      );
      draft = null;
      return;
    }

    const raw: RawResultInput = wardAgainstGoblins({
      studentNumber: draft.studentNumber,
      testId: draft.testId,
      available: draft.available,
      obtained: draft.obtained,
      firstName: draft.firstName ?? null,
      lastName: draft.lastName ?? null,
      scannedOn: draft.scannedOn ?? null,
    });

    const normalized = normalizeResult(raw);
    if (!normalized.ok) {
      fail(failure("invalid_document", normalized.message));
      draft = null;
      return;
    }

    records.push(normalized.value);
    draft = null;
  };

  parser.on("error", () => {
    fail(failure("invalid_xml", INVALID_XML_MESSAGE));
  });

  parser.on("opentag", (tag: SaxesTagNS) => {
    if (settled) {
      return;
    }

    depth += 1;

    if (depth === 1) {
      if (rootSeen || !isUnnamespaced(tag, "mcq-test-results")) {
        fail(
          failure(
            "invalid_document",
            "Document root must be the unnamespaced mcq-test-results element",
          ),
        );
        return;
      }
      rootSeen = true;
      return;
    }

    if (!rootSeen) {
      fail(failure("invalid_document", "Document root must be mcq-test-results"));
      return;
    }

    if (depth === 2) {
      if (isUnnamespaced(tag, "mcq-test-result")) {
        inDirectResult = true;
        const scannedOn = tag.attributes["scanned-on"]?.value;
        draft = { seen: new Set() };
        if (scannedOn != null) {
          draft.scannedOn = scannedOn;
        }
      } else {
        inDirectResult = false;
      }
      return;
    }

    if (!inDirectResult || draft == null || depth !== 3) {
      return;
    }

    if (!RESULT_FIELDS.has(tag.local) || !isUnnamespaced(tag, tag.local)) {
      capturingField = null;
      return;
    }

    const field = tag.local as FieldName;
    if (draft.seen.has(field)) {
      fail(failure("invalid_document", `Result field ${field} must appear at most once`));
      return;
    }
    draft.seen.add(field);

    if (field === "summary-marks") {
      const available = tag.attributes.available?.value;
      const obtained = tag.attributes.obtained?.value;
      if (available == null || obtained == null) {
        fail(
          failure(
            "invalid_document",
            "summary-marks must contain available and obtained attributes",
          ),
        );
        return;
      }
      draft.available = available;
      draft.obtained = obtained;
      capturingField = null;
      return;
    }

    capturingField = field;
    textBuffer = "";
  });

  parser.on("text", (text: string) => {
    if (settled || capturingField == null || draft == null) {
      return;
    }
    textBuffer += text;
  });

  parser.on("closetag", (tag: SaxesTagNS) => {
    if (settled) {
      depth = Math.max(0, depth - 1);
      return;
    }

    if (inDirectResult && draft && depth === 3 && capturingField != null) {
      const value = textBuffer;
      switch (capturingField) {
        case "student-number":
          draft.studentNumber = value;
          break;
        case "test-id":
          draft.testId = value;
          break;
        case "first-name":
          draft.firstName = value;
          break;
        case "last-name":
          draft.lastName = value;
          break;
        default:
          break;
      }
      capturingField = null;
      textBuffer = "";
    }

    if (depth === 2 && inDirectResult && isUnnamespaced(tag, "mcq-test-result")) {
      finishDraft();
      inDirectResult = false;
    }

    if (depth === 1 && isUnnamespaced(tag, "mcq-test-results")) {
      rootClosed = true;
    }

    depth -= 1;
  });

  const iterator =
    Symbol.asyncIterator in source
      ? (source as AsyncIterable<Uint8Array>)[Symbol.asyncIterator]()
      : (async function* () {
          for (const chunk of source as Iterable<Uint8Array>) {
            yield chunk;
          }
        })();

  for await (const chunk of { [Symbol.asyncIterator]: () => iterator }) {
    if (settled) {
      break;
    }

    byteCount += chunk.byteLength;
    if (byteCount > IMPORT_MAX_BYTES) {
      fail(failure("payload_too_large", "Request body must not exceed 50 MiB"));
      break;
    }

    let text: string;
    try {
      text = decoder.decode(chunk, { stream: true });
    } catch {
      fail(failure("invalid_utf8", "Import document must be valid UTF-8"));
      break;
    }

    parser.write(text);
  }

  if (!settled) {
    try {
      decoder.decode();
    } catch {
      fail(failure("invalid_utf8", "Import document must be valid UTF-8"));
    }
  }

  if (!settled) {
    parser.close();
  }

  if (settled) {
    return settled;
  }

  if (!rootSeen || !rootClosed) {
    return failure("invalid_xml", INVALID_XML_MESSAGE);
  }

  if (records.length === 0) {
    return failure("empty_document", "Document must contain at least one mcq-test-result");
  }

  return { ok: true, records };
}

/** Convenience helper for complete in-memory buffers. */
export async function parseImportBuffer(bytes: Uint8Array): Promise<ImportParseOutcome> {
  return parseImportDocument([bytes]);
}
