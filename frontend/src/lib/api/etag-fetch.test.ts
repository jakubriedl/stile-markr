import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { fetchJsonWithEtag } from "./etag-fetch.ts";

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("fetchJsonWithEtag", () => {
  it("stores ETags and preserves cached data on 304", async () => {
    let hits = 0;
    server.use(
      http.get("http://localhost/api/tests", ({ request }) => {
        hits += 1;
        if (request.headers.get("If-None-Match") === '"v1"') {
          return new HttpResponse(null, { status: 304, headers: { ETag: '"v1"' } });
        }
        return HttpResponse.json(
          { tests: [{ test_id: "9863", student_count: 1, marks_available: 20 }] },
          { headers: { ETag: '"v1"' } },
        );
      }),
    );

    const first = await fetchJsonWithEtag<{
      tests: { test_id: string; student_count: number; marks_available: number }[];
    }>("http://localhost/api/tests", null);

    expect(first.status).toBe("ok");
    if (first.status !== "ok") {
      return;
    }

    const second = await fetchJsonWithEtag("http://localhost/api/tests", {
      etag: first.etag,
      data: first.data,
    });

    expect(second).toEqual({
      status: "not_modified",
      data: first.data,
      etag: '"v1"',
      fromCache: true,
    });
    expect(hits).toBeGreaterThanOrEqual(2);
  });
});
