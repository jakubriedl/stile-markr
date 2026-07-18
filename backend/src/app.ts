import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";

import { createImportRoutes, type ImportRouteDependencies } from "./features/import/routes.ts";
import { createResultsRoutes, type ResultsRouteDependencies } from "./features/results/routes.ts";

export interface AppDependencies {
  readonly checkReadiness: () => boolean | Promise<boolean>;
  readonly importRoutes?: ImportRouteDependencies;
  readonly resultsRoutes?: ResultsRouteDependencies;
}

export function createApp(dependencies: AppDependencies) {
  const app = new Hono()
    .use(
      "*",
      secureHeaders({
        contentSecurityPolicy: {
          baseUri: ["'none'"],
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
        permissionsPolicy: {
          camera: [],
          geolocation: [],
          microphone: [],
        },
        strictTransportSecurity: false,
      }),
    )
    .get("/health", async (context) => {
      const isReady = await dependencies.checkReadiness();

      if (!isReady) {
        return context.json({ status: "unavailable" } as const, 503);
      }

      return context.json({ status: "ok" } as const, 200);
    });

  if (dependencies.importRoutes) {
    app.route("/", createImportRoutes(dependencies.importRoutes));
  }

  if (dependencies.resultsRoutes) {
    app.route("/", createResultsRoutes(dependencies.resultsRoutes));
  }

  return app
    .notFound((context) => context.json({ error: "Not found" }, 404))
    .onError((error, context) => {
      console.error("Unhandled request failure", {
        error: error.name,
      });
      return context.json({ error: "Internal server error" }, 500);
    });
}

export type AppType = ReturnType<typeof createApp>;
