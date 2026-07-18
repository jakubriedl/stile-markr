import { QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "../components/AppShell.tsx";
import { createQueryClient } from "../lib/query-client.ts";
import appCss from "../styles.css?url";

const criticalCss = `
html, body {
  margin: 0;
  min-height: 100%;
  background: #f3f6f4;
  color: #15231c;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  html, body {
    background: #101714;
    color: #e7f0eb;
    color-scheme: dark;
  }
}
`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Markr",
      },
    ],
    links: [
      {
        href: "/favicon.svg",
        rel: "icon",
        type: "image/svg+xml",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    styles: [
      {
        children: criticalCss,
      },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
});

function RootComponent() {
  const [queryClient] = useState(() => createQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Outlet />
      </AppShell>
    </QueryClientProvider>
  );
}

function RootDocument({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
