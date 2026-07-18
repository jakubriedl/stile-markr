import { beforeEach, describe, expect, it, vi } from "vitest";

const setResponseHeaders = vi.fn();

vi.mock("h3", () => ({
  defineMiddleware: (handler: unknown) => handler,
  setResponseHeaders,
}));

describe("frontend security middleware", () => {
  beforeEach(() => {
    setResponseHeaders.mockClear();
  });

  it("sets the baseline browser security headers", async () => {
    const { default: securityMiddleware } = await import("../../server/middleware/security.ts");
    const event = {};

    await (securityMiddleware as unknown as (event: object) => Promise<void> | void)(event);

    expect(setResponseHeaders).toHaveBeenCalledWith(
      event,
      expect.objectContaining({
        "Content-Security-Policy": expect.stringContaining("default-src 'self'"),
        "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      }),
    );
  });
});
