import { useState } from "react";
import { Button } from "react-aria-components";

export interface FoundationApiCheckProps {
  readonly endpoint?: string;
}

export function FoundationApiCheck({ endpoint = "/api/foundation" }: FoundationApiCheckProps) {
  const [status, setStatus] = useState("Not checked");

  async function checkApi() {
    setStatus("Checking");
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Foundation check failed");
      }
      const body: unknown = await response.json();
      setStatus(
        typeof body === "object" && body !== null && "ready" in body && body.ready === true
          ? "Ready"
          : "Unavailable",
      );
    } catch {
      setStatus("Unavailable");
    }
  }

  return (
    <section aria-labelledby="foundation-api-heading">
      <h2 id="foundation-api-heading">API foundation</h2>
      <Button onPress={checkApi}>Check API</Button>
      <p role="status">{status}</p>
    </section>
  );
}
