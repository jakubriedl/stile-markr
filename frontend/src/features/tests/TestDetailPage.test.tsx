import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TestDetailPage } from "./TestDetailPage.tsx";

const aggregate = {
  mean: 50,
  stddev: 10,
  min: 30,
  max: 75,
  p25: 45,
  p50: 50,
  p75: 55,
  count: 81,
};

const bins = [
  { lower_pct: 40, upper_pct: 50, count: 28 },
  { lower_pct: 50, upper_pct: 60, count: 28 },
];

describe("TestDetailPage", () => {
  it("renders a not-found state", () => {
    render(
      <TestDetailPage
        testId="missing"
        aggregate={null}
        bins={[]}
        lastRefreshedAt={null}
        notFound
      />,
    );

    expect(screen.getByRole("heading", { name: "Test missing" })).toBeInTheDocument();
    expect(screen.getByText("This test was not found.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to tests" })).toHaveAttribute("href", "/tests");
  });

  it("renders aggregates, histogram, announcements, and retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <TestDetailPage
        testId="9863"
        aggregate={aggregate}
        bins={bins}
        lastRefreshedAt="2026-07-18T10:00:00.000Z"
        stale
        announcement="Connection restored. Showing updated results."
        error="Unable to load test details."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("heading", { name: "Test 9863" })).toBeInTheDocument();
    expect(screen.getByText(/2026-07-18T10:00:00.000Z UTC \(stale\)/)).toBeInTheDocument();
    expect(screen.getByText(/Connection restored/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Aggregate statistics" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Score histogram" })).toBeInTheDocument();
    expect(screen.getByLabelText("Mean 50.00% percent")).toBeInTheDocument();
    expect(screen.getByLabelText("40 to 50 percent: 28 students")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Back to tests" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
