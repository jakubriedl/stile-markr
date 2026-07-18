import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main>
      <h1>Upload exam results</h1>
      <p>The upload workflow will be added in the frontend feature track.</p>
      <Link to="/tests">View tests</Link>
    </main>
  );
}
