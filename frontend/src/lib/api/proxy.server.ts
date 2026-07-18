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

  const backendUrl = new URL(
    `/${path}${requestUrl.search}`,
    process.env.BACKEND_URL ?? "http://127.0.0.1:4567",
  );
  const headers = pickHeaders(request.headers, FORWARDED_REQUEST_HEADERS);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const timeout = path === "import" ? IMPORT_TIMEOUT_MS : QUERY_TIMEOUT_MS;

  try {
    const upstream = await fetchImplementation(backendUrl, {
      body: hasBody ? request.body : undefined,
      duplex: hasBody ? "half" : undefined,
      headers,
      method: request.method,
      redirect: "manual",
      signal: AbortSignal.timeout(timeout),
    } as RequestInit & { duplex?: "half" });

    return new Response(upstream.body, {
      headers: pickHeaders(upstream.headers, FORWARDED_RESPONSE_HEADERS),
      status: upstream.status,
      statusText: upstream.statusText,
    });
  } catch {
    return Response.json({ error: "Backend unavailable" }, { status: 502 });
  }
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
