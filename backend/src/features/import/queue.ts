export const IMPORT_ACTIVE_LIMIT = 1;
export const IMPORT_QUEUED_LIMIT = 4;
export const IMPORT_RETRY_AFTER_SECONDS = 5;

export type ImportAdmission =
  | { ok: true; release: () => void }
  | { ok: false; code: "over_capacity"; retryAfterSeconds: number };

type Waiter = {
  resolve: (admission: ImportAdmission) => void;
};

/**
 * One active import and four queued waiters. Overflow returns 503 guidance.
 */
export function createImportAdmissionQueue(
  activeLimit = IMPORT_ACTIVE_LIMIT,
  queuedLimit = IMPORT_QUEUED_LIMIT,
) {
  let active = 0;
  const waiters: Waiter[] = [];

  const tryPromote = () => {
    while (active < activeLimit && waiters.length > 0) {
      const next = waiters.shift();
      if (!next) {
        return;
      }
      active += 1;
      next.resolve({
        ok: true,
        release: () => {
          active = Math.max(0, active - 1);
          tryPromote();
        },
      });
    }
  };

  return {
    get depth() {
      return active + waiters.length;
    },
    get activeCount() {
      return active;
    },
    get queuedCount() {
      return waiters.length;
    },
    async acquire(): Promise<ImportAdmission> {
      if (active < activeLimit) {
        active += 1;
        return {
          ok: true,
          release: () => {
            active = Math.max(0, active - 1);
            tryPromote();
          },
        };
      }

      if (waiters.length >= queuedLimit) {
        return {
          ok: false,
          code: "over_capacity",
          retryAfterSeconds: IMPORT_RETRY_AFTER_SECONDS,
        };
      }

      return await new Promise<ImportAdmission>((resolve) => {
        waiters.push({ resolve });
      });
    },
  };
}

export type ImportAdmissionQueue = ReturnType<typeof createImportAdmissionQueue>;
