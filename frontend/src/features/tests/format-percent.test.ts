import { describe, expect, it } from "vitest";

import { formatPercent } from "./AggregateStats.tsx";

describe("formatPercent", () => {
  it("formats with up to two decimal places", () => {
    expect(formatPercent(51.4)).toBe("51.4%");
    expect(formatPercent(11.234)).toBe("11.23%");
    expect(formatPercent(30)).toBe("30%");
  });
});
