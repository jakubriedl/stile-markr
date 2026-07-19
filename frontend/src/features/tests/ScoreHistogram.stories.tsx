import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { ScoreHistogram } from "./ScoreHistogram.tsx";
import { ScoreHistogramSkeleton } from "./ScoreHistogramSkeleton.tsx";

const meta = {
  title: "Components/ScoreHistogram",
  component: ScoreHistogram,
} satisfies Meta<typeof ScoreHistogram>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sparse: Story = {
  args: {
    bins: [
      { lower_pct: 0, upper_pct: 10, count: 2 },
      { lower_pct: 10, upper_pct: 20, count: 5 },
      { lower_pct: 20, upper_pct: 30, count: 0 },
      { lower_pct: 30, upper_pct: 40, count: 1 },
      { lower_pct: 40, upper_pct: 50, count: 0 },
      { lower_pct: 50, upper_pct: 60, count: 0 },
      { lower_pct: 60, upper_pct: 70, count: 0 },
      { lower_pct: 70, upper_pct: 80, count: 0 },
      { lower_pct: 80, upper_pct: 90, count: 0 },
      { lower_pct: 90, upper_pct: 100, count: 0 },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("heading", { name: "Score histogram" })).toBeInTheDocument();
    expect(
      canvas.getByRole("listitem", { name: "0 to 10 percent: 2 students" }),
    ).toBeInTheDocument();
    expect(
      canvas.getByRole("listitem", { name: "10 to 20 percent: 5 students" }),
    ).toBeInTheDocument();
  },
};

export const PeakInMiddle: Story = {
  args: {
    bins: [
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
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      canvas.getByRole("listitem", { name: "40 to 50 percent: 28 students" }),
    ).toBeInTheDocument();
    expect(
      canvas.getByRole("listitem", { name: "50 to 60 percent: 28 students" }),
    ).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: { bins: [] },
  render: () => <ScoreHistogramSkeleton />,
};
