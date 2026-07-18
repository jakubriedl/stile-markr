import { createApp } from "./app.ts";
import { openMarkrDatabases } from "./db/client.ts";
import { createImportAdmissionQueue } from "./features/import/queue.ts";
import { createGracefulShutdown } from "./lifecycle.ts";

const DEFAULT_PORT = 4567;
const MAX_REQUEST_BODY_SIZE = 52_428_800;

const port = Number.parseInt(process.env.PORT ?? String(DEFAULT_PORT), 10);
const databasePath = process.env.DATABASE_PATH ?? "./markr.sqlite";
const databases = openMarkrDatabases(databasePath);
const importQueue = createImportAdmissionQueue();

const app = createApp({
  checkReadiness: () => {
    try {
      databases.write.prepare("SELECT 1 AS ok").get();
      return true;
    } catch {
      return false;
    }
  },
  importRoutes: {
    getWriteDb: () => databases.write,
    queue: importQueue,
  },
  resultsRoutes: {
    getReadDb: () => databases.read,
  },
});

const server = Bun.serve({
  fetch: app.fetch,
  maxRequestBodySize: MAX_REQUEST_BODY_SIZE + 1,
  port,
});

const closeServer = createGracefulShutdown(server);

const shutdown = async () => {
  await closeServer();
  databases.close();
};

process.once("SIGINT", () => {
  void shutdown();
});

process.once("SIGTERM", () => {
  void shutdown();
});

console.info("Markr backend ready", { port: server.port });
