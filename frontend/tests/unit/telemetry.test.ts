import { describe, expect, it, vi } from "vitest";

vi.mock("nitro", () => ({
  definePlugin: (plugin: unknown) => plugin,
}));

describe("frontend telemetry plugin", () => {
  it("registers runtime cleanup with Nitro", async () => {
    const { default: telemetryPlugin } = await import("../../server/plugins/telemetry.ts");
    let closeHook: (() => Promise<void>) | undefined;
    const hook = vi.fn((name: string, callback: () => Promise<void>) => {
      if (name === "close") {
        closeHook = callback;
      }
    });

    (telemetryPlugin as unknown as (app: { hooks: { hook: typeof hook } }) => void)({
      hooks: { hook },
    });

    expect(hook).toHaveBeenCalledWith("close", expect.any(Function));
    await closeHook?.();
  });
});
