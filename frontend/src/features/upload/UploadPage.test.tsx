import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UploadPage } from "./UploadPage.tsx";

describe("UploadPage", () => {
  it("renders the required heading and keeps Upload disabled without a file", () => {
    const onUpload = vi.fn();
    render(<UploadPage onUpload={onUpload} />);

    expect(screen.getByRole("heading", { name: "Upload exam results" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "View tests" })).toHaveAttribute("href", "/tests");
    expect(onUpload).not.toHaveBeenCalled();
  });
});
