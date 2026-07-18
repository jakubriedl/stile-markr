import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FoundationShell } from "./foundation-shell.tsx";

describe("FoundationShell", () => {
  it("renders a named page heading", () => {
    render(<FoundationShell description="Foundation ready" heading="Markr" />);

    expect(screen.getByRole("heading", { level: 1, name: "Markr" })).toBeVisible();
    expect(screen.getByText("Foundation ready")).toBeVisible();
  });
});
