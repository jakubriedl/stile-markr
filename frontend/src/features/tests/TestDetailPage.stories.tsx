import type { Meta, StoryObj } from "@storybook/react-vite";

import { TestDetailPage } from "./TestDetailPage.tsx";

const meta = {
  title: "Pages/TestDetail",
  component: TestDetailPage,
  args: {
    testId: "9863",
    lastRefreshedAt: "2026-07-18T10:00:00.000Z",
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
} satisfies Meta<typeof TestDetailPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};

export const NotFound: Story = {
  args: { notFound: true, aggregate: null, bins: [] },
};

export const Loading: Story = {
  args: {
    loading: true,
    aggregate: null,
    bins: [],
    lastRefreshedAt: null,
  },
};
