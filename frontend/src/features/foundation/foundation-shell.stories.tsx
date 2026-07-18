import type { Meta, StoryObj } from "@storybook/react-vite";

import { FoundationShell } from "./foundation-shell.tsx";

const meta = {
  component: FoundationShell,
  tags: ["autodocs"],
} satisfies Meta<typeof FoundationShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    description: "The application foundation is ready for feature work.",
    heading: "Markr",
  },
};
