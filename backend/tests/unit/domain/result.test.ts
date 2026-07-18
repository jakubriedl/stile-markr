import { describe, expect, it } from "vitest";

import {
  normalizeResult,
  parseScannedOnMs,
  rawResultInputSchema,
  retainedResultSchema,
} from "../../../src/domain/result.ts";

const validRaw = {
  studentNumber: "007",
  testId: " Exam_1 ",
  available: "10",
  obtained: "0",
  firstName: " Ada ",
  lastName: " Lovelace ",
  scannedOn: "2024-06-01T12:00:00Z",
};

describe("normalizeResult", () => {
  it("canonicalizes identity, marks, names, and scanned-on", () => {
    expect(normalizeResult(validRaw)).toEqual({
      ok: true,
      value: {
        testId: "exam_1",
        studentNumber: 7,
        obtained: 0,
        available: 10,
        firstName: "Ada",
        lastName: "Lovelace",
        scannedOnMs: Date.parse("2024-06-01T12:00:00Z"),
      },
    });
  });

  it("allows independently omitted optional metadata", () => {
    expect(
      normalizeResult({
        studentNumber: "1",
        testId: "t1",
        available: "5",
        obtained: "5",
      }),
    ).toEqual({
      ok: true,
      value: {
        testId: "t1",
        studentNumber: 1,
        obtained: 5,
        available: 5,
        firstName: null,
        lastName: null,
        scannedOnMs: null,
      },
    });
  });

  it("rejects invalid student numbers and test ids", () => {
    expect(normalizeResult({ ...validRaw, studentNumber: "0" }).ok).toBe(false);
    expect(normalizeResult({ ...validRaw, testId: "bad id" }).ok).toBe(false);
  });

  it("rejects invalid summary marks including obtained above available", () => {
    expect(normalizeResult({ ...validRaw, available: "0", obtained: "0" }).ok).toBe(false);
    expect(normalizeResult({ ...validRaw, available: "3", obtained: "4" }).ok).toBe(false);
    expect(normalizeResult({ ...validRaw, available: "3.5", obtained: "1" }).ok).toBe(false);
    expect(normalizeResult({ ...validRaw, available: "-1", obtained: "0" }).ok).toBe(false);
    expect(
      normalizeResult({
        ...validRaw,
        available: "9007199254740992",
        obtained: "1",
      }).ok,
    ).toBe(false);
  });

  it("rejects blank present names", () => {
    expect(normalizeResult({ ...validRaw, firstName: "   " }).ok).toBe(false);
    expect(normalizeResult({ ...validRaw, lastName: "\t" }).ok).toBe(false);
  });

  it("rejects invalid present scanned-on values", () => {
    expect(normalizeResult({ ...validRaw, scannedOn: "2024-06-01T12:00:00" }).ok).toBe(false);
    expect(normalizeResult({ ...validRaw, scannedOn: "not-a-dateZ" }).ok).toBe(false);
  });

  it("accepts explicit UTC offsets for scanned-on", () => {
    const outcome = normalizeResult({
      ...validRaw,
      scannedOn: "2024-06-01T12:00:00+10:00",
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.value.scannedOnMs).toBe(Date.parse("2024-06-01T12:00:00+10:00"));
    }
  });
});

describe("parseScannedOnMs", () => {
  it("returns null for absent values", () => {
    expect(parseScannedOnMs(undefined)).toEqual({ ok: true, value: null });
    expect(parseScannedOnMs(null)).toEqual({ ok: true, value: null });
  });
});

describe("retainedResultSchema", () => {
  it("accepts canonical retained records and rejects mark/identity violations", () => {
    const valid = {
      testId: "exam_1",
      studentNumber: 7,
      obtained: 0,
      available: 10,
      firstName: "Ada",
      lastName: null,
      scannedOnMs: null,
    };

    expect(retainedResultSchema.parse(valid)).toEqual(valid);
    expect(() => retainedResultSchema.parse({ ...valid, testId: "Exam" })).toThrow();
    expect(() => retainedResultSchema.parse({ ...valid, obtained: 11 })).toThrow();
  });
});

describe("rawResultInputSchema", () => {
  it("accepts stringly XML field shapes", () => {
    expect(rawResultInputSchema.parse(validRaw)).toMatchObject({
      studentNumber: "007",
      testId: " Exam_1 ",
    });
  });
});
