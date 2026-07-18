import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./Button.tsx";

const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Upload",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Cancel" },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};
