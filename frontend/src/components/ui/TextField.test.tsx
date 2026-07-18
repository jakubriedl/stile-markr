import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TextField } from "./TextField.tsx";

describe("TextField", () => {
  it("renders a labelled input with optional description", () => {
    render(<TextField label="Student number" description="Digits only" />);

    expect(screen.getByLabelText("Student number")).toBeInTheDocument();
    expect(screen.getByText("Digits only")).toBeInTheDocument();
  });
});
