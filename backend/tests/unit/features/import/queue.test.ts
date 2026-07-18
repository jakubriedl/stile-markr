import { describe, expect, it } from "vitest";

import { createImportAdmissionQueue } from "../../../../src/features/import/queue.ts";

describe("createImportAdmissionQueue", () => {
  it("allows one active and four queued admissions", async () => {
    const queue = createImportAdmissionQueue();
    const first = await queue.acquire();
    expect(first.ok).toBe(true);

    const waiting = Array.from({ length: 4 }, () => queue.acquire());
    await Promise.resolve();
    expect(queue.queuedCount).toBe(4);

    const overflow = await queue.acquire();
    expect(overflow).toEqual({
      ok: false,
      code: "over_capacity",
      retryAfterSeconds: 5,
    });

    if (first.ok) {
      first.release();
    }
    const promoted = await waiting[0]!;
    expect(promoted.ok).toBe(true);
    if (promoted.ok) {
      promoted.release();
    }
    for (const pending of waiting.slice(1)) {
      const admission = await pending;
      if (admission.ok) {
        admission.release();
      }
    }
  });
});
