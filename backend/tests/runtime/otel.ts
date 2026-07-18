import { context, createContextKey, propagation, trace, TraceFlags } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { BasicTracerProvider } from "@opentelemetry/sdk-trace-base";
import { Hono } from "hono";

const runtimeContext = createContextKey("markr-runtime-gate");
const contextManager = new AsyncLocalStorageContextManager().enable();
context.setGlobalContextManager(contextManager);
propagation.setGlobalPropagator(new W3CTraceContextPropagator());

const expectedTraceId = "4bf92f3577b34da6a3ce929d0e0e4736";
const expectedSpanId = "00f067aa0ba902b7";
const parentContext = trace.setSpanContext(
  context.active().setValue(runtimeContext, "propagated"),
  {
    isRemote: false,
    spanId: expectedSpanId,
    traceFlags: TraceFlags.SAMPLED,
    traceId: expectedTraceId,
  },
);
const tracerProvider = new BasicTracerProvider();
const tracer = tracerProvider.getTracer("markr-runtime-gate");

const app = new Hono().get("/context", async (event) => {
  return tracer.startActiveSpan("hono-runtime-gate", async (span) => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const spanContext = span.spanContext();
    span.end();

    return event.json({
      spanId: spanContext.spanId,
      traceId: spanContext.traceId,
      value: context.active().getValue(runtimeContext),
    });
  });
});

const response = await context.with(parentContext, () => app.request("/context"));

const body: unknown = await response.json();
if (
  typeof body !== "object" ||
  body === null ||
  !("value" in body) ||
  body.value !== "propagated" ||
  !("traceId" in body) ||
  body.traceId !== expectedTraceId ||
  !("spanId" in body) ||
  body.spanId === expectedSpanId
) {
  throw new Error("OpenTelemetry async context gate failed");
}

const carrier: Record<string, string> = {};
propagation.inject(parentContext, carrier);

const traceparent = carrier.traceparent;
if (!traceparent) {
  throw new Error("OpenTelemetry injection gate failed");
}

const worker = new Worker(new URL("./otel-worker.ts", import.meta.url).href);
const workerResult = await new Promise<{
  parentSpanId?: string;
  spanId?: string;
  traceId?: string;
}>((resolve, reject) => {
  worker.onmessage = (message) => resolve(message.data);
  worker.onerror = (error) => reject(error);
  worker.postMessage({ traceparent });
});
worker.terminate();

if (
  workerResult.traceId !== expectedTraceId ||
  workerResult.parentSpanId !== expectedSpanId ||
  workerResult.spanId === expectedSpanId
) {
  throw new Error("OpenTelemetry worker propagation gate failed");
}

await tracerProvider.shutdown();
contextManager.disable();
context.disable();
console.info("runtime-otel-gate:ok");
