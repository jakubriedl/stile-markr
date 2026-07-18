import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScoreHistogram } from "./ScoreHistogram.tsx";

describe("ScoreHistogram", () => {
  it("renders a horizontal column chart with accessible bar descriptions", () => {
    render(
      <ScoreHistogram
        bins={[
          { lower_pct: 0, upper_pct: 10, count: 2 },
          { lower_pct: 10, upper_pct: 20, count: 5 },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Score histogram" })).toBeInTheDocument();
    expect(screen.getByLabelText("0 to 10 percent: 2 students")).toBeInTheDocument();
    expect(screen.getByLabelText("10 to 20 percent: 5 students")).toBeInTheDocument();
    expect(screen.getByText("0–10%")).toBeInTheDocument();
  });
});
