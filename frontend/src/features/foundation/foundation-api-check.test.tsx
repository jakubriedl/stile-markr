import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { mockServer } from "../../../tests/msw-server.ts";
import { FoundationApiCheck } from "./foundation-api-check.tsx";

describe("FoundationApiCheck", () => {
  it("reports a successful MSW-backed API check", async () => {
    const user = userEvent.setup();
    render(<FoundationApiCheck endpoint="http://localhost/api/foundation" />);

    await user.click(screen.getByRole("button", { name: "Check API" }));

    await expect(screen.findByRole("status")).resolves.toHaveTextContent("Ready");
  });

  it("reports an unexpected successful response as unavailable", async () => {
    mockServer.use(
      http.get("http://localhost/api/foundation", () => HttpResponse.json({ ready: false })),
    );
    const user = userEvent.setup();
    render(<FoundationApiCheck endpoint="http://localhost/api/foundation" />);

    await user.click(screen.getByRole("button", { name: "Check API" }));

    await expect(screen.findByRole("status")).resolves.toHaveTextContent("Unavailable");
  });

  it("reports an HTTP failure as unavailable", async () => {
    mockServer.use(
      http.get("http://localhost/api/foundation", () => new HttpResponse(null, { status: 503 })),
    );
    const user = userEvent.setup();
    render(<FoundationApiCheck endpoint="http://localhost/api/foundation" />);

    await user.click(screen.getByRole("button", { name: "Check API" }));

    await expect(screen.findByRole("status")).resolves.toHaveTextContent("Unavailable");
  });
});
