import { context, propagation, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";

interface WorkerMessage {
  readonly traceparent: string;
}

const manager = new AsyncLocalStorageContextManager().enable();
context.setGlobalContextManager(manager);
propagation.setGlobalPropagator(new W3CTraceContextPropagator());

self.onmessage = (message: MessageEvent<WorkerMessage>) => {
  const extracted = propagation.extract(context.active(), message.data);

  void context.with(extracted, async () => {
    await Promise.resolve();
    const spanContext = trace.getSpanContext(context.active());
    self.postMessage({
      spanId: spanContext?.spanId,
      traceId: spanContext?.traceId,
    });
  });
};
