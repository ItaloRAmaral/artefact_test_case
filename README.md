# Task manager

A small task manager built for a technical test: a Next.js app whose back end keeps tasks in memory and exposes create, list, update and delete through tRPC, with a server-rendered list page and a create/edit form. The test statement is in [`docs/SPEC.md`](docs/SPEC.md).

> Work in progress: this README grows with each part of the [roadmap](docs/plans/2026-11-19-roadmap.md). Today it covers the project setup.

## Requirements

- Node.js 24.22.2 (see `.nvmrc`)
- pnpm 12. The exact version is pinned in `package.json` (`packageManager`), and pnpm switches to it automatically.

## Run

```bash
pnpm install
pnpm dev                    # development server on http://localhost:3000
pnpm build && pnpm start    # production build and server
```

Tasks live in memory, so restarting the server empties the list.

## Test

```bash
pnpm test                   # unit and component tests (Vitest)
pnpm test:coverage          # the same, with the 90% coverage gate on server code

pnpm exec playwright install chromium   # once, to download the browser
pnpm test:e2e               # end-to-end tests (Playwright) on a production build
```

`pnpm test:e2e` builds the app and starts its own server on port 3100, so every run starts from an empty task list.

## Lint and format

```bash
pnpm lint                   # ESLint, including the architecture import rules
pnpm typecheck              # route types, then the TypeScript compiler
pnpm format:check           # Prettier check (pnpm format to fix)
```

## Decisions and plans

- [`docs/DECISIONS.md`](docs/DECISIONS.md): the main decisions, each with its context and reasons: versions, architecture, contract, tests.
- [`docs/plans/`](docs/plans/): the roadmap and the implementation plan of each part.
