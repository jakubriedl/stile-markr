import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RefreshStatusTag } from "./RefreshStatusTag.tsx";

describe("RefreshStatusTag", () => {
  it("renders nothing until the first poll has settled", () => {
    const { container } = render(<RefreshStatusTag lastRefreshedAt={null} settled={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a focusable Live tag and exposes last refreshed in the tooltip", () => {
    render(<RefreshStatusTag lastRefreshedAt="2026-07-18T10:00:00.000Z" settled defaultOpen />);

    const tag = screen.getByRole("button", {
      name: /Live\. Last refreshed: 18 July 2026, 10:00:00 UTC/,
    });
    expect(tag).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Last refreshed: 18 July 2026, 10:00:00 UTC",
    );

    tag.focus();
    expect(tag).toHaveFocus();
  });

  it("shows Reconnecting when stale or settled without a successful refresh", () => {
    const { rerender } = render(<RefreshStatusTag lastRefreshedAt={null} settled />);
    expect(screen.getByRole("button", { name: /Reconnecting/ })).toBeInTheDocument();

    rerender(<RefreshStatusTag lastRefreshedAt="2026-07-18T10:00:00.000Z" stale settled />);
    expect(screen.getByRole("button", { name: /Reconnecting/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Live/ })).not.toBeInTheDocument();
  });
});
