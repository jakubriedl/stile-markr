import { http, HttpResponse } from "msw";

export function createFoundationHandlers(baseUrl = "http://localhost") {
  return [
    http.get(new URL("/api/foundation", baseUrl).href, () => HttpResponse.json({ ready: true })),
  ];
}
