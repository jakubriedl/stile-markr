import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UploadPage } from "./UploadPage.tsx";

function selectFile(file: File) {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (input == null) {
    throw new Error("Expected FileTrigger to render a file input");
  }
  fireEvent.change(input, { target: { files: [file] } });
}

describe("UploadPage", () => {
  it("renders the required heading and keeps Upload disabled without a file", () => {
    const onUpload = vi.fn();
    render(<UploadPage onUpload={onUpload} />);

    expect(screen.getByRole("heading", { name: "Upload exam results" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose file" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
    expect(screen.queryByRole("link", { name: "View tests" })).not.toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("rejects non-XML selections and oversized files", () => {
    const onUpload = vi.fn();
    render(<UploadPage onUpload={onUpload} />);

    selectFile(new File(["nope"], "notes.txt", { type: "text/plain" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Selected file must be XML.");
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();

    selectFile(new File([new Uint8Array(52_428_801)], "huge.xml", { type: "text/xml" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Selected file must not exceed 50 MiB.");
  });

  it("uploads a valid XML file and surfaces success or failure", async () => {
    const user = userEvent.setup();
    const onUpload = vi
      .fn()
      .mockResolvedValueOnce({ imported: 3 })
      .mockRejectedValueOnce(new Error("Import capacity exceeded"));
    render(<UploadPage onUpload={onUpload} />);

    const xmlFile = new File(["<results />"], "results.xml", { type: "text/xml" });
    selectFile(xmlFile);
    expect(screen.getByTestId("selected-file-name")).toHaveTextContent("results.xml");
    await user.click(screen.getByRole("button", { name: "Upload" }));

    await expect(screen.findByRole("status")).resolves.toHaveTextContent(
      "Imported 3 unique results.",
    );
    expect(onUpload).toHaveBeenCalledWith(xmlFile);

    selectFile(xmlFile);
    await user.click(screen.getByRole("button", { name: "Upload" }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Import capacity exceeded");
    });
  });
});
