export type EtagCacheEntry<T> = {
  etag: string | null;
  data: T;
};

export type EtagFetchResult<T> =
  | { status: "ok"; data: T; etag: string | null; fromCache: false }
  | { status: "not_modified"; data: T; etag: string | null; fromCache: true }
  | { status: "error"; statusCode: number; body: unknown };

/**
 * Fetch JSON with If-None-Match support. On 304, preserves the previous cached payload.
 */
export async function fetchJsonWithEtag<T>(
  url: string,
  cache: EtagCacheEntry<T> | null,
  fetchImplementation: typeof fetch = fetch,
): Promise<EtagFetchResult<T>> {
  const headers = new Headers({ Accept: "application/json" });
  if (cache?.etag) {
    headers.set("If-None-Match", cache.etag);
  }

  const response = await fetchImplementation(url, { headers });

  if (response.status === 304) {
    if (cache == null) {
      return { status: "error", statusCode: 304, body: null };
    }
    return {
      status: "not_modified",
      data: cache.data,
      etag: cache.etag,
      fromCache: true,
    };
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return { status: "error", statusCode: response.status, body };
  }

  return {
    status: "ok",
    data: body as T,
    etag: response.headers.get("ETag"),
    fromCache: false,
  };
}
