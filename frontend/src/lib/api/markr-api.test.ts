import { describe, expect, it } from "vitest";

import { mockServer } from "../../../tests/msw-server.ts";
import { createMarkrHandlers } from "../../mocks/handlers/markr.ts";
import { createMarkrApi } from "./markr-api.ts";

describe("createMarkrApi", () => {
  it("loads tests, aggregate, and histogram with ETag reuse", async () => {
    mockServer.use(...createMarkrHandlers());
    const api = createMarkrApi({ baseUrl: "http://localhost" });

    const tests = await api.getTests();
    expect(tests.status).toBe("ok");
    if (tests.status !== "ok") {
      return;
    }
    expect(tests.data.tests[0]?.test_id).toBe("9863");

    const cachedTests = await api.getTests({ etag: tests.etag, data: tests.data });
    expect(cachedTests.status).toBe("not_modified");

    const aggregate = await api.getAggregate("9863");
    expect(aggregate.status).toBe("ok");
    if (aggregate.status !== "ok") {
      return;
    }
    expect(aggregate.data.count).toBe(81);

    const cachedAggregate = await api.getAggregate("9863", {
      etag: aggregate.etag,
      data: aggregate.data,
    });
    expect(cachedAggregate.status).toBe("not_modified");

    const histogram = await api.getHistogram("9863");
    expect(histogram.status).toBe("ok");
    if (histogram.status !== "ok") {
      return;
    }
    expect(histogram.data.total).toBe(81);
    expect(histogram.data.bins).toHaveLength(10);
  });

  it("maps missing results to error responses", async () => {
    mockServer.use(...createMarkrHandlers());
    const api = createMarkrApi({ baseUrl: "http://localhost" });

    const aggregate = await api.getAggregate("missing");
    expect(aggregate).toMatchObject({ status: "error", statusCode: 404 });

    const histogram = await api.getHistogram("missing");
    expect(histogram).toMatchObject({ status: "error", statusCode: 404 });
  });

  it("imports XML and rejects unsupported media types", async () => {
    mockServer.use(...createMarkrHandlers());
    const api = createMarkrApi({ baseUrl: "http://localhost" });

    const imported = await api.importXml("<results />");
    expect(imported).toEqual({ ok: true, data: { imported: 81 } });

    const rejected = await api.importXml("<results />", "application/xml");
    expect(rejected.ok).toBe(false);
    if (rejected.ok) {
      return;
    }
    expect(rejected.statusCode).toBe(415);
  });
});
