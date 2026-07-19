import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { formatLastRefreshed } from "../../lib/live-state/displayed-snapshots.ts";
import { TestsListPage } from "./TestsListPage.tsx";

describe("TestsListPage", () => {
  it("renders an empty state with upload link", () => {
    render(<TestsListPage tests={[]} lastRefreshedAt={null} />);

    expect(screen.getByRole("heading", { name: "Tests" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Live|Reconnecting/ })).not.toBeInTheDocument();
    expect(screen.getByText("No tests imported yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upload exam results" })).toHaveAttribute("href", "/");
  });

  it("exposes each test as a table row link whose name includes the test id", () => {
    render(
      <TestsListPage
        tests={[
          { test_id: "exam-1", student_count: 12, marks_available: 20 },
          { test_id: "9863", student_count: 81, marks_available: 20 },
        ]}
        lastRefreshedAt="2026-07-18T10:00:00.000Z"
      />,
    );

    const table = screen.getByRole("table", { name: "Imported tests" });
    expect(within(table).getByRole("columnheader", { name: "Test ID" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Students" })).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Marks available" }),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "exam-1" })).toHaveAttribute("href", "/tests/exam-1");
    expect(screen.getByRole("link", { name: "9863" })).toHaveAttribute("href", "/tests/9863");
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("81")).toBeInTheDocument();
  });

  it("renders stale/announcement banners and retry", async () => {
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

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
