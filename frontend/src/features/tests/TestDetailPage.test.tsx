import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { formatLastRefreshed } from "../../lib/live-state/displayed-snapshots.ts";
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

  it("renders loading skeletons without live statistics", () => {
    render(
      <TestDetailPage
        testId="9863"
        aggregate={null}
        bins={[]}
        lastRefreshedAt={null}
        loading
      />,
    );

    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByLabelText(/Mean/)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Score histogram" })).not.toBeInTheDocument();
  });

  it("formats percentages with up to two decimal places", () => {
    render(
      <TestDetailPage
        testId="9863"
        aggregate={{ ...aggregate, mean: 51.4, stddev: 11.234, min: 30.0 }}
        bins={bins}
        lastRefreshedAt={null}
      />,
    );

    expect(screen.getByLabelText("Mean 51.4% percent")).toBeInTheDocument();
    expect(screen.getByLabelText("Std. dev. 11.23% percentage points")).toBeInTheDocument();
    expect(screen.getByLabelText("Min 30% percent")).toBeInTheDocument();
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
    expect(
      screen.getByRole("button", {
        name: `Reconnecting. Last refreshed: ${formatLastRefreshed("2026-07-18T10:00:00.000Z")}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Connection restored/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Aggregate statistics" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Score histogram" })).toBeInTheDocument();
    expect(screen.getByLabelText("Mean 50% percent")).toBeInTheDocument();
    expect(screen.getByLabelText("40 to 50 percent: 28 students")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Back to tests" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
