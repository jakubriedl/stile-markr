import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

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
    const canvas = within(canvasElement);
    expect(canvas.queryByRole("img")).toBeNull();
    expect(canvas.queryByRole("button")).toBeNull();
  },
};

export const Live: Story = {
  args: {
    defaultOpen: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const refreshed = formatLastRefreshed("2026-07-18T10:00:00.000Z");
    const accessibleName = `Live. Last refreshed: ${refreshed}`;
    const tag = canvas.getByRole("img", { name: accessibleName });
    expect(tag).toBeInTheDocument();
    expect(canvas.queryByRole("button", { name: accessibleName })).toBeNull();
    expect(canvas.getByText(`Last refreshed: ${refreshed}`)).toBeInTheDocument();
  },
};

export const Reconnecting: Story = {
  args: {
    stale: true,
    defaultOpen: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("img", { name: /Reconnecting\. Last refreshed:/ })).toBeInTheDocument();
    expect(canvas.queryByRole("img", { name: /^Live\./ })).toBeNull();
    expect(canvas.queryByRole("button", { name: /Reconnecting/ })).toBeNull();
  },
};
