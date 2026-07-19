import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { formatLastRefreshed } from "../../lib/live-state/displayed-snapshots.ts";
import { TestsListPage } from "./TestsListPage.tsx";

describe("TestsListPage", () => {
  it("renders an empty state with upload link", () => {
    render(<TestsListPage tests={[]} lastRefreshedAt={null} />);

    expect(screen.getByRole("heading", { name: "Tests" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Live|Reconnecting/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upload exam results" })).toHaveAttribute("href", "/");
  });

  it("renders test rows, stale/announcement banners, and retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <TestsListPage
        tests={[{ test_id: "exam-1", student_count: 12, marks_available: 20 }]}
        lastRefreshedAt="2026-07-18T10:00:00.000Z"
        stale
        announcement="Unable to refresh. Showing previously loaded data."
        error="Unable to load tests."
        onRetry={onRetry}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: `Reconnecting. Last refreshed: ${formatLastRefreshed("2026-07-18T10:00:00.000Z")}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Unable to refresh/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "exam-1" })).toHaveAttribute("href", "/tests/exam-1");
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
