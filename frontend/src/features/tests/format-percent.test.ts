import { describe, expect, it } from "vitest";

import { formatPercent, formatPercentSpoken } from "./AggregateStats.tsx";

describe("formatPercent", () => {
  it("formats with up to two decimal places", () => {
    expect(formatPercent(51.4)).toBe("51.4%");
    expect(formatPercent(11.234)).toBe("11.23%");
    expect(formatPercent(30)).toBe("30%");
  });
});

describe("formatPercentSpoken", () => {
  it("speaks the unit as a word without a percent character", () => {
    expect(formatPercentSpoken(51.4)).toBe("51.4 percent");
    expect(formatPercentSpoken(11.234)).toBe("11.23 percent");
    expect(formatPercentSpoken(30)).toBe("30 percent");
  });
});
