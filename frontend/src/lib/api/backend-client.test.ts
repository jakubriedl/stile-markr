import { describe, expect, it, vi } from "vitest";

import { createBackendClient } from "./backend-client.ts";

describe("createBackendClient", () => {
  it("consumes the exported backend RPC contract", async () => {
    const fetchImplementation = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(async () => Response.json({ status: "ok" } as const));
    const client = createBackendClient("http://backend.markr.test", fetchImplementation);

    const response = await client.health.$get({});
    const body = await response.json();
    const typedBody: { status: "ok" } | { status: "unavailable" } = body;

    expect(typedBody).toEqual({ status: "ok" });
    expect(fetchImplementation).toHaveBeenCalledOnce();
  });
});
