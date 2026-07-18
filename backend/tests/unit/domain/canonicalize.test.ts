import { describe, expect, it } from "vitest";

import {
  MAX_STUDENT_NUMBER,
  canonicalizeStudentNumber,
  canonicalizeTestId,
  isCanonicalTestId,
  resultIdentityKey,
} from "../../../src/domain/canonicalize.ts";

describe("canonicalizeStudentNumber", () => {
  it("accepts positive integers and strips leading zeroes for identity", () => {
    expect(canonicalizeStudentNumber("42")).toEqual({ ok: true, value: 42 });
    expect(canonicalizeStudentNumber("007")).toEqual({ ok: true, value: 7 });
    expect(canonicalizeStudentNumber("00000000000000042")).toEqual({
      ok: true,
      value: 42,
    });
    expect(canonicalizeStudentNumber(String(MAX_STUDENT_NUMBER))).toEqual({
      ok: true,
      value: MAX_STUDENT_NUMBER,
    });
  });

  it("rejects empty, non-digit, zero, and out-of-range values", () => {
    expect(canonicalizeStudentNumber("")).toEqual({ ok: false, reason: "empty" });
    expect(canonicalizeStudentNumber("12a")).toEqual({
      ok: false,
      reason: "invalid_format",
    });
    expect(canonicalizeStudentNumber("-1")).toEqual({
      ok: false,
      reason: "invalid_format",
    });
    expect(canonicalizeStudentNumber("0")).toEqual({
      ok: false,
      reason: "out_of_range",
    });
    expect(canonicalizeStudentNumber("000")).toEqual({
      ok: false,
      reason: "out_of_range",
    });
    expect(canonicalizeStudentNumber(String(MAX_STUDENT_NUMBER + 1))).toEqual({
      ok: false,
      reason: "out_of_range",
    });
    expect(canonicalizeStudentNumber("90071992547409912")).toEqual({
      ok: false,
      reason: "out_of_range",
    });
  });
});

describe("canonicalizeTestId", () => {
  it("trims and lowercases valid test ids", () => {
    expect(canonicalizeTestId("  Exam_1-A ")).toEqual({
      ok: true,
      value: "exam_1-a",
    });
  });

  it("rejects empty and invalid characters", () => {
    expect(canonicalizeTestId("")).toEqual({ ok: false, reason: "empty" });
    expect(canonicalizeTestId("   ")).toEqual({ ok: false, reason: "empty" });
    expect(canonicalizeTestId("exam 1")).toEqual({
      ok: false,
      reason: "invalid_format",
    });
    expect(canonicalizeTestId("exam.id")).toEqual({
      ok: false,
      reason: "invalid_format",
    });
  });
});

describe("isCanonicalTestId", () => {
  it("accepts only already-canonical forms", () => {
    expect(isCanonicalTestId("exam_1-a")).toBe(true);
    expect(isCanonicalTestId("Exam")).toBe(false);
    expect(isCanonicalTestId("")).toBe(false);
  });
});

describe("resultIdentityKey", () => {
  it("joins canonical identity parts stably", () => {
    expect(resultIdentityKey("exam", 7)).toBe("exam\u00007");
  });
});
