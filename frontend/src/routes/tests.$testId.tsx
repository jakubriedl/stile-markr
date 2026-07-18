import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tests/$testId")({
  component: TestDetailRoute,
});

function TestDetailRoute() {
  const { testId } = Route.useParams();

  return (
    <main>
      <h1>Test {testId}</h1>
      <p>Test statistics will be added in the frontend feature track.</p>
      <Link to="/tests">Back to tests</Link>
    </main>
  );
}
