import { SaxesParser, type SaxesTagNS } from "saxes";

import { normalizeResult, type RawResultInput, type RetainedResult } from "../../domain/result.ts";
import {
  combinePaths,
  importFailure,
  lineColumnPath,
  malformedXmlFailure,
  normalizeFailureToImport,
  resultPath,
  withPath,
} from "./import-errors.ts";
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
  resultIndex: number;
  openLocation?: string;
};

const RESULT_FIELDS = new Set<string>([
  "student-number",
  "test-id",
  "first-name",
  "last-name",
  "summary-marks",
]);

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
  const parser = new SaxesParser({ xmlns: true, position: true });

  let byteCount = 0;
  let settled: ImportParseFailure | undefined;
  let rootSeen = false;
  let rootClosed = false;
  let depth = 0;
  let inDirectResult = false;
  let capturingField: FieldName | null = null;
  let textBuffer = "";
  let draft: DraftRecord | null = null;
  let resultCount = 0;
  const records: RetainedResult[] = [];

  const currentLocation = () => lineColumnPath(parser.line, parser.column);

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

    const location = draft.openLocation;

    if (
      draft.studentNumber == null ||
      draft.testId == null ||
      draft.available == null ||
      draft.obtained == null
    ) {
      const missing: string[] = [];
      if (draft.studentNumber == null) {
        missing.push("<student-number>");
      }
      if (draft.testId == null) {
        missing.push("<test-id>");
      }
      if (draft.available == null || draft.obtained == null) {
        missing.push("<summary-marks>");
      }
      fail(
        importFailure(
          "invalid_document",
          `A result is missing required information (${missing.join(", ")}).`,
          withPath(
            combinePaths(location, resultPath(draft.resultIndex)),
            'Each <mcq-test-result> needs <student-number>, <test-id>, and <summary-marks available="…" obtained="…" />.',
          ),
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
      fail(normalizeFailureToImport(normalized, draft.resultIndex, location));
      draft = null;
      return;
    }

    records.push(normalized.value);
    draft = null;
  };

  parser.on("error", () => {
    fail(malformedXmlFailure(currentLocation()));
  });

  parser.on("opentag", (tag: SaxesTagNS) => {
    if (settled) {
      return;
    }

    depth += 1;

    if (depth === 1) {
      if (rootSeen || !isUnnamespaced(tag, "mcq-test-results")) {
        fail(
          importFailure(
            "invalid_document",
            "This file does not use the Markr results root element.",
            withPath(
              combinePaths(currentLocation(), "document root"),
              "The outermost element must be exactly <mcq-test-results> with no XML namespace.",
            ),
          ),
        );
        return;
      }
      rootSeen = true;
      return;
    }

    if (!rootSeen) {
      fail(
        importFailure(
          "invalid_document",
          "This file does not use the Markr results root element.",
          withPath(
            combinePaths(currentLocation(), "document root"),
            "The outermost element must be exactly <mcq-test-results> with no XML namespace.",
          ),
        ),
      );
      return;
    }

    if (depth === 2) {
      if (isUnnamespaced(tag, "mcq-test-result")) {
        inDirectResult = true;
        resultCount += 1;
        const scannedOn = tag.attributes["scanned-on"]?.value;
        draft = {
          seen: new Set(),
          resultIndex: resultCount,
          openLocation: currentLocation(),
        };
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
      fail(
        importFailure(
          "invalid_document",
          `The <${field}> field appears more than once in one result.`,
          withPath(
            combinePaths(currentLocation(), resultPath(draft.resultIndex, field)),
            `Keep only one <${field}> inside that <mcq-test-result>.`,
          ),
        ),
      );
      return;
    }
    draft.seen.add(field);

    if (field === "summary-marks") {
      const available = tag.attributes.available?.value;
      const obtained = tag.attributes.obtained?.value;
      if (available == null || obtained == null) {
        fail(
          importFailure(
            "invalid_document",
            "A summary-marks tag is missing the available or obtained score.",
            withPath(
              combinePaths(currentLocation(), resultPath(draft.resultIndex, "summary-marks")),
              'Write both attributes, for example <summary-marks available="20" obtained="13" />.',
            ),
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
      fail(
        importFailure("payload_too_large", "This file is larger than Markr allows.", {
          path: "Upload size limit (50 MiB)",
          fix: "Upload a results file of 50 MiB or smaller.",
        }),
      );
      break;
    }

    let text: string;
    try {
      text = decoder.decode(chunk, { stream: true });
    } catch {
      fail(
        importFailure(
          "invalid_utf8",
          INVALID_XML_MESSAGE,
          withPath(
            currentLocation(),
            "Save the file as UTF-8 text (the usual encoding for XML) and try again.",
          ),
        ),
      );
      break;
    }

    parser.write(text);
  }

  if (!settled) {
    try {
      decoder.decode();
    } catch {
      fail(
        importFailure(
          "invalid_utf8",
          INVALID_XML_MESSAGE,
          withPath(
            currentLocation(),
            "Save the file as UTF-8 text (the usual encoding for XML) and try again.",
          ),
        ),
      );
    }
  }

  if (!settled) {
    parser.close();
  }

  if (settled) {
    return settled;
  }

  if (!rootSeen || !rootClosed) {
    return malformedXmlFailure(currentLocation());
  }

  if (records.length === 0) {
    return importFailure(
      "empty_document",
      "This file has no student results to import.",
      {
        path: "mcq-test-results",
        fix: "Add at least one <mcq-test-result> with student-number, test-id, and summary-marks.",
      },
    );
  }

  return { ok: true, records };
}

/** Convenience helper for complete in-memory buffers. */
export async function parseImportBuffer(bytes: Uint8Array): Promise<ImportParseOutcome> {
  return parseImportDocument([bytes]);
}
