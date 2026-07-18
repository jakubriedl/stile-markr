import { createRequestLogger, initLogger, type WideEvent } from "evlog";

const drainedEvents: WideEvent[] = [];

initLogger({
  drain: ({ event }) => {
    drainedEvents.push(event);
  },
  env: {
    environment: "runtime-gate",
    service: "markr-backend",
  },
  pretty: false,
  redact: {
    paths: ["studentNumber", "firstName", "lastName", "xml"],
  },
  silent: true,
});

const logger = createRequestLogger({
  method: "GATE",
  path: "/runtime-compatibility",
});
logger.set({
  operation: "runtime-compatibility",
  runtime: {
    name: "bun",
  },
});
logger.emit({ status: 200 });

if (
  drainedEvents.length !== 1 ||
  drainedEvents[0]?.service !== "markr-backend" ||
  drainedEvents[0].status !== 200
) {
  throw new Error("evlog drain gate failed");
}

console.info("runtime-evlog-gate:ok");
