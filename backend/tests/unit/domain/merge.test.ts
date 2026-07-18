import { describe, expect, it } from "vitest";

import {
  foldRetainedResults,
  mergeRetainedResults,
  selectMetadata,
} from "../../../src/domain/merge.ts";
import type { RetainedResult } from "../../../src/domain/result.ts";

function result(
  overrides: Partial<RetainedResult> & Pick<RetainedResult, "obtained" | "available">,
): RetainedResult {
  return {
    testId: "exam",
    studentNumber: 1,
    firstName: null,
    lastName: null,
    scannedOnMs: null,
    ...overrides,
  };
}

describe("selectMetadata", () => {
  it("prefers the chronologically later scan when both timestamps exist", () => {
    expect(
      selectMetadata(
        {
          firstName: "Old",
          lastName: "A",
          scannedOnMs: 100,
        },
        {
          firstName: "New",
          lastName: "B",
          scannedOnMs: 200,
        },
      ),
    ).toEqual({
      firstName: "New",
      lastName: "B",
      scannedOnMs: 200,
    });

    expect(
      selectMetadata(
        {
          firstName: "Keeper",
          lastName: "A",
          scannedOnMs: 300,
        },
        {
          firstName: "Older",
          lastName: "B",
          scannedOnMs: 100,
        },
      ),
    ).toEqual({
      firstName: "Keeper",
      lastName: "A",
      scannedOnMs: 300,
    });
  });

  it("uses the last-received record when timestamps are equal or either is absent", () => {
    expect(
      selectMetadata(
        { firstName: "A", lastName: null, scannedOnMs: 100 },
        { firstName: "B", lastName: "X", scannedOnMs: 100 },
      ),
    ).toEqual({ firstName: "B", lastName: "X", scannedOnMs: 100 });

    expect(
      selectMetadata(
        { firstName: "A", lastName: null, scannedOnMs: null },
        { firstName: "B", lastName: null, scannedOnMs: 50 },
      ),
    ).toEqual({ firstName: "B", lastName: null, scannedOnMs: 50 });

    expect(
      selectMetadata(
        { firstName: "A", lastName: null, scannedOnMs: 50 },
        { firstName: "B", lastName: null, scannedOnMs: null },
      ),
    ).toEqual({ firstName: "B", lastName: null, scannedOnMs: null });
  });
});

describe("mergeRetainedResults", () => {
  it("retains independent score maxima regardless of order", () => {
    const highObtained = result({
      obtained: 9,
      available: 10,
      firstName: "First",
      scannedOnMs: 100,
    });
    const highAvailable = result({
      obtained: 2,
      available: 20,
      firstName: "Second",
      scannedOnMs: 200,
    });

    expect(mergeRetainedResults(highObtained, highAvailable)).toEqual({
      testId: "exam",
      studentNumber: 1,
      obtained: 9,
      available: 20,
      firstName: "Second",
      lastName: null,
      scannedOnMs: 200,
    });

    // Existing scan is chronologically later, so its metadata is retained.
    expect(mergeRetainedResults(highAvailable, highObtained)).toEqual({
      testId: "exam",
      studentNumber: 1,
      obtained: 9,
      available: 20,
      firstName: "Second",
      lastName: null,
      scannedOnMs: 200,
    });
  });

  it("never lets a later lower score replace a higher maximum", () => {
    const merged = mergeRetainedResults(
      result({ obtained: 8, available: 10, scannedOnMs: 1 }),
      result({ obtained: 3, available: 9, scannedOnMs: 2 }),
    );

    expect(merged.obtained).toBe(8);
    expect(merged.available).toBe(10);
  });

  it("rejects mismatched identities", () => {
    expect(() =>
      mergeRetainedResults(
        result({ obtained: 1, available: 1 }),
        result({ testId: "other", obtained: 1, available: 1 }),
      ),
    ).toThrow(/matching result identity/);
  });
});

describe("foldRetainedResults", () => {
  it("deduplicates by identity across an ordered stream", () => {
    const folded = foldRetainedResults([
      result({
        studentNumber: 1,
        obtained: 4,
        available: 10,
        firstName: "A",
        scannedOnMs: 10,
      }),
      result({
        studentNumber: 2,
        obtained: 1,
        available: 5,
        firstName: "Solo",
        scannedOnMs: null,
      }),
      result({
        studentNumber: 1,
        obtained: 9,
        available: 8,
        firstName: "B",
        scannedOnMs: 5,
      }),
    ]);

    expect(folded.size).toBe(2);
    expect(folded.get("exam\u00001")).toEqual({
      testId: "exam",
      studentNumber: 1,
      obtained: 9,
      available: 10,
      firstName: "A",
      lastName: null,
      scannedOnMs: 10,
    });
    expect(folded.get("exam\u00002")?.firstName).toBe("Solo");
  });
});
