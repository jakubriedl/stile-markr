import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { TextField } from "./TextField.tsx";

const meta = {
  title: "Components/TextField",
  component: TextField,
  args: {
    label: "Student number",
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByLabelText("Student number")).toBeInTheDocument();
  },
};

export const WithDescription: Story = {
  args: {
    description: "Digits only",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByLabelText("Student number")).toBeInTheDocument();
    expect(canvas.getByText("Digits only")).toBeInTheDocument();
  },
};
