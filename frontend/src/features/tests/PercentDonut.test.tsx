import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PercentDonut } from "./PercentDonut.tsx";

describe("PercentDonut", () => {
  it("clamps values into the 0–100 range for the decorative ring", () => {
    const { container: over } = render(<PercentDonut value={140} />);
    expect(over.querySelector("[data-percent]")?.getAttribute("data-percent")).toBe("100");

    const { container: under } = render(<PercentDonut value={-8} />);
    expect(under.querySelector("[data-percent]")?.getAttribute("data-percent")).toBe("0");
  });

  it("is hidden from assistive technology", () => {
    const { container } = render(<PercentDonut value={50} />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
