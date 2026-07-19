import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { AppShell } from "./AppShell.tsx";
import { PAGE_HEADING_ELEMENT_ID } from "./page-heading-id.ts";
import { PageHeading } from "./ui/Heading.tsx";

function createAppShellRouter(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <AppShell>
        <Outlet />
      </AppShell>
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <>
        <PageHeading>Upload exam results</PageHeading>
        <p>Import content</p>
      </>
    ),
  });
  const testsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/tests",
    component: () => (
      <>
        <PageHeading>Tests</PageHeading>
        <p>Tests content</p>
      </>
    ),
  });

  return createRouter({
    routeTree: rootRoute.addChildren([indexRoute, testsRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

function AppShellRoute({ path }: { path: string }) {
  const [router, setRouter] = useState<ReturnType<typeof createAppShellRouter> | null>(null);

  useEffect(() => {
    const next = createAppShellRouter(path);
    void next.load().then(() => setRouter(next));
  }, [path]);

  if (router == null) {
    return <p>Loading shell…</p>;
  }
  return <RouterProvider router={router} />;
}

const meta = {
  title: "Components/AppShell",
  component: AppShellRoute,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppShellRoute>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ImportActive: Story = {
  args: { path: "/" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByRole("link", { name: "Import" })).toHaveAttribute("aria-current", "page");
    });
    expect(canvas.getByRole("link", { name: "Tests" })).not.toHaveAttribute("aria-current");
    expect(canvas.getByRole("banner", { name: "Markr" })).toBeInTheDocument();
    expect(canvas.getByRole("link", { name: "Skip to main content" })).toHaveAttribute(
      "href",
      "#page-heading",
    );
  },
};

export const TestsActive: Story = {
  args: { path: "/tests" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByRole("link", { name: "Tests" })).toHaveAttribute("aria-current", "page");
    });
    expect(canvas.getByRole("link", { name: "Import" })).not.toHaveAttribute("aria-current");
  },
};

export const FocusesHeadingAfterNavigation: Story = {
  args: { path: "/tests" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByRole("heading", { name: "Tests" })).toBeInTheDocument();
    });
    expect(document.activeElement).not.toBe(document.getElementById(PAGE_HEADING_ELEMENT_ID));

    await userEvent.click(canvas.getByRole("link", { name: "Import" }));

    await waitFor(() => {
      expect(document.activeElement).toBe(document.getElementById(PAGE_HEADING_ELEMENT_ID));
    });
    expect(document.activeElement).toHaveTextContent("Upload exam results");
  },
};
