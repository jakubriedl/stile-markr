import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { mockServer } from "../../../tests/msw-server.ts";
import { fetchJsonWithEtag } from "./etag-fetch.ts";

describe("fetchJsonWithEtag", () => {
  it("stores ETags and preserves cached data on 304", async () => {
    let hits = 0;
    mockServer.use(
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

  it("treats a bare 304 without cache as an error and maps HTTP failures", async () => {
    mockServer.use(
      http.get("http://localhost/api/tests", () => {
        return new HttpResponse(null, { status: 304, headers: { ETag: '"v1"' } });
      }),
      http.get("http://localhost/api/missing", () =>
        HttpResponse.json({ error: "Not found" }, { status: 404 }),
      ),
    );

    await expect(fetchJsonWithEtag("http://localhost/api/tests", null)).resolves.toEqual({
      status: "error",
      statusCode: 304,
      body: null,
    });

    await expect(fetchJsonWithEtag("http://localhost/api/missing", null)).resolves.toEqual({
      status: "error",
      statusCode: 404,
      body: { error: "Not found" },
    });
  });
});

