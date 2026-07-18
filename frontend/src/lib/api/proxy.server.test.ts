// @vitest-environment node

import { context, propagation, trace, TraceFlags } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { BasicTracerProvider } from "@opentelemetry/sdk-trace-base";
import { describe, expect, it, vi } from "vitest";

import { proxyApiRequest } from "./proxy.server.ts";

describe("proxyApiRequest", () => {
  it("forwards request and response streams without reading them", async () => {
    const requestStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("<xml />"));
        controller.close();
      },
    });
    const responseStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"imported":1}'));
        controller.close();
      },
    });
    const request = new Request("http://markr.local/api/import", {
      body: requestStream,
      duplex: "half",
      headers: {
        "content-type": "text/xml+markr",
        traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
      },
      method: "POST",
    } as RequestInit & { duplex: "half" });
    const fetchImplementation = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(
      async () =>
        new Response(responseStream, {
          headers: {
            "content-type": "application/json",
            etag: '"import-1"',
          },
          status: 200,
        }),
    );

    const response = await proxyApiRequest(request, "import", fetchImplementation);

    expect(fetchImplementation).toHaveBeenCalledOnce();
    expect(fetchImplementation.mock.calls[0]?.[1]?.body).toBe(requestStream);
    expect(new Headers(fetchImplementation.mock.calls[0]?.[1]?.headers).get("traceparent")).toBe(
      "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
    );
    expect(response.body).toBe(responseStream);
    expect(response.headers.get("etag")).toBe('"import-1"');
  });

  it("rejects cross-origin browser requests", async () => {
    const request = new Request("http://markr.local/api/tests", {
      headers: { origin: "https://attacker.invalid" },
    });
    const fetchImplementation =
      vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

    const response = await proxyApiRequest(request, "tests", fetchImplementation);

    expect(response.status).toBe(403);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("maps upstream transport failures to a generic response", async () => {
    const request = new Request("http://markr.local/api/tests");
    const fetchImplementation = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(async () => {
      throw new Error("sensitive backend address");
    });

    const response = await proxyApiRequest(request, "tests", fetchImplementation);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Backend unavailable",
    });
  });

  it("forwards upstream server failures", async () => {
    const request = new Request("http://markr.local/api/tests");
    const fetchImplementation = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(async () => Response.json({ error: "Unavailable" }, { status: 503 }));

    const response = await proxyApiRequest(request, "tests", fetchImplementation);

    expect(response.status).toBe(503);
  });

  it.each([
    "//attacker.invalid/probe",
    "/127.0.0.1:9000/probe",
    "../probe",
    String.raw`safe\..\probe`,
  ])("rejects backend host-escape path %s", async (path) => {
    const request = new Request(`http://markr.local/api/${path}`);
    const fetchImplementation =
      vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

    const response = await proxyApiRequest(request, path, fetchImplementation);

    expect(response.status).toBe(400);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("creates and forwards a child proxy span", async () => {
    const manager = new AsyncLocalStorageContextManager().enable();
    const provider = new BasicTracerProvider();
    context.setGlobalContextManager(manager);
    propagation.setGlobalPropagator(new W3CTraceContextPropagator());
    trace.setGlobalTracerProvider(provider);

    const parentTraceId = "4bf92f3577b34da6a3ce929d0e0e4736";
    const parentSpanId = "00f067aa0ba902b7";
    const parentContext = trace.setSpanContext(context.active(), {
      isRemote: false,
      spanId: parentSpanId,
      traceFlags: TraceFlags.SAMPLED,
      traceId: parentTraceId,
    });
    const fetchImplementation = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(async () => Response.json({ status: "ok" }));

    try {
      await context.with(parentContext, () =>
        proxyApiRequest(
          new Request("http://markr.local/api/health"),
          "health",
          fetchImplementation,
        ),
      );

      const traceparent = new Headers(fetchImplementation.mock.calls[0]?.[1]?.headers).get(
        "traceparent",
      );
      const [, traceId, spanId] = traceparent?.split("-") ?? [];
      expect(traceId).toBe(parentTraceId);
      expect(spanId).not.toBe(parentSpanId);
      expect(spanId).toMatch(/^[a-f0-9]{16}$/);
    } finally {
      await provider.shutdown();
      manager.disable();
      context.disable();
      propagation.disable();
      trace.disable();
    }
  });
});
