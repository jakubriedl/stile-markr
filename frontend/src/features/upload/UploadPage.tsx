import { useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { Alert } from "../../components/ui/Alert.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { Link } from "../../components/ui/Link.tsx";

const MAX_UPLOAD_BYTES = 52_428_800;

export type UploadPageProps = {
  onUpload: (file: File) => Promise<{ imported: number }>;
  testsHref?: string;
};

function isXmlFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".xml") || file.type.includes("xml");
}

export function UploadPage({ onUpload, testsHref = "/tests" }: UploadPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const validateSelection = (next: File | null): string | null => {
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
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
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
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="m-0 font-[family-name:var(--markr-font-display)] text-3xl text-[var(--markr-fg)]">
          Upload exam results
        </h1>
        <p className="m-0 text-[var(--markr-fg-muted)]">
          Import a Markr XML results document for aggregation and review.
        </p>
      </header>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold" htmlFor="results-file">
            Results XML file
          </label>
          <input
            ref={inputRef}
            id="results-file"
            type="file"
            accept=".xml,text/xml,application/xml"
            onChange={onFileChange}
            className="rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--markr-focus)]"
          />
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

      <p className="m-0">
        <Link href={testsHref}>View tests</Link>
      </p>
    </main>
  );
}
