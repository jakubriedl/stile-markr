import { Hono } from "hono";

import { contentEtag, etagMatches } from "./etag.ts";
import { getAggregate, getHistogram, listTests, type ResultsDatabase } from "./queries.ts";

export type ResultsRouteDependencies = {
  getReadDb: () => ResultsDatabase;
};

export function createResultsRoutes(dependencies: ResultsRouteDependencies) {
  return new Hono()
    .get("/tests", async (context) => {
      const payload = { tests: listTests(dependencies.getReadDb()) };
      const etag = contentEtag(payload);
      if (etagMatches(context.req.header("if-none-match"), etag)) {
        context.header("ETag", etag);
        context.header("Cache-Control", "no-cache");
        return context.body(null, 304);
      }
      context.header("ETag", etag);
      context.header("Cache-Control", "no-cache");
      return context.json(payload, 200);
    })
    .get("/results/:testId/aggregate", async (context) => {
      const result = getAggregate(dependencies.getReadDb(), context.req.param("testId"));
      if (!result.ok) {
        return context.json({ error: "Not found" }, 404);
      }
      const etag = contentEtag(result.value);
      if (etagMatches(context.req.header("if-none-match"), etag)) {
        context.header("ETag", etag);
        context.header("Cache-Control", "no-cache");
        return context.body(null, 304);
      }
      context.header("ETag", etag);
      context.header("Cache-Control", "no-cache");
      return context.json(result.value, 200);
    })
    .get("/results/:testId/histogram", async (context) => {
      const result = getHistogram(dependencies.getReadDb(), context.req.param("testId"));
      if (!result.ok) {
        return context.json({ error: "Not found" }, 404);
      }
      const etag = contentEtag(result.value);
      if (etagMatches(context.req.header("if-none-match"), etag)) {
        context.header("ETag", etag);
        context.header("Cache-Control", "no-cache");
        return context.body(null, 304);
      }
      context.header("ETag", etag);
      context.header("Cache-Control", "no-cache");
      return context.json(result.value, 200);
    });
}
