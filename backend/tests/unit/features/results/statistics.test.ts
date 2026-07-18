import { describe, expect, it } from "vitest";

import {
  aggregateFromPercentages,
  buildHistogram,
  populationStdDev,
  type7Percentile,
} from "../../../../src/features/results/statistics.ts";

describe("type7Percentile", () => {
  it("interpolates at (N-1)*p", () => {
    const sample = [10, 20, 30, 40];
    expect(type7Percentile(sample, 0)).toBe(10);
    expect(type7Percentile(sample, 1)).toBe(40);
    expect(type7Percentile(sample, 0.5)).toBe(25);
    expect(type7Percentile([50], 0.25)).toBe(50);
  });
});

describe("populationStdDev", () => {
  it("returns zero for one sample and clamps negative variance", () => {
    expect(populationStdDev([40], 40)).toBe(0);
    expect(populationStdDev([10, 20], 15)).toBeCloseTo(Math.sqrt(25), 10);
  });
});

describe("aggregateFromPercentages", () => {
  it("matches a small hand-computed sample", () => {
    const stats = aggregateFromPercentages([30, 40, 50, 60]);
    expect(stats.count).toBe(4);
    expect(stats.mean).toBe(45);
    expect(stats.min).toBe(30);
    expect(stats.max).toBe(60);
    expect(stats.p25).toBe(37.5);
    expect(stats.p50).toBe(45);
    expect(stats.p75).toBe(52.5);
    expect(stats.stddev).toBeCloseTo(Math.sqrt(125), 10);
  });
});

describe("buildHistogram", () => {
  it("uses lower-inclusive bins and clamps 100 into the last bin", () => {
    const histogram = buildHistogram([0, 10, 99.9, 100]);
    expect(histogram.total).toBe(4);
    expect(histogram.bins).toHaveLength(10);
    expect(histogram.bins[0]?.count).toBe(1);
    expect(histogram.bins[1]?.count).toBe(1);
    expect(histogram.bins[9]?.count).toBe(2);
    expect(histogram.bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(4);
  });
});
