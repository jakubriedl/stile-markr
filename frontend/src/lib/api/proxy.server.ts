import { context, propagation, SpanStatusCode, trace } from "@opentelemetry/api";

const QUERY_TIMEOUT_MS = 10_000;
const IMPORT_TIMEOUT_MS = 120_000;
const FORWARDED_REQUEST_HEADERS = [
  "content-type",
  "if-none-match",
  "traceparent",
  "tracestate",
  "x-request-id",
] as const;
const FORWARDED_RESPONSE_HEADERS = [
  "cache-control",
  "content-type",
  "etag",
  "traceparent",
  "tracestate",
  "x-request-id",
] as const;

type FetchImplementation = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const tracer = trace.getTracer("markr-frontend-proxy");

export async function proxyApiRequest(
  request: Request,
  path: string,
  fetchImplementation: FetchImplementation = fetch,
): Promise<Response> {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) {
    return Response.json({ error: "Forbidden origin" }, { status: 403 });
  }
  if (!isSafeBackendPath(path)) {
    return Response.json({ error: "Invalid proxy path" }, { status: 400 });
  }

  const backendUrl = new URL(
    `/${path}${requestUrl.search}`,
    process.env.BACKEND_URL ?? "http://127.0.0.1:4567",
  );
  const headers = pickHeaders(request.headers, FORWARDED_REQUEST_HEADERS);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const timeout = path === "import" ? IMPORT_TIMEOUT_MS : QUERY_TIMEOUT_MS;

  const parentContext = propagation.extract(context.active(), request.headers, {
    get(carrier, key) {
      return carrier.get(key) ?? undefined;
    },
    keys(carrier) {
      return [...carrier.keys()];
    },
  });

  return context.with(parentContext, () =>
    tracer.startActiveSpan("frontend.api_proxy", async (span) => {
      propagation.inject(context.active(), headers, {
        set(carrier, key, value) {
          carrier.set(key, value);
        },
      });

      try {
        const upstream = await fetchImplementation(backendUrl, {
          body: hasBody ? request.body : undefined,
          duplex: hasBody ? "half" : undefined,
          headers,
          method: request.method,
          redirect: "manual",
          signal: AbortSignal.timeout(timeout),
        } as RequestInit & { duplex?: "half" });

        span.setAttribute("http.response.status_code", upstream.status);
        span.setStatus({
          code: upstream.status >= 500 ? SpanStatusCode.ERROR : SpanStatusCode.UNSET,
        });

        return new Response(upstream.body, {
          headers: pickHeaders(upstream.headers, FORWARDED_RESPONSE_HEADERS),
          status: upstream.status,
          statusText: upstream.statusText,
        });
      } catch {
        span.setStatus({ code: SpanStatusCode.ERROR });
        return Response.json({ error: "Backend unavailable" }, { status: 502 });
      } finally {
        span.end();
      }
    }),
  );
}

function isSafeBackendPath(path: string): boolean {
  if (path.startsWith("/") || path.includes("\\")) {
    return false;
  }

  return path.split("/").every((segment) => segment !== "." && segment !== "..");
}

function pickHeaders(source: Headers, allowedNames: readonly string[]): Headers {
  const headers = new Headers();
  for (const name of allowedNames) {
    const value = source.get(name);
    if (value !== null) {
      headers.set(name, value);
    }
  }
  return headers;
}
