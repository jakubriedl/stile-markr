import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Alert } from "./Alert.tsx";

const meta = {
  title: "Components/Alert",
  component: Alert,
  args: {
    children: "Choose an XML file before uploading.",
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AssertiveDanger: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  },
};

export const PoliteSuccess: Story = {
  args: {
    tone: "polite",
    variant: "success",
    children: "Imported 81 unique results.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("status")).toHaveAttribute("aria-live", "polite");
  },
};

export const Neutral: Story = {
  args: {
    tone: "polite",
    variant: "neutral",
    children: "Couldn't refresh right now. You're still seeing the last loaded results.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("status")).toBeInTheDocument();
  },
};
