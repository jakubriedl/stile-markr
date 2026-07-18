import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button.tsx";

describe("Button", () => {
  it("invokes press handlers and exposes a visible focusable control", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Upload</Button>);

    const button = screen.getByRole("button", { name: "Upload" });
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onPress).toHaveBeenCalledOnce();
  });
});
