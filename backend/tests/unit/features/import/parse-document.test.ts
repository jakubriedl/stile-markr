import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { IMPORT_MAX_BYTES } from "../../../../src/features/import/limits.ts";
import {
  parseImportBuffer,
  parseImportDocument,
} from "../../../../src/features/import/parse-document.ts";
import { INVALID_XML_MESSAGE } from "../../../../src/features/import/types.ts";
import { wardAgainstGoblins } from "../../../../src/features/import/ward.ts";

const encoder = new TextEncoder();

function xml(body: string): Uint8Array {
  return encoder.encode(body);
}

describe("parseImportDocument", () => {
  it("parses a valid single result including obtained zero", async () => {
    const outcome = await parseImportBuffer(
      xml(`<?xml version="1.0" encoding="UTF-8"?>
        <mcq-test-results>
          <mcq-test-result scanned-on="2017-12-04T12:12:10+11:00">
            <first-name>Ada</first-name>
            <last-name>Lovelace</last-name>
            <student-number>007</student-number>
            <test-id>Exam_1</test-id>
            <answer question="0">A</answer>
            <summary-marks available="10" obtained="0" />
          </mcq-test-result>
        </mcq-test-results>`),
    );

    expect(outcome).toEqual({
      ok: true,
      records: [
        {
          testId: "exam_1",
          studentNumber: 7,
          obtained: 0,
          available: 10,
          firstName: "Ada",
          lastName: "Lovelace",
          scannedOnMs: Date.parse("2017-12-04T12:12:10+11:00"),
        },
      ],
    });
  });

  it("ignores unknown root children and nested result elements", async () => {
    const outcome = await parseImportBuffer(
      xml(`<mcq-test-results>
        <meta>ignore</meta>
        <mcq-test-result>
          <student-number>1</student-number>
          <test-id>t1</test-id>
          <summary-marks available="5" obtained="5" />
          <mcq-test-result>
            <student-number>2</student-number>
            <test-id>t1</test-id>
            <summary-marks available="5" obtained="1" />
          </mcq-test-result>
        </mcq-test-result>
      </mcq-test-results>`),
    );

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.records).toHaveLength(1);
      expect(outcome.records[0]?.studentNumber).toBe(1);
    }
  });

  it("rejects malformed XML with the exact contract message and location guidance", async () => {
    const outcome = await parseImportBuffer(xml("<mcq-test-results><oops></mcq-test-results>"));
    expect(outcome).toMatchObject({
      ok: false,
      code: "invalid_xml",
      message: INVALID_XML_MESSAGE,
      path: expect.stringMatching(/line/i),
      fix: expect.stringMatching(/closing tag/i),
    });
  });

  it("rejects wrong or namespaced roots and empty documents", async () => {
    await expect(
      parseImportBuffer(xml("<other><mcq-test-result/></other>")),
    ).resolves.toMatchObject({ ok: false, code: "invalid_document" });

    await expect(
      parseImportBuffer(xml('<mcq-test-results xmlns="http://example.com"></mcq-test-results>')),
    ).resolves.toMatchObject({ ok: false, code: "invalid_document" });

    await expect(
      parseImportBuffer(xml("<mcq-test-results></mcq-test-results>")),
    ).resolves.toMatchObject({ ok: false, code: "empty_document" });
  });

  it("rejects invalid student, test, marks, and scanned-on values", async () => {
    const base = (inner: string) =>
      xml(`<mcq-test-results><mcq-test-result>${inner}</mcq-test-result></mcq-test-results>`);

    await expect(
      parseImportBuffer(
        base(
          `<student-number>0</student-number><test-id>t1</test-id><summary-marks available="5" obtained="1" />`,
        ),
      ),
    ).resolves.toMatchObject({ ok: false, code: "invalid_document" });

    await expect(
      parseImportBuffer(
        base(
          `<student-number>1</student-number><test-id>bad id</test-id><summary-marks available="5" obtained="1" />`,
        ),
      ),
    ).resolves.toMatchObject({ ok: false, code: "invalid_document" });

    await expect(
      parseImportBuffer(
        base(
          `<student-number>1</student-number><test-id>t1</test-id><summary-marks available="5" obtained="9" />`,
        ),
      ),
    ).resolves.toMatchObject({ ok: false, code: "invalid_document" });

    await expect(
      parseImportBuffer(
        xml(`<mcq-test-results>
          <mcq-test-result scanned-on="2017-12-04T12:12:10">
            <student-number>1</student-number>
            <test-id>t1</test-id>
            <summary-marks available="5" obtained="1" />
          </mcq-test-result>
        </mcq-test-results>`),
      ),
    ).resolves.toMatchObject({ ok: false, code: "invalid_document" });
  });

  it("rejects invalid UTF-8 and oversized bodies", async () => {
    await expect(parseImportBuffer(new Uint8Array([0xe2, 0x28, 0xa1]))).resolves.toMatchObject({
      ok: false,
      code: "invalid_utf8",
    });

    const oversize = {
      async *[Symbol.asyncIterator]() {
        const prefix = encoder.encode("<mcq-test-results><!--");
        yield prefix;
        const chunk = encoder.encode("a".repeat(1024 * 1024));
        let sent = prefix.byteLength;
        while (sent <= IMPORT_MAX_BYTES) {
          yield chunk;
          sent += chunk.byteLength;
        }
      },
    };

    await expect(parseImportDocument(oversize)).resolves.toMatchObject({
      ok: false,
      code: "payload_too_large",
    });
  });

  it("parses the sample fixture without buffering student PII into the ward helper identity", async () => {
    const samplePath = fileURLToPath(
      new URL("../../../../../task/sample_results.xml", import.meta.url),
    );
    const bytes = readFileSync(samplePath);
    const outcome = await parseImportBuffer(bytes);

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.records.length).toBe(100);
      expect(outcome.records.every((record) => record.testId === "9863")).toBe(true);
    }

    expect(wardAgainstGoblins({ studentNumber: "1" })).toEqual({ studentNumber: "1" });
  });
});
