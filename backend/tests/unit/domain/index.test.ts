import { describe, expect, it } from "vitest";

import * as domain from "../../../src/domain/index.ts";

describe("domain public exports", () => {
  it("exposes normalization and merge entrypoints", () => {
    expect(typeof domain.normalizeResult).toBe("function");
    expect(typeof domain.mergeRetainedResults).toBe("function");
    expect(typeof domain.canonicalizeTestId).toBe("function");
    expect(domain.MAX_STUDENT_NUMBER).toBe(9_007_199_254_740_991);
  });
});
