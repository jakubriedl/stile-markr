// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { proxyApiRequest } from "./proxy.server.ts";

describe("proxyApiRequest", () => {
  it("forwards request and response streams without reading them", async () => {
    const requestStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("<xml />"));
        controller.close();
      },
    });
    const responseStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"imported":1}'));
        controller.close();
      },
    });
    const request = new Request("http://markr.local/api/import", {
      body: requestStream,
      duplex: "half",
      headers: {
        "content-type": "text/xml+markr",
        traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
      },
      method: "POST",
    } as RequestInit & { duplex: "half" });
    const fetchImplementation = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(
      async () =>
        new Response(responseStream, {
          headers: {
            "content-type": "application/json",
            etag: '"import-1"',
          },
          status: 200,
        }),
    );

    const response = await proxyApiRequest(request, "import", fetchImplementation);

    expect(fetchImplementation).toHaveBeenCalledOnce();
    expect(fetchImplementation.mock.calls[0]?.[1]?.body).toBe(requestStream);
    expect(new Headers(fetchImplementation.mock.calls[0]?.[1]?.headers).get("traceparent")).toBe(
      "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
    );
    expect(response.body).toBe(responseStream);
    expect(response.headers.get("etag")).toBe('"import-1"');
  });

  it("rejects cross-origin browser requests", async () => {
    const request = new Request("http://markr.local/api/tests", {
      headers: { origin: "https://attacker.invalid" },
    });
    const fetchImplementation =
      vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

    const response = await proxyApiRequest(request, "tests", fetchImplementation);

    expect(response.status).toBe(403);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });
});
