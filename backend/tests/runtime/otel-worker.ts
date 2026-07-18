import { context, propagation, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { BasicTracerProvider } from "@opentelemetry/sdk-trace-base";

interface WorkerMessage {
  readonly traceparent: string;
}

const manager = new AsyncLocalStorageContextManager().enable();
context.setGlobalContextManager(manager);
propagation.setGlobalPropagator(new W3CTraceContextPropagator());
const provider = new BasicTracerProvider();
const tracer = provider.getTracer("markr-runtime-worker-gate");

self.onmessage = (message: MessageEvent<WorkerMessage>) => {
  const extracted = propagation.extract(context.active(), message.data);

  void context.with(extracted, async () => {
    await Promise.resolve();
    const parentSpanContext = trace.getSpanContext(context.active());
    const span = tracer.startSpan("worker-runtime-gate", undefined, context.active());
    const spanContext = span.spanContext();
    span.end();
    self.postMessage({
      parentSpanId: parentSpanContext?.spanId,
      spanId: spanContext?.spanId,
      traceId: spanContext?.traceId,
    });
  });
};
