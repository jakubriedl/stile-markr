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

  it("accepts a dropped XML file", async () => {
    const onUpload = vi.fn();
    render(<UploadPage onUpload={onUpload} />);

    const xmlFile = new File(["<results />"], "dropped.xml", { type: "text/xml" });
    const dropZone = screen.getByRole("button", {
      name: /Drop a results XML file here/i,
    });

    const dataTransfer = {
      dropEffect: "none",
      effectAllowed: "all",
      files: [xmlFile],
      items: [
        {
          kind: "file",
          type: "text/xml",
          getAsFile: () => xmlFile,
        },
      ],
      types: ["Files"],
      setData: vi.fn(),
      getData: vi.fn(),
      clearData: vi.fn(),
      setDragImage: vi.fn(),
    };

    fireEvent.dragEnter(dropZone, { dataTransfer });
    fireEvent.dragOver(dropZone, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });

    await waitFor(() => {
      expect(screen.getByTestId("selected-file-name")).toHaveTextContent("dropped.xml");
    });
    expect(screen.getByRole("button", { name: "Upload" })).toBeEnabled();
  });

  it("uploads a valid XML file and surfaces success or failure", async () => {
    const user = userEvent.setup();
    const onUpload = vi
      .fn()
      .mockResolvedValueOnce({ imported: 3, test_ids: ["exam-a", "exam-b"] })
      .mockRejectedValueOnce(new Error("Import capacity exceeded"));
    render(<UploadPage onUpload={onUpload} />);

    const xmlFile = new File(["<results />"], "results.xml", { type: "text/xml" });
    selectFile(xmlFile);
    expect(screen.getByTestId("selected-file-name")).toHaveTextContent("results.xml");
    await user.click(screen.getByRole("button", { name: "Upload" }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Imported 3 unique results.");
    expect(screen.getByRole("link", { name: "exam-a" })).toHaveAttribute("href", "/tests/exam-a");
    expect(screen.getByRole("link", { name: "exam-b" })).toHaveAttribute("href", "/tests/exam-b");
    expect(onUpload).toHaveBeenCalledWith(xmlFile);

    selectFile(xmlFile);
    await user.click(screen.getByRole("button", { name: "Upload" }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Import capacity exceeded");
    });
  });
});
