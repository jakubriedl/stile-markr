import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FullscreenButton, PAGE_CONTENT_ELEMENT_ID } from "./FullscreenButton.tsx";

describe("FullscreenButton", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => null,
    });
  });

  it("requests fullscreen on the page content element", async () => {
    const user = userEvent.setup();
    const content = document.createElement("div");
    content.id = PAGE_CONTENT_ELEMENT_ID;
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    content.requestFullscreen = requestFullscreen;
    document.body.append(content);

    render(<FullscreenButton />);
    await user.click(screen.getByRole("button", { name: "Enter full screen" }));

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it("exits fullscreen when already active", async () => {
    const user = userEvent.setup();
    const content = document.createElement("div");
    content.id = PAGE_CONTENT_ELEMENT_ID;
    document.body.append(content);
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => content,
    });
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);
    document.exitFullscreen = exitFullscreen;

    render(<FullscreenButton />);
    await user.click(screen.getByRole("button", { name: "Exit full screen" }));

    expect(exitFullscreen).toHaveBeenCalledOnce();
  });
});
