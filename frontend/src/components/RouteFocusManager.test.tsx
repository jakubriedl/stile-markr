import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { PAGE_HEADING_ELEMENT_ID } from "./page-heading-id.ts";
import { RouteFocusManager } from "./RouteFocusManager.tsx";
import { PageHeading } from "./ui/Heading.tsx";

function createTestRouter() {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <RouteFocusManager />
        <nav>
          <Link to="/">Import</Link>
          <Link to="/tests">Tests</Link>
        </nav>
        <Outlet />
      </>
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <PageHeading>Upload exam results</PageHeading>,
  });
  const testsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/tests",
    component: () => <PageHeading>Tests</PageHeading>,
  });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/tests/$testId",
    component: () => <PageHeading>Test 9863</PageHeading>,
  });

  return createRouter({
    routeTree: rootRoute.addChildren([indexRoute, testsRoute, detailRoute]),
    history: createMemoryHistory({ initialEntries: ["/tests"] }),
  });
}

describe("RouteFocusManager", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not focus the heading on the initial route", async () => {
    const router = createTestRouter();
    await router.load();
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: "Tests" })).toBeInTheDocument();
    expect(document.activeElement).not.toBe(document.getElementById(PAGE_HEADING_ELEMENT_ID));
  });

  it("focuses the page heading after client navigation", async () => {
    const user = userEvent.setup();
    const router = createTestRouter();
    await router.load();
    render(<RouterProvider router={router} />);

    await screen.findByRole("heading", { name: "Tests" });
    await user.click(screen.getByRole("link", { name: "Import" }));

    await waitFor(() => {
      expect(document.activeElement).toBe(document.getElementById(PAGE_HEADING_ELEMENT_ID));
    });
    expect(document.activeElement).toHaveTextContent("Upload exam results");
  });
});
