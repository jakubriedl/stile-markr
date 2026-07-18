import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UploadPage } from "./UploadPage.tsx";

function selectFile(input: HTMLElement, file: File) {
  fireEvent.change(input, { target: { files: [file] } });
}

describe("UploadPage", () => {
  it("renders the required heading and keeps Upload disabled without a file", () => {
    const onUpload = vi.fn();
    render(<UploadPage onUpload={onUpload} />);

    expect(screen.getByRole("heading", { name: "Upload exam results" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "View tests" })).toHaveAttribute("href", "/tests");
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("rejects non-XML selections and oversized files", () => {
    const onUpload = vi.fn();
    render(<UploadPage onUpload={onUpload} />);

    const input = screen.getByLabelText("Results XML file");
    selectFile(input, new File(["nope"], "notes.txt", { type: "text/plain" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Selected file must be XML.");
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();

    selectFile(input, new File([new Uint8Array(52_428_801)], "huge.xml", { type: "text/xml" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Selected file must not exceed 50 MiB.");
  });

  it("uploads a valid XML file and surfaces success or failure", async () => {
    const user = userEvent.setup();
    const onUpload = vi
      .fn()
      .mockResolvedValueOnce({ imported: 3 })
      .mockRejectedValueOnce(new Error("Import capacity exceeded"));
    render(<UploadPage onUpload={onUpload} testsHref="/tests" />);

    const input = screen.getByLabelText("Results XML file");
    const xmlFile = new File(["<results />"], "results.xml", { type: "text/xml" });
    selectFile(input, xmlFile);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    await expect(screen.findByRole("status")).resolves.toHaveTextContent(
      "Imported 3 unique results.",
    );
    expect(onUpload).toHaveBeenCalledWith(xmlFile);

    selectFile(input, xmlFile);
    await user.click(screen.getByRole("button", { name: "Upload" }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Import capacity exceeded");
    });
  });
});
