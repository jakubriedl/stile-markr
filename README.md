# Markr

Markr is an exam-results ingestion and reporting application described in the provided [task brief](task/README.md).

Requirements and architecture are documented. Application implementation has not started.

## Repository

- [`PLAN.md`](PLAN.md) — current plan and todo list
- [`REQUIREMENTS.md`](REQUIREMENTS.md) — product requirements and acceptance criteria
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — implementation architecture and production evolution path
- [`NOTES.md`](NOTES.md) — development considerations and context
- [`AGENTS.md`](AGENTS.md) — guidance for agents working in this repository
- [`.agents/skills/`](.agents/skills/) — reviewed third-party project skills
- [`.cursor/skills/`](.cursor/skills/) — Markr-specific agent workflows
- [`task/`](task/) — task brief and supporting materials

## Setup

No runnable application exists yet. Setup commands will be added with the workspace scaffold.

## Architecture

The selected starter architecture is a pnpm/Turborepo TypeScript workspace with:

- a TanStack Start SSR frontend in `/frontend`;
- a Hono backend in `/backend`;
- Bun as the preferred runtime for both services, subject to a compatibility gate;
- Drizzle with persistent SQLite and a documented PostgreSQL production path;
- React Aria Components, Tailwind, Storybook, MSW, and TanStack Query; and
- Vitest, OpenTelemetry, evlog, Docker Compose, and GitHub Actions.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for service boundaries, data flows, tests, deployment, and agent workflow.

## Usage

To be defined after implementation.
