import { Hono } from "hono";

import { parseImportDocument } from "./parse-document.ts";
import { persistImportRecords, type ImportWriteDatabase } from "./persist.ts";
import { createImportAdmissionQueue, type ImportAdmissionQueue } from "./queue.ts";
import { INVALID_XML_MESSAGE } from "./types.ts";

export type ImportRouteDependencies = {
  getWriteDb: () => ImportWriteDatabase;
  queue?: ImportAdmissionQueue;
};

function isMarkrXmlMediaType(contentType: string | undefined): boolean {
  if (contentType == null || contentType.trim() === "") {
    return false;
  }
  const [base = ""] = contentType.split(";", 1);
  return base.trim().toLowerCase() === "text/xml+markr";
}

async function* bodyChunks(request: Request): AsyncGenerator<Uint8Array> {
  if (request.body == null) {
    return;
  }
  const reader = request.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }
    if (value) {
      yield value;
    }
  }
}

export function createImportRoutes(dependencies: ImportRouteDependencies) {
  const queue = dependencies.queue ?? createImportAdmissionQueue();

  return new Hono().post("/import", async (context) => {
    if (!isMarkrXmlMediaType(context.req.header("content-type"))) {
      return context.json({ error: "Unsupported media type" }, 415);
    }

    const admission = await queue.acquire();
    if (!admission.ok) {
      context.header("Retry-After", String(admission.retryAfterSeconds));
      return context.json({ error: "Import capacity exceeded" }, 503);
    }

    try {
      const parsed = await parseImportDocument(bodyChunks(context.req.raw));
      if (!parsed.ok) {
        if (parsed.code === "payload_too_large") {
          return context.json({ error: "Payload too large" }, 413);
        }
        if (parsed.code === "invalid_xml" || parsed.code === "invalid_utf8") {
          return context.json({ error: INVALID_XML_MESSAGE }, 400);
        }
        return context.json({ error: parsed.message }, 400);
      }

      const imported = persistImportRecords(dependencies.getWriteDb(), parsed.records);
      return context.json({ imported }, 200);
    } finally {
      admission.release();
    }
  });
}
