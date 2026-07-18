import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { createFoundationHandlers } from "../../mocks/handlers/foundation.ts";
import { FoundationApiCheck } from "./foundation-api-check.tsx";

const meta = {
  args: {
    endpoint: "https://markr.test/api/foundation",
  },
  component: FoundationApiCheck,
  parameters: {
    msw: {
      handlers: createFoundationHandlers("https://markr.test"),
    },
  },
  tags: ["test"],
} satisfies Meta<typeof FoundationApiCheck>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SuccessfulCheck: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Check API" }));
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Ready"));
  },
};
