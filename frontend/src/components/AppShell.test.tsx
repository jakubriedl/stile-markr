import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getRouter } from "../router.tsx";

vi.mock("../styles.css?url", () => ({ default: "/styles.css" }));

describe("AppShell", () => {
  it("renders Upload and Tests nav links with Upload active on home", async () => {
    const router = getRouter();
    router.update({
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    await router.load();
    render(<RouterProvider router={router} />);

    const upload = screen.getByRole("link", { name: "Upload" });
    const tests = screen.getByRole("link", { name: "Tests" });
    expect(upload).toHaveAttribute("href", "/");
    expect(tests).toHaveAttribute("href", "/tests");
    expect(upload).toHaveAttribute("aria-current", "page");
    expect(tests).not.toHaveAttribute("aria-current");
  });

  it("marks Tests active on the tests list route", async () => {
    const router = getRouter();
    router.update({
      history: createMemoryHistory({ initialEntries: ["/tests"] }),
    });
    await router.load();
    render(<RouterProvider router={router} />);

    expect(screen.getByRole("link", { name: "Tests" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Upload" })).not.toHaveAttribute("aria-current");
  });
});
