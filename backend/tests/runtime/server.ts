import { Hono } from "hono";

const PRODUCT_BODY_LIMIT = 52_428_800;
const encoder = new TextEncoder();
let observedRequestBytes = 0;
let responseStreamController: ReadableStreamDefaultController<Uint8Array> | undefined;
const app = new Hono()
  .post("/stream", async (event) => {
    const reader = event.req.raw.body?.getReader();
    let bytes = 0;
    observedRequestBytes = 0;

    if (reader) {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) {
          break;
        }
        bytes += chunk.value.byteLength;
        observedRequestBytes = bytes;
        if (bytes > PRODUCT_BODY_LIMIT) {
          return event.json({ error: "Payload too large" }, 413);
        }
      }
    }

    return event.json(
      {
        bytes,
        traceparent: event.req.header("traceparent") ?? null,
      },
      200,
    );
  })
  .get("/stream-status", (event) => event.json({ bytes: observedRequestBytes }))
  .get(
    "/response-stream",
    () =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            responseStreamController = controller;
            controller.enqueue(encoder.encode("first\n"));
          },
        }),
        { headers: { "content-type": "text/plain" } },
      ),
  )
  .post("/release-response", (event) => {
    if (!responseStreamController) {
      return event.json({ error: "No response stream" }, 409);
    }
    responseStreamController.enqueue(encoder.encode("second\n"));
    responseStreamController.close();
    responseStreamController = undefined;
    return event.json({ released: true });
  })
  .get("/slow", async (event) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return event.json({ status: "completed" }, 200);
  });

const server = Bun.serve({
  fetch: app.fetch,
  maxRequestBodySize: PRODUCT_BODY_LIMIT + 1024,
  port: 0,
});

let closing = false;
async function close() {
  if (closing) {
    return;
  }
  closing = true;
  await server.stop(false);
}

process.once("SIGTERM", () => {
  void close();
});

console.info("runtime-server-ready", { port: server.port });
