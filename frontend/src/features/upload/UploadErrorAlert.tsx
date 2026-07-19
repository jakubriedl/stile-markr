import { Alert } from "../../components/ui/Alert.tsx";
import type { UploadErrorParts } from "./format-upload-error.ts";

export function UploadErrorAlert({ error }: { error: UploadErrorParts }) {
  return (
    <Alert>
      <div className="flex flex-col gap-2">
        <p className="m-0 font-semibold">{error.summary}</p>
        {error.path ? (
          <p className="m-0">
            <span className="font-semibold">Where: </span>
            {error.path}
          </p>
        ) : null}
        {error.fix ? (
          <p className="m-0">
            <span className="font-semibold">How to fix: </span>
            {error.fix}
          </p>
        ) : null}
      </div>
    </Alert>
  );
}
