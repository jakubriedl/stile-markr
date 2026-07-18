import { describe, expect, it, vi } from "vitest";

import { createGracefulShutdown } from "../../src/lifecycle.ts";

describe("createGracefulShutdown", () => {
  it("drains active requests once without force-closing connections", async () => {
    const stop = vi.fn(async () => undefined);
    const closeServer = createGracefulShutdown({ stop });

    await Promise.all([closeServer(), closeServer()]);

    expect(stop).toHaveBeenCalledOnce();
    expect(stop).toHaveBeenCalledWith(false);
  });
});
