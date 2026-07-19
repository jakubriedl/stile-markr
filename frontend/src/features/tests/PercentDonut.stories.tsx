import type { Meta, StoryObj } from "@storybook/react-vite";

import { PercentDonut } from "./PercentDonut.tsx";

const meta = {
  title: "Components/PercentDonut",
  component: PercentDonut,
  decorators: [
    (Story) => (
      <div className="p-4 text-[var(--markr-accent)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PercentDonut>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { value: 0 },
};

export const MidFill: Story = {
  args: { value: 50 },
};

export const Full: Story = {
  args: { value: 100 },
};
