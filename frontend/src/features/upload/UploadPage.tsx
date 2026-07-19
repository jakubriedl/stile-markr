import { DropZone, FileTrigger } from "react-aria-components";
import { useState, type FormEvent } from "react";

import { Alert } from "../../components/ui/Alert.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { PageHeading } from "../../components/ui/Heading.tsx";
import { Link } from "../../components/ui/Link.tsx";
import type { ImportSuccessResponse } from "../../lib/api/types.ts";
import type { UploadErrorParts } from "./format-upload-error.ts";
import { UploadErrorAlert } from "./UploadErrorAlert.tsx";

const MAX_UPLOAD_BYTES = 52_428_800;

export type UploadPageProps = {
  onUpload: (file: File) => Promise<ImportSuccessResponse>;
};

type UploadSuccess = {
  imported: number;
  testIds: string[];
};

export class UploadRequestError extends Error {
  readonly parts: UploadErrorParts;

  constructor(parts: UploadErrorParts) {
    super(parts.summary);
    this.name = "UploadRequestError";
    this.parts = parts;
  }
}

function isXmlFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".xml") || file.type.includes("xml");
}

function validateSelection(next: File | null): UploadErrorParts | null {
  if (next == null) {
    return {
      summary: "No file selected yet.",
      path: "File picker",
      fix: "Choose a Markr results XML file, then click Upload.",
    };
  }
  if (!isXmlFile(next)) {
    return {
      summary: "That file does not look like XML.",
      path: next.name,
      fix: "Choose a file that ends in .xml (or has an XML type). Spreadsheets and PDFs cannot be imported here.",
    };
  }
  if (next.size > MAX_UPLOAD_BYTES) {
    return {
      summary: "This file is larger than Markr allows.",
      path: `${next.name} · Upload size limit (50 MiB)`,
      fix: "Upload a results file of 50 MiB or smaller.",
    };
  }
  return null;
}

function UploadGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-10 text-[var(--markr-accent)]" fill="none" aria-hidden="true">
      <path
        d="M12 16V4m0 0 4 4m-4-4-4 4M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UploadPage({ onUpload }: UploadPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<UploadErrorParts | null>(null);
  const [success, setSuccess] = useState<UploadSuccess | null>(null);
  const [pending, setPending] = useState(false);

  const applyFile = (next: File | null) => {
    setFile(next);
    setSuccess(null);
    setError(validateSelection(next));
  };

  const onSelect = (fileList: FileList | null) => {
    applyFile(fileList?.[0] ?? null);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateSelection(file);
    if (validationError || file == null) {
      setError(
        validationError ?? {
          summary: "No file selected yet.",
          path: "File picker",
          fix: "Choose a Markr results XML file, then click Upload.",
        },
      );
      setSuccess(null);
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await onUpload(file);
      setSuccess({
        imported: result.imported,
        testIds: result.test_ids,
      });
    } catch (cause) {
      if (cause instanceof UploadRequestError) {
        setError(cause.parts);
      } else if (cause instanceof Error) {
        setError({
          summary: cause.message || "Upload failed.",
          fix: "Check your connection and try again.",
        });
      } else {
        setError({
          summary: "Upload failed.",
          fix: "Check your connection and try again.",
        });
      }
    } finally {
      setPending(false);
    }
  };

  const canSubmit = file != null && error == null && !pending;
  const fileStatus = file ? file.name : "No file selected";

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <PageHeading>Upload exam results</PageHeading>
        <p className="m-0 text-[var(--markr-fg-muted)]">
          Import a Markr XML results document for aggregation and review.
        </p>
      </header>

      <form
        className="flex flex-col gap-4 rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)] p-4 sm:p-5"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col gap-2">
          <DropZone
            // RAC DropZone does not reliably forward aria-describedby; include status in the name.
            aria-label={`Results XML file. ${fileStatus}`}
            isDisabled={pending}
            getDropOperation={() => "copy"}
            onDrop={async (event) => {
              const item = event.items.find((entry) => entry.kind === "file");
              if (item?.kind !== "file") {
                applyFile(null);
                return;
              }
              applyFile(await item.getFile());
            }}
            className={({ isDropTarget, isFocusVisible, isDisabled }) =>
              [
                "flex flex-col items-center justify-center gap-3 rounded-[var(--markr-radius)] border border-dashed px-4 py-8 text-center outline-none transition-colors",
                // Avoid opacity on the whole zone — it tanks muted-text contrast under axe.
                isDisabled
                  ? "cursor-not-allowed border-[var(--markr-border)]"
                  : "border-[var(--markr-border)] hover:border-[var(--markr-accent)] hover:bg-[var(--markr-bg)]",
                isDropTarget
                  ? "border-[var(--markr-accent)] bg-[var(--markr-bg)] ring-2 ring-[var(--markr-focus)]"
                  : "",
                isFocusVisible
                  ? "ring-2 ring-[var(--markr-focus)] ring-offset-2 ring-offset-[var(--markr-bg-elevated)]"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
          >
            <UploadGlyph />
            {/* Visual only — DropZone name is the short aria-label (avoids VO reading this twice). */}
            <p aria-hidden="true" className="m-0 text-sm text-[var(--markr-fg)]">
              Drop a results XML file here, or choose one to upload
            </p>
            <FileTrigger
              acceptedFileTypes={[".xml", "text/xml", "application/xml"]}
              onSelect={onSelect}
            >
              <Button type="button" variant="secondary" isDisabled={pending}>
                Choose file
              </Button>
            </FileTrigger>
            <p
              aria-hidden="true"
              className="m-0 max-w-full truncate text-sm text-[var(--markr-fg-muted)]"
              data-testid="selected-file-name"
            >
              {fileStatus}
            </p>
          </DropZone>
        </div>

        <Button type="submit" isDisabled={!canSubmit}>
          {pending ? "Uploading…" : "Upload"}
        </Button>
      </form>

      {error ? <UploadErrorAlert error={error} /> : null}
      {success ? (
        <Alert tone="polite" variant="success">
          <div className="flex flex-col gap-2">
            <p className="m-0">Imported {success.imported} unique results.</p>
            {success.testIds.length > 0 ? (
              <div className="flex flex-col gap-1">
                <p className="m-0 font-semibold">
                  {success.testIds.length === 1 ? "Test in this import:" : "Tests in this import:"}
                </p>
                <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
                  {success.testIds.map((testId) => (
                    <li key={testId}>
                      <Link
                        href={`/tests/${encodeURIComponent(testId)}`}
                        aria-label={`Test ${testId}`}
                        className="text-current underline underline-offset-2"
                      >
                        {testId}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Alert>
      ) : null}
    </main>
  );
}
