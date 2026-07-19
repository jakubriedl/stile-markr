import { describe, expect, it } from "vitest";

import { formatUploadErrorText, parseApiErrorBody } from "./format-upload-error.ts";

describe("parseApiErrorBody", () => {
  it("maps the malformed XML contract to a friendlier summary and keeps guidance", () => {
    expect(
      parseApiErrorBody({
        error: "Invalid XML format",
        path: "Around line 2, column 1",
        fix: "Repair matching tags.",
      }),
    ).toEqual({
      summary: "This file isn't valid XML, so Markr couldn't import it.",
      path: "Around line 2, column 1",
      fix: "Repair matching tags.",
    });
  });

  it("keeps descriptive error strings for other failures", () => {
    expect(
      parseApiErrorBody({
        error: "A student number is missing or not a valid whole number.",
        path: "mcq-test-results → result #1 → <student-number>",
        fix: "Set a positive whole number.",
      }),
    ).toMatchObject({
      summary: "A student number is missing or not a valid whole number.",
      path: expect.stringContaining("result #1"),
    });
  });
});

describe("formatUploadErrorText", () => {
  it("joins summary, where, and how-to-fix for plain-text fallbacks", () => {
    expect(
      formatUploadErrorText({
        summary: "Problem",
        path: "Somewhere",
        fix: "Do this",
      }),
    ).toBe("Problem\nWhere: Somewhere\nHow to fix: Do this");
  });
});
