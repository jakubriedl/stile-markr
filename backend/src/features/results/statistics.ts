/** Type 7 percentile over a sorted ascending sample. */
export function type7Percentile(sortedAscending: readonly number[], p: number): number {
  const n = sortedAscending.length;
  if (n === 0) {
    throw new Error("type7Percentile requires a non-empty sample");
  }
  if (n === 1) {
    return sortedAscending[0]!;
  }

  const index = (n - 1) * p;
  const low = Math.floor(index);
  const high = Math.ceil(index);
  if (low === high) {
    return sortedAscending[low]!;
  }

  const weight = index - low;
  return sortedAscending[low]! + (sortedAscending[high]! - sortedAscending[low]!) * weight;
}

/** Population standard deviation; clamps tiny negative variance to zero. */
export function populationStdDev(values: readonly number[], mean: number): number {
  if (values.length === 0) {
    return 0;
  }
  if (values.length === 1) {
    return 0;
  }

  let sumSquares = 0;
  for (const value of values) {
    const delta = value - mean;
    sumSquares += delta * delta;
  }
  const variance = Math.max(0, sumSquares / values.length);
  return Math.sqrt(variance);
}

export function meanOf(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  let sum = 0;
  for (const value of values) {
    sum += value;
  }
  return sum / values.length;
}

export const HISTOGRAM_BOUNDS = [
  [0, 10],
  [10, 20],
  [20, 30],
  [30, 40],
  [40, 50],
  [50, 60],
  [60, 70],
  [70, 80],
  [80, 90],
  [90, 100],
] as const;

export function binPercentage(pct: number): number {
  if (pct >= 100) {
    return 9;
  }
  if (pct < 0) {
    return 0;
  }
  return Math.min(9, Math.floor(pct / 10));
}

export function buildHistogram(percentages: readonly number[]): {
  bins: { lower_pct: number; upper_pct: number; count: number }[];
  total: number;
} {
  const counts = Array.from({ length: 10 }, () => 0);
  for (const pct of percentages) {
    counts[binPercentage(pct)]! += 1;
  }

  return {
    total: percentages.length,
    bins: HISTOGRAM_BOUNDS.map(([lower_pct, upper_pct], index) => ({
      lower_pct,
      upper_pct,
      count: counts[index]!,
    })),
  };
}

export function aggregateFromPercentages(percentages: readonly number[]): {
  mean: number;
  stddev: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  count: number;
} {
  const sorted = [...percentages].sort((a, b) => a - b);
  const mean = meanOf(sorted);

  return {
    count: sorted.length,
    mean,
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
    p25: type7Percentile(sorted, 0.25),
    p50: type7Percentile(sorted, 0.5),
    p75: type7Percentile(sorted, 0.75),
    stddev: populationStdDev(sorted, mean),
  };
}
