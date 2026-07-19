import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";

import { formatLastRefreshed } from "../../lib/live-state/displayed-snapshots.ts";
import { RefreshStatusTag } from "./RefreshStatusTag.tsx";

const meta = {
  title: "Components/RefreshStatusTag",
  component: RefreshStatusTag,
  args: {
    lastRefreshedAt: "2026-07-18T10:00:00.000Z",
    settled: true,
  },
} satisfies Meta<typeof RefreshStatusTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HiddenUntilSettled: Story = {
  args: {
    settled: false,
    lastRefreshedAt: null,
  },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).queryByRole("button")).toBeNull();
  },
};

export const Live: Story = {
  args: {
    defaultOpen: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const refreshed = formatLastRefreshed("2026-07-18T10:00:00.000Z");
    const tag = canvas.getByRole("button", {
      name: `Live. Last refreshed: ${refreshed}`,
    });
    expect(tag).toBeInTheDocument();
    // Tooltip portals outside the story root.
    await waitFor(() => {
      expect(within(document.body).getByRole("tooltip")).toHaveTextContent(
        `Last refreshed: ${refreshed}`,
      );
    });
  },
};

export const Reconnecting: Story = {
  args: {
    stale: true,
    defaultOpen: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("button", { name: /Reconnecting/ })).toBeInTheDocument();
    expect(canvas.queryByRole("button", { name: /^Live/ })).not.toBeInTheDocument();
  },
};
