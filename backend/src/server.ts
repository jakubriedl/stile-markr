import { createApp } from "./app.ts";

const DEFAULT_PORT = 4567;
const MAX_REQUEST_BODY_SIZE = 52_428_800;

const port = Number.parseInt(process.env.PORT ?? String(DEFAULT_PORT), 10);
const app = createApp({ checkReadiness: () => true });

const server = Bun.serve({
  fetch: app.fetch,
  maxRequestBodySize: MAX_REQUEST_BODY_SIZE + 1,
  port,
});

let isClosing = false;

async function closeServer() {
  if (isClosing) {
    return;
  }

  isClosing = true;
  await server.stop(true);
}

process.once("SIGINT", () => {
  void closeServer();
});

process.once("SIGTERM", () => {
  void closeServer();
});

console.info("Markr backend ready", { port: server.port });
