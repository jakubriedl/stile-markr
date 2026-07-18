import { Hono } from "hono";

export interface AppDependencies {
  readonly checkReadiness: () => boolean | Promise<boolean>;
}

export function createApp(dependencies: AppDependencies) {
  return new Hono()
    .get("/health", async (context) => {
      const isReady = await dependencies.checkReadiness();

      if (!isReady) {
        return context.json({ status: "unavailable" } as const, 503);
      }

      return context.json({ status: "ok" } as const, 200);
    })
    .notFound((context) => context.json({ error: "Not found" }, 404))
    .onError((error, context) => {
      console.error("Unhandled request failure", {
        error: error.name,
      });
      return context.json({ error: "Internal server error" }, 500);
    });
}

export type AppType = ReturnType<typeof createApp>;
