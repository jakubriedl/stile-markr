import { http, HttpResponse } from "msw";

import type { AggregateResponse, HistogramResponse, TestsResponse } from "../../lib/api/types.ts";

const sampleAggregate: AggregateResponse = {
  mean: 50.80246913580247,
  stddev: 9.92119535943923,
  min: 30,
  max: 75,
  p25: 45,
  p50: 50,
  p75: 55,
  count: 81,
};

const sampleHistogram: HistogramResponse = {
  total: 81,
  bins: [
    { lower_pct: 0, upper_pct: 10, count: 0 },
    { lower_pct: 10, upper_pct: 20, count: 0 },
    { lower_pct: 20, upper_pct: 30, count: 0 },
    { lower_pct: 30, upper_pct: 40, count: 6 },
    { lower_pct: 40, upper_pct: 50, count: 28 },
    { lower_pct: 50, upper_pct: 60, count: 28 },
    { lower_pct: 60, upper_pct: 70, count: 14 },
    { lower_pct: 70, upper_pct: 80, count: 5 },
    { lower_pct: 80, upper_pct: 90, count: 0 },
    { lower_pct: 90, upper_pct: 100, count: 0 },
  ],
};

const sampleTests: TestsResponse = {
  tests: [{ test_id: "9863", student_count: 81, marks_available: 20 }],
};

export function createMarkrHandlers(baseUrl = "http://localhost") {
  return [
    http.get(new URL("/api/tests", baseUrl).href, ({ request }) => {
      if (request.headers.get("If-None-Match") === '"tests-v1"') {
        return new HttpResponse(null, { status: 304, headers: { ETag: '"tests-v1"' } });
      }
      return HttpResponse.json(sampleTests, {
        headers: { ETag: '"tests-v1"', "Cache-Control": "no-cache" },
      });
    }),
    http.get(new URL("/api/results/:testId/aggregate", baseUrl).href, ({ params, request }) => {
      if (params.testId !== "9863") {
        return HttpResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (request.headers.get("If-None-Match") === '"agg-v1"') {
        return new HttpResponse(null, { status: 304, headers: { ETag: '"agg-v1"' } });
      }
      return HttpResponse.json(sampleAggregate, {
        headers: { ETag: '"agg-v1"', "Cache-Control": "no-cache" },
      });
    }),
    http.get(new URL("/api/results/:testId/histogram", baseUrl).href, ({ params }) => {
      if (params.testId !== "9863") {
        return HttpResponse.json({ error: "Not found" }, { status: 404 });
      }
      return HttpResponse.json(sampleHistogram, {
        headers: { ETag: '"hist-v1"', "Cache-Control": "no-cache" },
      });
    }),
    http.post(new URL("/api/import", baseUrl).href, async ({ request }) => {
      const contentType = request.headers.get("Content-Type") ?? "";
      if (!contentType.startsWith("text/xml+markr")) {
        return HttpResponse.json({ error: "Unsupported media type" }, { status: 415 });
      }
      return HttpResponse.json({ imported: 81 });
    }),
  ];
}
