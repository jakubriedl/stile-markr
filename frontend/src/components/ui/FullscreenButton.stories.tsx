import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { FullscreenButton, PAGE_CONTENT_ELEMENT_ID } from "./FullscreenButton.tsx";

const meta = {
  title: "Components/FullscreenButton",
  component: FullscreenButton,
  decorators: [
    (Story) => (
      <div id={PAGE_CONTENT_ELEMENT_ID} className="p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FullscreenButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Enter: Story = {
  args: { forcedActive: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Enter full screen" });
    expect(button).toHaveAttribute("aria-pressed", "false");
  },
};

export const Exit: Story = {
  args: { forcedActive: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Exit full screen" });
    expect(button).toHaveAttribute("aria-pressed", "true");
  },
};
