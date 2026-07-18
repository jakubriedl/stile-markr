import { createHash } from "node:crypto";

/** Stable content-derived strong ETag for JSON query payloads. */
export function contentEtag(payload: unknown): string {
  const digest = createHash("sha256").update(JSON.stringify(payload)).digest("base64url");
  return `"${digest}"`;
}

export function etagMatches(headerValue: string | null | undefined, etag: string): boolean {
  if (headerValue == null || headerValue.trim() === "") {
    return false;
  }

  return headerValue
    .split(",")
    .map((part) => part.trim())
    .some((token) => token === etag || token === `W/${etag}`);
}
