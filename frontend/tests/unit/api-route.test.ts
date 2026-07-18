import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("h3", () => ({
  defineHandler: (handler: unknown) => handler,
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Nitro API proxy route", () => {
  it("removes the API prefix and preserves the request", async () => {
    const upstreamFetch = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(async () => Response.json({ status: "ok" }));
    vi.stubGlobal("fetch", upstreamFetch);
    const { default: apiRoute } = await import("../../server/routes/api/[...path].ts");
    const request = new Request("http://markr.local/api/tests?limit=10");
    const event: { req: Request; url: URL } = {
      req: request,
      url: new URL(request.url),
    };

    const response = await (
      apiRoute as unknown as (routeEvent: { req: Request; url: URL }) => Promise<Response>
    )(event);

    expect(upstreamFetch).toHaveBeenCalledOnce();
    expect(String(upstreamFetch.mock.calls[0]?.[0])).toBe("http://127.0.0.1:4567/tests?limit=10");
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
