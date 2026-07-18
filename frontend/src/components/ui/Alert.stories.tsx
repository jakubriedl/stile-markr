import type { Meta, StoryObj } from "@storybook/react-vite";

import { Alert } from "./Alert.tsx";

const meta = {
  title: "UI/Alert",
  component: Alert,
  args: {
    children: "Choose an XML file before uploading.",
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Danger: Story = {};

export const Success: Story = {
  args: {
    tone: "polite",
    variant: "success",
    children: "Imported 81 unique results.",
  },
};
