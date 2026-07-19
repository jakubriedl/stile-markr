import { createFileRoute } from "@tanstack/react-router";

import { UploadPage } from "../features/upload/UploadPage.tsx";
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
          const message =
            result.body &&
            typeof result.body === "object" &&
            "error" in result.body &&
            typeof result.body.error === "string"
              ? result.body.error
              : "Upload failed.";
          throw new Error(message);
        }
        return result.data;
      }}
    />
  );
}
