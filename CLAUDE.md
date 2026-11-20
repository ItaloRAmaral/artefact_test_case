# Task manager: technical test

## What this is

A small task manager for a technical test: a Next.js app whose back end keeps tasks in memory and exposes CRUD through tRPC, with an SSR list page (delete with feedback, infinite scroll as a bonus, a title search and a creation-date filter the user asked for, D-34) and a create/edit form. **The spec is `docs/SPEC.md`; read it before any task.** Its guiding line: "less is more, simple but functional". No database, no authentication: do not add either.

## Never infer, never assume

- Do not state anything you have not verified. If it is not in the spec, the code or the docs, **ask the user**, or ask permission to research it (official docs).
- When in doubt about intent, scope or a decision, **ask** instead of choosing silently.
- If no reliable source exists, say so and label the claim as an estimate.

## Where things live

| Path                                        | What                                                                                                                                                                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/SPEC.md`                              | The test statement (source of truth for scope)                                                                                                                                                                                     |
| `src/server/`, `src/client/`, `src/shared/` | Back end; shared client components (`src/client/shared/<name>/`) and the tRPC React provider (type-only imports from `src/server/`); code both sides use. A page's own components live in its route's `_components/<name>/` (D-32) |
| `docs/plans/`                               | Implementation plans, written with the `planning-code-changes` skill                                                                                                                                                               |
| `README.md`                                 | How the system works and how to run it (a deliverable of the test)                                                                                                                                                                 |
| `docs/DECISIONS.md`                         | Main decisions (D-NN), each with context, the choice and why, plus the open ones                                                                                                                                                   |
| `.claude/rules/code-style.md`               | Code style guide (source of truth for style), always loaded                                                                                                                                                                        |
| `.claude/rules/backend.md`                  | Back-end architecture: hexagonal layers, repository, dependency rule; loaded on `src/server/**` and `src/shared/**`                                                                                                                |
| `.claude/rules/tests.md`                    | Test conventions, loaded on test files                                                                                                                                                                                             |
| `.claude/skills/`                           | `planning-code-changes`, `writing-tests`                                                                                                                                                                                           |
| `.claude/agents/plan-reviewer.md`           | Read-only reviewer of plans                                                                                                                                                                                                        |
| `.claude/settings.json`, `.claude/hooks/`   | Permissions and the hook that blocks git commands that create commits or publish                                                                                                                                                   |

## Stack

Versions are pinned exactly in `package.json`. Decided with the user on 2026-11-19: the spec says both "NextJS (v15)" and "use the most recent versions"; we follow the latter, so Next.js is the latest stable (16.x) and every other piece is the newest version compatible with it and with the lint toolchain that is at least 7 days old (pnpm 12 refuses fresher releases by default; DECISIONS D-19). `package.json` holds the exact pins; the table gives the line and why. `docs/DECISIONS.md` records each choice.

| Piece                | Version                                                               | Why this one                                                                                                                                              |
| -------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node                 | 24.22.2 (`.nvmrc`)                                                    | installed LTS                                                                                                                                             |
| pnpm                 | 12.21.0 (`packageManager`)                                            | latest; pnpm switches to it automatically                                                                                                                 |
| Next.js (App Router) | 16.4.6                                                                | latest stable; the spec asks for the most recent versions (the "v15" mention is recorded in `docs/DECISIONS.md`)                                          |
| React                | 19.3.1                                                                | accepted by Next 16 (`^19.0.0`)                                                                                                                           |
| tRPC                 | 11.28.0: `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query` | newest at least 7 days old (D-19); 11.29.5 was too fresh                                                                                                  |
| TanStack Query       | 5.107.1                                                               | peer of `@trpc/tanstack-react-query` (`^5.106.0`), newest at least 7 days old (D-19)                                                                      |
| Zod                  | 4.6.7                                                                 | input schemas shared by the procedures and the form (D-06)                                                                                                |
| Tailwind CSS         | 4.3.5 (`tailwindcss`, `@tailwindcss/postcss`)                         | styling, no component library (D-33)                                                                                                                      |
| TypeScript           | 6.0.3                                                                 | typescript-eslint supports `<6.1.0`; 7.x is newer but unsupported                                                                                         |
| ESLint               | 10.x (10.14.0 installed)                                              | latest major, supported by `eslint-config-next@16` per its docs; its React, a11y and import plugins still declare peers up to 9 (accepted warnings, D-16) |
| Vitest               | 5.1.0, with Testing Library and jsdom 31.0.0 for component tests      | —                                                                                                                                                         |
| Playwright           | 1.65.0, Chromium only                                                 | production build on port 3100 (D-18)                                                                                                                      |
| server-only          | 0.0.1                                                                 | makes a client import of server wiring fail the build (D-13)                                                                                              |

## Language

Everything in the repository is English: code, identifiers, UI text, README, docs, plans, commit messages. The spec names fields in Portuguese; the code uses `title` (titulo), `description` (descricao) and `createdAt` (dataCriacao), and the README states this mapping. Talk to the user in their language.

## How we work

- **Never run `git commit` or `git push`**, nor other git commands that create commits, move refs or publish (`merge`, `rebase`, `cherry-pick`, `revert`, `am`, `tag`). When work is ready, give the user the Conventional Commits message and the exact list of files to stage.
- Every code or configuration change starts from a plan the user approved (`planning-code-changes` skill): a short plan in the conversation for small, local changes, a full plan in `docs/plans/` otherwise. Only prose docs, comments and formatting skip planning.
- Tests are written with the `writing-tests` skill: test-first for server logic and form validation.
- Prefer the simplest thing that meets the spec. The back end follows the hexagonal architecture in `.claude/rules/backend.md` (the user's choice); beyond it, a layer, library or abstraction the spec does not need is a deviation (`.claude/rules/code-style.md`).
- A main decision (stack, architecture, a trade-off the spec leaves open) goes in `docs/DECISIONS.md` as a new `D-NN` entry in the same change that makes it; an item resolved from its "Open decisions" list moves into an entry. A changed decision is not edited away: it gets "Superseded by D-NN" and a new entry. The README changes in the same change that changes how to run the app.

## Hard rules for code

Style follows `.claude/rules/code-style.md`; its principles may be broken only with the justification it requires in the plan. The rules below never are.

- The back end respects the dependency rule of `.claude/rules/backend.md`: `src/server/domains/` (entities, repositories, use cases) imports nothing external; only `src/server/adapters/` knows frameworks and libraries.
- Every tRPC procedure validates its input shape with a strict Zod schema (unknown fields rejected), in `.input()`; the form reuses the same schema. Task invariants live in the `Task` entity; limits are constants defined once in `src/shared/tasks/task-limits.ts`, used by both the entity and the schema.
- Expected failures are domain errors with a literal `code`, translated to a tRPC code in one place; the client tells errors apart by code, never by message text. No stack trace or internal detail reaches the client.
- Procedures return explicit output objects built field by field, never an entity or a stored snapshot.
- Tasks change only through use cases and the `Task` entity; the repository stores and returns copies.
- No client component imports a value from `src/server/`; an `import type` (erased at build, such as the `AppRouter` type) is allowed (D-26). The modules that wire or expose the server (the composition root and `adapters/`) import `server-only`, so a value import fails the build; `domains/` stays free of it (it imports nothing external).
- No secrets in the repository; no `console.log` left in code.

## Tests

- Arrange, Act, Assert, separated by blank lines, without comments; one Act per test; no logic in tests.
- Test names describe the behavior, not the mechanism.
- TDD for the entity, the use cases, the router and form validation.
- Coverage: at least 90% of lines and branches in server code (`src/server/**`), enforced by the Vitest config. No mutation testing.
- Levels: unit (Vitest: entity, use cases with the in-memory repository and fake timers where time matters, router through `createCaller`, schemas), component (Vitest + Testing Library + jsdom: the list with delete and infinite scroll, the form, the edit page), end to end (Playwright: the main flows).

## Commands

Never guess a command; ask.

| Task                                                       | Command                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| Install                                                    | `pnpm install`                                                  |
| Run (dev)                                                  | `pnpm dev`                                                      |
| Build and start                                            | `pnpm build && pnpm start`                                      |
| Unit and component tests                                   | `pnpm test`                                                     |
| Tests with the coverage gate                               | `pnpm test:coverage`                                            |
| End to end (once: `pnpm exec playwright install chromium`) | `pnpm test:e2e` (builds and starts its own server on port 3100) |
| Lint and types                                             | `pnpm lint`, `pnpm typecheck` (runs `next typegen` first)       |
| Formatting                                                 | `pnpm format:check`, `pnpm format` to fix                       |

The version-matched Next.js docs are in `node_modules/next/dist/docs/` (see `AGENTS.md`); read them before relying on Next.js behavior from memory.
