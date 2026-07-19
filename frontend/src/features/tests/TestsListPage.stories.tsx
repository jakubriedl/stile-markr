import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { formatLastRefreshed } from "../../lib/live-state/displayed-snapshots.ts";
import { withAppShell } from "../../storybook/withAppShell.tsx";
import { TestsListPage } from "./TestsListPage.tsx";

const meta = {
  title: "Pages/TestsList",
  component: TestsListPage,
  decorators: [withAppShell("/tests")],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    lastRefreshedAt: "2026-07-18T10:00:00.000Z",
    tests: [{ test_id: "9863", student_count: 81, marks_available: 20 }],
  },
} satisfies Meta<typeof TestsListPage>;

export default meta;
type Story = StoryObj<typeof meta>;

async function waitForPage(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await waitFor(() => {
    expect(canvas.getByRole("heading", { name: "Tests" })).toBeInTheDocument();
  });
  return canvas;
}

export const Empty: Story = {
  args: { tests: [], lastRefreshedAt: null },
  play: async ({ canvasElement }) => {
    const canvas = await waitForPage(canvasElement);
    expect(canvas.getByRole("link", { name: "Tests" })).toHaveAttribute("aria-current", "page");
    expect(canvas.queryByRole("button", { name: /Live|Reconnecting/ })).not.toBeInTheDocument();
    expect(canvas.getByText("No tests imported yet.")).toBeInTheDocument();
    expect(canvas.getByRole("link", { name: "Upload exam results" })).toHaveAttribute(
      "href",
      "/",
    );
  },
};

export const Populated: Story = {
  args: {
    tests: [
      { test_id: "exam-1", student_count: 12, marks_available: 20 },
      { test_id: "9863", student_count: 81, marks_available: 20 },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = await waitForPage(canvasElement);
    const table = canvas.getByRole("table", { name: "Imported tests" });
    expect(within(table).getByRole("columnheader", { name: "Test ID" })).toBeInTheDocument();
    expect(canvas.getByRole("link", { name: "exam-1" })).toHaveAttribute("href", "/tests/exam-1");
    expect(canvas.getByRole("link", { name: "9863" })).toHaveAttribute("href", "/tests/9863");
  },
};

export const StaleWithRetry: Story = {
  args: {
    stale: true,
    onRetry: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = await waitForPage(canvasElement);
    expect(
      canvas.getByRole("button", {
        name: `Reconnecting. Last refreshed: ${formatLastRefreshed("2026-07-18T10:00:00.000Z")}`,
      }),
    ).toBeInTheDocument();
    expect(canvas.getByRole("status")).toHaveTextContent(/Couldn't refresh right now/);
    expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    expect(args.onRetry).toHaveBeenCalledOnce();
  },
};

export const LoadError: Story = {
  args: {
    tests: [],
    lastRefreshedAt: null,
    error: "Couldn't load the test list. Check your connection and try again.",
    onRetry: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = await waitForPage(canvasElement);
    expect(canvas.getByRole("alert")).toHaveTextContent(/Couldn't load the test list/);
    expect(canvas.queryByText("No tests imported yet.")).not.toBeInTheDocument();
    expect(canvas.queryByRole("table", { name: "Imported tests" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    expect(args.onRetry).toHaveBeenCalledOnce();
  },
};
