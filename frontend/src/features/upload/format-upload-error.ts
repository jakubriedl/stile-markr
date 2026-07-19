import type { ApiErrorResponse } from "../../lib/api/types.ts";

export type UploadErrorParts = {
  summary: string;
  path?: string;
  fix?: string;
};

const CONTRACT_SUMMARIES: Record<string, string> = {
  "Invalid XML format": "This file isn't valid XML, so Markr couldn't import it.",
};

export function parseApiErrorBody(body: unknown): UploadErrorParts {
  if (body == null || typeof body !== "object") {
    return {
      summary: "Upload failed.",
      fix: "Check your connection and try again. If it keeps failing, ask your administrator.",
    };
  }

  const errorBody = body as ApiErrorResponse;
  const raw =
    typeof errorBody.error === "string" && errorBody.error.trim() !== ""
      ? errorBody.error
      : "Upload failed.";

  const parts: UploadErrorParts = {
    summary: CONTRACT_SUMMARIES[raw] ?? raw,
  };
  if (typeof errorBody.path === "string") {
    parts.path = errorBody.path;
  }
  if (typeof errorBody.fix === "string") {
    parts.fix = errorBody.fix;
  }
  return parts;
}

export function formatUploadErrorText(parts: UploadErrorParts): string {
  const lines = [parts.summary];
  if (parts.path) {
    lines.push(`Where: ${parts.path}`);
  }
  if (parts.fix) {
    lines.push(`How to fix: ${parts.fix}`);
  }
  return lines.join("\n");
}
