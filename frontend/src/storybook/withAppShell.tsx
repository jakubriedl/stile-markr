import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import type { Decorator } from "@storybook/react-vite";
import { createContext, useContext, useState, type ReactNode } from "react";

import { AppShell } from "../components/AppShell.tsx";

const StoryContentContext = createContext<ReactNode>(null);

function StoryPage() {
  return useContext(StoryContentContext);
}

function createShellRouter(initialPath: string) {
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
    component: StoryPage,
  });
  const testsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/tests",
    component: StoryPage,
  });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/tests/$testId",
    component: StoryPage,
  });

  return createRouter({
    routeTree: rootRoute.addChildren([indexRoute, testsRoute, detailRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

function AppShellHost({ path, children }: { path: string; children: ReactNode }) {
  const [router] = useState(() => createShellRouter(path));

  return (
    <StoryContentContext.Provider value={children}>
      <RouterProvider router={router} />
    </StoryContentContext.Provider>
  );
}

/** File-level decorator: wraps page stories in AppShell + memory router. */
export function withAppShell(path: string): Decorator {
  return (Story) => (
    <AppShellHost path={path}>
      <Story />
    </AppShellHost>
  );
}
