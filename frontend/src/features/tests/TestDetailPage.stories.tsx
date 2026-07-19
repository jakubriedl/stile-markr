import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { formatLastRefreshed } from "../../lib/live-state/displayed-snapshots.ts";
import { withAppShell } from "../../storybook/withAppShell.tsx";
import { TestDetailPage } from "./TestDetailPage.tsx";

const aggregate = {
  mean: 50.8,
  stddev: 9.92,
  min: 30,
  max: 75,
  p25: 45,
  p50: 50,
  p75: 55,
  count: 81,
};

const bins = [
  { lower_pct: 0, upper_pct: 10, count: 0 },
  { lower_pct: 10, upper_pct: 20, count: 0 },
  { lower_pct: 20, upper_pct: 30, count: 0 },
  { lower_pct: 30, upper_pct: 40, count: 6 },
  { lower_pct: 40, upper_pct: 50, count: 28 },
  { lower_pct: 50, upper_pct: 60, count: 28 },
  { lower_pct: 60, upper_pct: 70, count: 14 },
  { lower_pct: 70, upper_pct: 80, count: 5 },
  { lower_pct: 80, upper_pct: 90, count: 0 },
  { lower_pct: 90, upper_pct: 100, count: 0 },
];

const meta = {
  title: "Pages/TestDetail",
  component: TestDetailPage,
  decorators: [withAppShell("/tests/9863")],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    testId: "9863",
    lastRefreshedAt: "2026-07-18T10:00:00.000Z",
    aggregate,
    bins,
  },
} satisfies Meta<typeof TestDetailPage>;

export default meta;
type Story = StoryObj<typeof meta>;

async function waitForPage(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await waitFor(() => {
    expect(canvas.getByRole("heading", { name: "Test 9863" })).toBeInTheDocument();
  });
  return canvas;
}

export const Loading: Story = {
  args: {
    loading: true,
    aggregate: null,
    bins: [],
    lastRefreshedAt: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = await waitForPage(canvasElement);
    expect(canvas.getByRole("link", { name: "Tests" })).toHaveAttribute("aria-current", "page");
    expect(canvas.getByRole("main")).toHaveAttribute("aria-busy", "true");
    expect(canvas.queryByLabelText(/Mean/)).not.toBeInTheDocument();
    expect(canvas.queryByRole("heading", { name: "Score histogram" })).not.toBeInTheDocument();
  },
};

export const Populated: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await waitForPage(canvasElement);
    expect(canvas.getByLabelText("Mean 50.8% percent")).toBeInTheDocument();
    expect(canvas.getByRole("heading", { name: "Score histogram" })).toBeInTheDocument();
    expect(canvas.getByLabelText("40 to 50 percent: 28 students")).toBeInTheDocument();
  },
};

export const NotFound: Story = {
  args: { notFound: true, aggregate: null, bins: [] },
  play: async ({ canvasElement }) => {
    const canvas = await waitForPage(canvasElement);
    expect(canvas.getByText("This test was not found.")).toBeInTheDocument();
    expect(canvas.getByRole("link", { name: "Back to tests" })).toHaveAttribute("href", "/tests");
  },
};

export const StaleWithAnnouncement: Story = {
  args: {
    stale: true,
    announcement: "Connection restored. Showing updated results.",
    error: "Unable to load test details.",
    onRetry: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = await waitForPage(canvasElement);
    expect(
      canvas.getByRole("button", {
        name: `Reconnecting. Last refreshed: ${formatLastRefreshed("2026-07-18T10:00:00.000Z")}`,
      }),
    ).toBeInTheDocument();
    expect(canvas.getByText(/Connection restored/)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    expect(args.onRetry).toHaveBeenCalledOnce();
  },
};

export const LoadError: Story = {
  args: {
    aggregate: null,
    bins: [],
    lastRefreshedAt: null,
    error: "Unable to load test details.",
    onRetry: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = await waitForPage(canvasElement);
    expect(canvas.getByRole("alert")).toHaveTextContent("Unable to load test details.");
    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    expect(args.onRetry).toHaveBeenCalledOnce();
  },
};
