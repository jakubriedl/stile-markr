# Agent Guide

## Repository status

This is a greenfield repository in the planning stage. There is no application implementation yet.

## Repository map

- `PLAN.md` is the evolving plan and todo list.
- `REQUIREMENTS.md` is the product-requirements and acceptance-criteria source of truth.
- `NOTES.md` records development considerations and context.
- `README.md` is the human-facing project overview.
- `AGENTS.md` contains instructions for agents.
- `task/` contains the task brief and supporting materials.

## Working guidance

- Treat `task/` as source material and do not modify it.
- Use `REQUIREMENTS.md` as the source of truth for product behavior.
- Use `PLAN.md` as the source of truth for planned work and ordering.
- Do not begin implementation while requirements and architecture remain undecided.
- Add newly discovered work to the todo list in `PLAN.md`.
- Record useful observations and trade-offs in `NOTES.md`.
- Keep explicit requirements separate from assumptions when requirements are clarified.
- Reference the relevant note when a clarified decision changes `REQUIREMENTS.md`.
- After implementing and validating each significant part of the work, create a descriptive commit that clearly summarizes the completed change.

Coding conventions, commands, tests, and the source layout will be documented after the architecture is designed.
