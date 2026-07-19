import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RefreshStatusTag } from "./RefreshStatusTag.tsx";

describe("RefreshStatusTag", () => {
  it("shows a focusable Live tag and exposes last refreshed in the tooltip", () => {
    render(<RefreshStatusTag lastRefreshedAt="2026-07-18T10:00:00.000Z" defaultOpen />);

    const tag = screen.getByRole("button", {
      name: /Live\. Last refreshed: 2026-07-18T10:00:00.000Z UTC/,
    });
    expect(tag).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Last refreshed: 2026-07-18T10:00:00.000Z UTC",
    );

    tag.focus();
    expect(tag).toHaveFocus();
  });

  it("shows Reconnecting when stale or not yet refreshed", () => {
    const { rerender } = render(<RefreshStatusTag lastRefreshedAt={null} />);
    expect(screen.getByRole("button", { name: /Reconnecting/ })).toBeInTheDocument();

    rerender(<RefreshStatusTag lastRefreshedAt="2026-07-18T10:00:00.000Z" stale />);
    expect(screen.getByRole("button", { name: /Reconnecting/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Live/ })).not.toBeInTheDocument();
  });
});
