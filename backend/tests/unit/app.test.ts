import { describe, expect, it, vi } from "vitest";

import { createApp } from "../../src/app.ts";

describe("createApp", () => {
  it("reports readiness without binding a listener", async () => {
    const app = createApp({ checkReadiness: () => true });

    const response = await app.request("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("reports unavailable dependencies", async () => {
    const app = createApp({ checkReadiness: () => false });

    const response = await app.request("/health");

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "unavailable" });
  });

  it("returns the exact not-found contract", async () => {
    const app = createApp({ checkReadiness: () => true });

    const response = await app.request("/missing");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
    expect(response.headers.get("content-security-policy")).not.toBeNull();
  });

  it("maps unexpected failures without exposing details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = createApp({
      checkReadiness: () => {
        throw new Error("sensitive persistence detail");
      },
    });

    const response = await app.request("/health");

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Internal server error",
    });
    expect(response.headers.get("content-security-policy")).not.toBeNull();
    expect(log).toHaveBeenCalledWith("Unhandled request failure", {
      error: "Error",
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain("sensitive persistence detail");
  });
});
