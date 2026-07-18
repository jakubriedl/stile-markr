import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UploadPage } from "./UploadPage.tsx";

describe("UploadPage", () => {
  it("renders the required heading and blocks non-xml uploads", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    render(<UploadPage onUpload={onUpload} />);

    expect(screen.getByRole("heading", { name: "Upload exam results" })).toBeInTheDocument();

    const file = new File(["not-xml"], "notes.txt", { type: "text/plain" });
    await user.upload(screen.getByLabelText("Results XML file"), file);
    expect(screen.getByRole("alert")).toHaveTextContent(/must be XML/i);
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
    expect(onUpload).not.toHaveBeenCalled();
  });
});
