import type { Meta, StoryObj } from "@storybook/react-vite";

import { TestsListPage } from "./TestsListPage.tsx";

const meta = {
  title: "Pages/TestsList",
  component: TestsListPage,
  args: {
    lastRefreshedAt: "2026-07-18T10:00:00.000Z",
    tests: [{ test_id: "9863", student_count: 81, marks_available: 20 }],
  },
} satisfies Meta<typeof TestsListPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};

export const Empty: Story = {
  args: { tests: [] },
};
