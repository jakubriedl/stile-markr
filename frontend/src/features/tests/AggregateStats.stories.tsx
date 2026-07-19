import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { AggregateStats } from "./AggregateStats.tsx";
import { AggregateStatsSkeleton } from "./AggregateStatsSkeleton.tsx";

const meta = {
  title: "Components/AggregateStats",
  component: AggregateStats,
  args: {
    aggregate: {
      mean: 50.8,
      stddev: 9.92,
      min: 30,
      max: 75,
      p25: 45,
      p50: 50,
      p75: 55,
      count: 81,
    },
  },
} satisfies Meta<typeof AggregateStats>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypicalFixture: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("group", { name: "Aggregate statistics" })).toBeInTheDocument();
    expect(canvas.getByLabelText("Students 81")).toBeInTheDocument();
    expect(canvas.getByLabelText("Mean 50.8% percent")).toBeInTheDocument();
    expect(canvas.getByLabelText("Std. dev. 9.92% percentage points")).toBeInTheDocument();
    expect(canvas.getByLabelText("Median 50% percent")).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    aggregate: {
      mean: 0,
      stddev: 0,
      min: 0,
      max: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      count: 0,
    },
  },
  render: () => <AggregateStatsSkeleton />,
};
