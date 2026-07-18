import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getRouter } from "./router.tsx";

vi.mock("./styles.css?url", () => ({ default: "/styles.css" }));

describe("application router", () => {
  it("renders and navigates across the foundation routes", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const router = getRouter();
    router.update({
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    await router.load();
    expect(renderToStaticMarkup(<RouterProvider router={router} />)).toContain(
      "<h1>Upload exam results</h1>",
    );

    await router.navigate({ to: "/tests" });
    expect(renderToStaticMarkup(<RouterProvider router={router} />)).toContain("<h1>Tests</h1>");

    await router.navigate({
      params: { testId: "exam-1" },
      to: "/tests/$testId",
    });
    expect(renderToStaticMarkup(<RouterProvider router={router} />)).toContain(
      "<h1>Test exam-1</h1>",
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
