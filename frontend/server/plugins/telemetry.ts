import { context, propagation, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { BasicTracerProvider } from "@opentelemetry/sdk-trace-base";
import { definePlugin } from "nitro";

const contextManager = new AsyncLocalStorageContextManager().enable();
const tracerProvider = new BasicTracerProvider();

context.setGlobalContextManager(contextManager);
propagation.setGlobalPropagator(new W3CTraceContextPropagator());
trace.setGlobalTracerProvider(tracerProvider);

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook("close", async () => {
    await tracerProvider.shutdown();
    contextManager.disable();
    context.disable();
    propagation.disable();
    trace.disable();
  });
});
