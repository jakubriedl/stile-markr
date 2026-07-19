import { describe, expect, it } from "vitest";

import { clampPercent } from "./PercentDonut.tsx";

describe("clampPercent", () => {
  it("clamps values into the 0–100 range", () => {
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent(-8)).toBe(0);
    expect(clampPercent(50)).toBe(50);
  });
});
