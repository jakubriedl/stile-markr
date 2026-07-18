import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Alert } from "./Alert.tsx";

describe("Alert", () => {
  it("uses distinct assertive and polite live regions", () => {
    const { rerender } = render(<Alert>Failure</Alert>);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");

    rerender(
      <Alert tone="polite" variant="success">
        Success
      </Alert>,
    );
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
