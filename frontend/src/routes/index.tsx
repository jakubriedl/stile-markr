import { createFileRoute } from "@tanstack/react-router";

import { parseApiErrorBody } from "../features/upload/format-upload-error.ts";
import { UploadPage, UploadRequestError } from "../features/upload/UploadPage.tsx";
import { createMarkrApi } from "../lib/api/markr-api.ts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Upload exam results · Markr" }],
  }),
  component: Home,
});

const api = createMarkrApi();

function Home() {
  return (
    <UploadPage
      onUpload={async (file) => {
        const result = await api.importXml(file);
        if (!result.ok) {
          throw new UploadRequestError(parseApiErrorBody(result.body));
        }
        return result.data;
      }}
    />
  );
}
