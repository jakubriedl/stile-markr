import { FileTrigger } from "react-aria-components";
import { useState, type FormEvent } from "react";

import { Alert } from "../../components/ui/Alert.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { PageHeading } from "../../components/ui/Heading.tsx";

const MAX_UPLOAD_BYTES = 52_428_800;

export type UploadPageProps = {
  onUpload: (file: File) => Promise<{ imported: number }>;
};

function isXmlFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".xml") || file.type.includes("xml");
}

function validateSelection(next: File | null): string | null {
  if (next == null) {
    return "Choose an XML file before uploading.";
  }
  if (!isXmlFile(next)) {
    return "Selected file must be XML.";
  }
  if (next.size > MAX_UPLOAD_BYTES) {
    return "Selected file must not exceed 50 MiB.";
  }
  return null;
}

export function UploadPage({ onUpload }: UploadPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSelect = (fileList: FileList | null) => {
    const next = fileList?.[0] ?? null;
    setFile(next);
    setSuccess(null);
    setError(validateSelection(next));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateSelection(file);
    if (validationError || file == null) {
      setError(validationError ?? "Choose an XML file before uploading.");
      setSuccess(null);
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await onUpload(file);
      setSuccess(`Imported ${result.imported} unique results.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setPending(false);
    }
  };

  const canSubmit = file != null && error == null && !pending;

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <PageHeading>Upload exam results</PageHeading>
        <p className="m-0 text-[var(--markr-fg-muted)]">
          Import a Markr XML results document for aggregation and review.
        </p>
      </header>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <span id="results-file-label" className="text-sm font-semibold">
            Results XML file
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <FileTrigger
              acceptedFileTypes={[".xml", "text/xml", "application/xml"]}
              onSelect={onSelect}
            >
              <Button type="button" variant="secondary">
                Choose file
              </Button>
            </FileTrigger>
            <span className="text-sm text-[var(--markr-fg-muted)]" data-testid="selected-file-name">
              {file ? file.name : "No file selected"}
            </span>
          </div>
        </div>
        <Button type="submit" isDisabled={!canSubmit}>
          Upload
        </Button>
      </form>

      {error ? <Alert>{error}</Alert> : null}
      {success ? (
        <Alert tone="polite" variant="success">
          {success}
        </Alert>
      ) : null}
    </main>
  );
}
