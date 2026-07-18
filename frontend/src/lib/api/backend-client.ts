import type { AppType } from "@markr/backend/app";
import { hc } from "hono/client";

type FetchImplementation = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function createBackendClient(
  baseUrl: string,
  fetchImplementation: FetchImplementation = fetch,
) {
  return hc<AppType>(baseUrl, {
    fetch: fetchImplementation as typeof fetch,
  });
}
