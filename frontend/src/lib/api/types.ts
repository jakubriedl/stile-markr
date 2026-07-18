export type TestListItem = {
  test_id: string;
  student_count: number;
  marks_available: number;
};

export type TestsResponse = {
  tests: TestListItem[];
};

export type AggregateResponse = {
  mean: number;
  stddev: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  count: number;
};

export type HistogramBin = {
  lower_pct: number;
  upper_pct: number;
  count: number;
};

export type HistogramResponse = {
  bins: HistogramBin[];
  total: number;
};

export type ImportSuccessResponse = {
  imported: number;
};

export type ApiErrorResponse = {
  error: string;
};
