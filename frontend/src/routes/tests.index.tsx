import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tests/")({
  component: TestsRoute,
});

function TestsRoute() {
  return (
    <main>
      <h1>Tests</h1>
      <p>No tests have been imported.</p>
      <Link to="/">Upload exam results</Link>
    </main>
  );
}
