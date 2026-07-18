import { fetchJsonWithEtag, type EtagCacheEntry } from "./etag-fetch.ts";
import type {
  AggregateResponse,
  HistogramResponse,
  ImportSuccessResponse,
  TestsResponse,
} from "./types.ts";

export type MarkrApiOptions = {
  /** Browser same-origin base, typically "" so paths are `/api/...`. */
  baseUrl?: string;
  fetchImplementation?: typeof fetch;
};

function apiPath(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  return `${normalizedBase}${path}`;
}

export function createMarkrApi({
  baseUrl = "",
  fetchImplementation = fetch,
}: MarkrApiOptions = {}) {
  return {
    async getTests(cache: EtagCacheEntry<TestsResponse> | null = null) {
      return fetchJsonWithEtag<TestsResponse>(
        apiPath(baseUrl, "/api/tests"),
        cache,
        fetchImplementation,
      );
    },

    async getAggregate(testId: string, cache: EtagCacheEntry<AggregateResponse> | null = null) {
      return fetchJsonWithEtag<AggregateResponse>(
        apiPath(baseUrl, `/api/results/${encodeURIComponent(testId)}/aggregate`),
        cache,
        fetchImplementation,
      );
    },

    async getHistogram(testId: string, cache: EtagCacheEntry<HistogramResponse> | null = null) {
      return fetchJsonWithEtag<HistogramResponse>(
        apiPath(baseUrl, `/api/results/${encodeURIComponent(testId)}/histogram`),
        cache,
        fetchImplementation,
      );
    },

    async importXml(body: BodyInit, contentType = "text/xml+markr") {
      const response = await fetchImplementation(apiPath(baseUrl, "/api/import"), {
        method: "POST",
        headers: {
          "Content-Type": contentType,
          Accept: "application/json",
        },
        body,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        return {
          ok: false as const,
          statusCode: response.status,
          body: payload,
        };
      }
      return {
        ok: true as const,
        data: payload as ImportSuccessResponse,
      };
    },
  };
}

export type MarkrApi = ReturnType<typeof createMarkrApi>;
