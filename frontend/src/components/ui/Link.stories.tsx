import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Link } from "./Link.tsx";

const meta = {
  title: "Components/Link",
  component: Link,
  args: {
    href: "/tests",
    children: "Back to tests",
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Back to tests" });
    await userEvent.tab();
    expect(link).toHaveFocus();
  },
};
