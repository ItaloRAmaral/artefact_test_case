# Decisions

The main decisions behind this project, each with its context, the choice and why. The test statement is in [`SPEC.md`](SPEC.md). New decisions are added in the same change that makes them; a decision that changes is not edited away: the entry gets a "Superseded by D-NN" note and a new entry explains the change.

| #                                                                                               | Decision                                                                                 | Date       |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------- |
| [D-01](#d-01-latest-nextjs-1646-instead-of-v15)                                                 | Latest Next.js (16.4.6) instead of v15                                                   | 2026-11-19 |
| [D-02](#d-02-newest-compatible-versions-for-the-rest-of-the-stack)                              | Newest compatible versions for the rest of the stack                                     | 2026-11-19 |
| [D-03](#d-03-english-everywhere-including-the-task-fields)                                      | English everywhere, including the task fields                                            | 2026-11-19 |
| [D-04](#d-04-hexagonal-architecture-with-a-repository-on-the-back-end)                          | Hexagonal architecture with a repository on the back end                                 | 2026-11-19 |
| [D-05](#d-05-in-memory-repository-kept-on-globalthis)                                           | In-memory repository kept on `globalThis`                                                | 2026-11-19 |
| [D-06](#d-06-one-zod-contract-shared-by-server-and-form-invariants-in-the-entity)               | One Zod contract shared by server and form; invariants in the entity                     | 2026-11-19 |
| [D-07](#d-07-errors-as-domain-codes-translated-in-one-place)                                    | Errors as domain codes, translated in one place                                          | 2026-11-19 |
| [D-08](#d-08-lean-test-strategy)                                                                | Lean test strategy                                                                       | 2026-11-19 |
| [D-09](#d-09-no-authentication-no-database)                                                     | No authentication, no database                                                           | 2026-11-19 |
| [D-10](#d-10-infinite-scroll-with-cursor-pagination-from-the-start)                             | Infinite scroll, with cursor pagination from the start                                   | 2026-11-19 |
| [D-11](#d-11-createdat-travels-as-an-iso-8601-string)                                           | `createdAt` travels as an ISO 8601 string                                                | 2026-11-19 |
| [D-12](#d-12-newest-tasks-first)                                                                | Newest tasks first                                                                       | 2026-11-19 |
| [D-13](#d-13-limits-live-in-srcshared-server-only-only-on-server-wiring)                        | Limits live in `src/shared`; `server-only` only on server wiring                         | 2026-11-19 |
| [D-14](#d-14-dates-rendered-in-utc-on-the-server-local-time-after-hydration)                    | Dates rendered in UTC on the server, local time after hydration                          | 2026-11-19 |
| [D-15](#d-15-the-trpc-contract)                                                                 | The tRPC contract                                                                        | 2026-11-19 |
| [D-16](#d-16-eslint-10)                                                                         | ESLint 10                                                                                | 2026-11-19 |
| [D-17](#d-17-layer-rule-enforced-with-no-restricted-imports)                                    | Layer rule enforced with `no-restricted-imports`                                         | 2026-11-19 |
| [D-18](#d-18-e2e-tests-on-a-production-build-chromium-only)                                     | e2e tests on a production build, Chromium only                                           | 2026-11-19 |
| [D-19](#d-19-newest-version-at-least-7-days-old)                                                | Newest version at least 7 days old                                                       | 2026-11-19 |
| [D-20](#d-20-limits-title-120-description-1000-page-10-to-50)                                   | Limits: title 120, description 1000, page 10 (max 50)                                    | 2026-11-19 |
| [D-21](#d-21-position-cursor)                                                                   | Position cursor                                                                          | 2026-11-19 |
| [D-22](#d-22-storage-capped-at-1000-tasks)                                                      | Storage capped at 1000 tasks                                                             | 2026-11-19 |
| [D-23](#d-23-back-end-folders-by-domain-and-adapters)                                           | Back-end folders: `domains/<name>/` and `adapters/`                                      | 2026-11-19 |
| [D-24](#d-24-time-and-ids-without-ports)                                                        | Time and IDs without ports                                                               | 2026-11-19 |
| [D-25](#d-25-error-responses-and-transport)                                                     | Error responses and transport                                                            | 2026-11-19 |
| [D-26](#d-26-client-code-imports-only-types-from-srcserver)                                     | Client code imports only types from `src/server/`                                        | 2026-11-19 |
| [D-27](#d-27-list-page-rendering)                                                               | List page rendering                                                                      | 2026-11-19 |
| [D-28](#d-28-front-end-structure-and-delete-ux)                                                 | Front-end structure and delete UX                                                        | 2026-11-19 |
| [D-29](#d-29-create-and-edit-form)                                                              | Create and edit form                                                                     | 2026-11-19 |
| [D-30](#d-30-only-plain-data-is-shared-on-globalthis)                                           | Only plain data is shared on `globalThis`                                                | 2026-11-19 |
| [D-31](#d-31-infinite-scroll-on-the-list)                                                       | Infinite scroll on the list                                                              | 2026-11-19 |
| [D-32](#d-32-front-end-folders-page-components-next-to-the-page-shared-ones-in-srcclientshared) | Front-end folders: page components next to the page, shared ones in `src/client/shared/` | 2026-11-20 |
| [D-33](#d-33-styling-with-tailwind-css-only)                                                    | Styling with Tailwind CSS only                                                           | 2026-11-20 |
| [D-34](#d-34-title-search-and-creation-date-filter-on-the-list)                                 | Title search and creation-date filter on the list                                        | 2026-11-20 |
| [D-35](#d-35-create-and-edit-in-a-modal-over-the-list)                                          | Create and edit in a modal over the list                                                 | 2026-11-20 |
| [D-36](#d-36-task-status-to-do-doing-done)                                                      | Task status (to do, doing, done)                                                         | 2026-11-20 |

---

## D-01: Latest Next.js (16.4.6) instead of v15

- **Context:** the spec says both "create a Next.js application (v15)" and "create a Next.js project using the most recent versions". On 2026-11-19 the latest stable Next.js is 16.4.6; the latest 15.x is 15.5.29.
- **Decision:** use Next.js **16.4.6** (App Router).
- **Why:** "use the most recent versions" is the explicit setup requirement, and a new project started today on an older major would carry an upgrade debt from day one. Everything the spec asks for (SSR, App Router, tRPC integration) works the same way on 16.
- **Alternative rejected:** Next.js 15.5.29, which follows the "(v15)" mention literally but is not the most recent version.

## D-02: Newest compatible versions for the rest of the stack

- **Context:** "most recent versions" cannot apply blindly: some latest majors do not work together.
- **Decision:** every dependency is pinned exactly at the newest version compatible with Next.js 16 and with the lint toolchain:

| Piece                                                               | Version                                                                   | Note                                                                                                                                                     |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React                                                               | 19.3.1                                                                    | accepted by Next.js 16 (`^19.0.0`)                                                                                                                       |
| tRPC (`@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`) | 11.29.5                                                                   | the spec requires tRPC; the TanStack Query integration is tRPC's current recommended client for React                                                    |
| TanStack Query                                                      | 5.108.0                                                                   | —                                                                                                                                                        |
| Zod                                                                 | 4.6.7                                                                     | —                                                                                                                                                        |
| TypeScript                                                          | **6.0.3**, not 7.0.2                                                      | typescript-eslint supports TypeScript `>=4.8.4 <6.1.0`                                                                                                   |
| ESLint                                                              | ~~**9.39.5**, not 10.x~~ _Superseded by [D-16](#d-16-eslint-10): 10.15.0_ | `eslint-config-next@16` depends on `eslint-plugin-react`, `eslint-plugin-jsx-a11y` and `eslint-plugin-import`, which declare support only up to ESLint 9 |
| Vitest                                                              | 5.1.1                                                                     | with Testing Library and jsdom                                                                                                                           |
| Playwright                                                          | 1.65.1                                                                    | —                                                                                                                                                        |
| Node                                                                | 24.22.2                                                                   | `.nvmrc`                                                                                                                                                 |

- **Why:** exact pins make the install reproducible; the two held-back majors are each blocked by a declared peer range, checked on the npm registry on 2026-11-19.
- _Superseded in part by [D-19](#d-19-newest-version-at-least-7-days-old): tRPC is 11.28.0 and TanStack Query 5.107.1, the newest releases at least 7 days old (sub-plan 3)._
- **Revisit when:** typescript-eslint supports TypeScript 7, and Next's lint plugins declare ESLint 10.

## D-03: English everywhere, including the task fields

- **Context:** the spec is written in Portuguese and names the fields `titulo`, `descricao` and `dataCriacao`.
- **Decision:** code, identifiers, UI text and docs are in English. The fields are:

| Spec          | Code          | Type                            |
| ------------- | ------------- | ------------------------------- |
| `id`          | `id`          | string, generated by the server |
| `titulo`      | `title`       | string, required                |
| `descricao`   | `description` | string, optional                |
| `dataCriacao` | `createdAt`   | timestamp, set by the server    |

- **Why:** one language in the code base avoids mixed identifiers (`task.titulo` next to `task.isValid()`); the mapping above keeps the link to the spec explicit.

## D-04: Hexagonal architecture with a repository on the back end

- **Context:** the spec asks for a small CRUD and says "less is more"; it also evaluates how the back end is structured.
- **Decision:** ports and adapters with a repository pattern, kept lean. One `tasks` module with `domain/` (the `Task` entity and its errors; limits in `src/shared`, D-13), `application/` (ports and one use case per operation), `infra/` (the in-memory repository, clock and ID generator) and `trpc/` (the inbound adapter). Dependencies point inward: `domain/` and `application/` import no framework or library. Details in [`.claude/rules/backend.md`](../.claude/rules/backend.md). _Superseded in part by [D-23](#d-23-back-end-folders-by-domain-and-adapters): the folders are now `domains/task/` and `adapters/`; the architecture is the same._
- **Why:**
  - The spec makes storage in memory; the repository port isolates exactly that, so moving to a database changes one adapter and nothing else.
  - Business rules live in the entity and use cases, testable in milliseconds without tRPC or Next.
  - Time and IDs come through ports, so tests are deterministic. _Superseded by [D-24](#d-24-time-and-ids-without-ports): direct calls, with fake timers in tests._
- **Cost, and how it is contained:** about a dozen small files where three would run. No DI container (a plain composition root), no mapper layer, no DTO classes, no `Result` type, no port method that no use case calls.
- **Alternative rejected:** a tRPC router that edits an array directly. It is shorter, but rules, storage and transport end up in the same function, and every test goes through tRPC.

## D-05: In-memory repository kept on `globalThis`

- **Context:** the spec wants tasks kept in memory. In development, Next.js hot reload re-evaluates modules, which would empty a module-level list on every edit.
- **Decision:** a single `InMemoryTaskRepository` instance, created in the composition root and kept on `globalThis`. It stores snapshots in a `Map` and returns copies. _Superseded in part by [D-30](#d-30-only-plain-data-is-shared-on-globalthis): `globalThis` keeps only the `Map`; each bundle builds its own repository over it._
- **Why:** the list survives hot reload, and nothing outside the repository can mutate stored tasks by reference.
- **Limits (accepted, by the spec):** data is lost on restart, and the list is not shared between server instances.

## D-06: One Zod contract shared by server and form; invariants in the entity

- **Context:** the spec wants "no task without a title" on the back end and form validation on the front end.
- **Decision:**
  - The input and output schemas live in `src/shared/tasks/` as strict Zod schemas (unknown fields rejected). The tRPC procedures validate with them, and the form validates with the same schemas before sending. _Superseded in part by [D-26](#d-26-client-code-imports-only-types-from-srcserver): only input schemas; the output type comes from the router._
  - The `Task` entity guards its own invariants (title not blank, length limits).
  - The limits are constants defined once in the domain and reused by the schemas. _Superseded in part by [D-13](#d-13-limits-live-in-srcshared-server-only-only-on-server-wiring): the limits live in `src/shared/tasks/`._
- **Why:**
  - The front end and back end cannot disagree, because the rules exist once.
  - Strict schemas block mass assignment: a client cannot set `id` or `createdAt`.
  - The entity stays valid whoever calls it.

## D-07: Errors as domain codes, translated in one place

- **Context:** the spec asks for meaningful errors (for example, updating a task that does not exist), shown to the user.
- **Decision:**
  - Expected failures are domain errors with a literal `code` (`TASK_NOT_FOUND`, `TASK_TITLE_REQUIRED`).
  - One point on the server maps each code to a tRPC code (`NOT_FOUND`, `BAD_REQUEST`) and exposes the domain code. Unexpected errors become `INTERNAL_SERVER_ERROR` with no internals.
  - The UI maps codes to user-facing messages in one place.
- **Why:** the client never parses message text, the server never leaks stack traces, and the wording of messages can change without touching the back end.

## D-08: Lean test strategy

- **Context:** the spec values simplicity; tests must still prove the requirements.
- **Decision:**

| Level      | Tool                             | Covers                                                                                                                                              |
| ---------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| unit       | Vitest                           | the entity, each use case with the in-memory repository (fake timers where time matters, D-24), the schemas, the tRPC router through `createCaller` |
| component  | Vitest + Testing Library + jsdom | the form (validation, loading, error display) and the delete feedback                                                                               |
| end to end | Playwright                       | one or two main flows: create, list (server-rendered), edit, delete                                                                                 |

- Tests are written test-first for the back end and the form validation. Each test follows Arrange, Act, Assert, with no comments and no logic.
- Coverage of at least 90% of lines and branches in `src/server/**`, enforced by the Vitest config.
- No mutation testing.
- **Why:** most of the logic is on the server, where unit tests are fast and precise; a couple of end-to-end flows prove the pieces work together without duplicating the unit tests.

## D-09: No authentication, no database

- **Context:** the spec asks for in-memory storage and mentions no users.
- **Decision:** neither is built.
- **Why:** both are outside the spec, and "less is more". D-04 keeps the door open for a database adapter.

## D-10: Infinite scroll, with cursor pagination from the start

- **Context:** infinite scroll is a bonus, and it changes the list contract: a paginated list is not the same endpoint as "return every task".
- **Decision:** implement it. `task.list` is cursor-paginated from the first version (`{ cursor, limit }` in, `{ items, nextCursor }` out); the server renders the first page, and the scroll trigger comes last ([roadmap](plans/2026-11-19-roadmap.md), sub-plan 6).
- **Why:** designing the contract once avoids rewriting the endpoint, its tests and the list page when the bonus arrives. A cursor, unlike an offset, does not skip or repeat tasks when one is created or deleted between two pages.

## D-11: `createdAt` travels as an ISO 8601 string

- **Context:** tRPC sends JSON, where a `Date` becomes a string unless a transformer (such as superjson) is configured on the server, the client and the SSR hydration.
- **Decision:** the output DTO carries `createdAt` as an ISO 8601 string; the UI formats it with `Intl` (how, without a hydration mismatch: [D-14](#d-14-dates-rendered-in-utc-on-the-server-local-time-after-hydration)). No transformer.
- **Why:** no extra dependency and no serialization setup in three places; the type on the client is honest about what arrives.

## D-12: Newest tasks first

- **Context:** the spec does not set an order.
- **Decision:** the list is ordered by `createdAt` descending, with `id` breaking ties between tasks created in the same millisecond.
- **Why:** a task just created shows at the top, without scrolling through every page; the tie-break makes the order, and so the cursor, deterministic.

## D-13: Limits live in `src/shared`; `server-only` only on server wiring

- **Context:** the form runs in the browser and validates with the shared Zod schema (D-06), which uses the limits. With the limits in `src/server/tasks/domain/` (D-04, D-06), the client would import server code, and the earlier rule that every file under `src/server/` imports `server-only` would break the client build. It would also put an external package inside the domain, which imports nothing external.
- **Decision:**
  - The limits are plain constants with no imports, in `src/shared/tasks/task-limits.ts`. The entity and the schemas both use them.
  - `server-only` is imported only by the modules that wire or expose the server: the composition root, `infra/`, `trpc/` and the server caller.
  - `domain/` and `application/` stay free of external imports, and nothing in `src/server/` is imported by client code.
  - _Superseded in part by [D-23](#d-23-back-end-folders-by-domain-and-adapters): with the new folders, the composition root and `adapters/` import `server-only`, and `domains/` stays free of it._
- **Why:** each limit is still defined once, the client imports only `src/shared/`, and a client import of the server's wiring still fails the build.
- **Supersedes in part:** D-04 and D-06, where the limits were placed in the domain.

## D-14: Dates rendered in UTC on the server, local time after hydration

- **Context:** the list is rendered on the server and hydrated in the browser. `Intl` without a fixed time zone formats with the server's zone in the HTML and the browser's zone during hydration, which React reports as a hydration mismatch.
- **Decision:** the server renders `createdAt` in UTC inside `<time dateTime="…">`. After hydration, a small client component formats it again in the browser's time zone and locale.
- **Why:** the HTML and the first client render match, so there is no mismatch, and users still see their own local time. The cost is a quick swap from UTC to local time on the first paint.
- **Alternatives rejected:**
  - Always UTC: no swap, but users see a time that is not their own.
  - Date only: the mismatch still happens near midnight.

## D-15: The tRPC contract

- **Context:** the spec lists four operations and the task fields; the pages need a few details it leaves open.
- **Decision** (full table in the [roadmap](plans/2026-11-19-roadmap.md#interfaces-between-sub-plans)):
  - Five procedures: `task.list` (cursor page, D-10), `task.getById`, `task.create`, `task.update`, `task.delete`. `getById` is the one added to the spec's four, because the edit page must load a task opened directly by URL or after a refresh.
  - `TaskDto = { id, title, description: string | null, createdAt: string }`. _Superseded in part by [D-36](#d-36-task-status-to-do-doing-done): `TaskDto` gains `status`, `task.update` requires it, and a sixth procedure, `task.changeStatus`, changes it alone._
  - The schemas trim text. A whitespace-only title is a field error. A blank or omitted `description` becomes `null`, also on update, which replaces `title` and `description` together.
  - `task.delete` returns `{ id }`.
  - Errors carry the tRPC code, plus `data.domainCode` for domain errors and `data.fieldErrors` for validation. _Detailed in [D-25](#d-25-error-responses-and-transport), which also adds an ignored `direction` to `task.list`._
  - Routes: `/`, `/tasks/new`, `/tasks/[id]/edit`.
- **Why:** each choice is the smallest one that lets the pages work and show precise errors. Fixing the contract in the roadmap lets the back-end and front-end sub-plans be written independently.

## D-16: ESLint 10

- **Context:** D-02 held ESLint at 9 because `eslint-plugin-react`, `eslint-plugin-jsx-a11y` and `eslint-plugin-import`, which `eslint-config-next@16` depends on, declare peers only up to ESLint 9. The Next.js ESLint docs (read 2026-11-19) state that "`eslint-config-next` supports ESLint 9 and ESLint 10", with ESLint 10 compatibility added in 16.4.0.
- **Decision:** ESLint **10.15.0**, accepting pnpm's peer warnings for those three plugins.
- **Why:** the spec asks for the most recent versions, and the Next.js team supports this combination. A rule that crashed under ESLint 10 would fail `pnpm lint`, so the risk shows up at once.
- **Supersedes in part:** D-02 (the ESLint row).

## D-17: Layer rule enforced with `no-restricted-imports`

- **Context:** the hexagonal dependency rule (D-04, D-13) needs a check that does not depend on a reviewer noticing.
- **Decision:** ESLint's built-in `no-restricted-imports`, with one block per layer:
  - `domain/` imports no framework, library, `server-only` or Node module, and nothing from `application/`, `infra/` or `trpc/`;
  - `application/` imports the same externals as `domain/` forbids, and nothing from `infra/` or `trpc/`;
  - `src/shared/` imports nothing from `src/server/`.
  - _Superseded in part by [D-23](#d-23-back-end-folders-by-domain-and-adapters): the blocks now cover `src/server/domains/**` and its `entities/`._
- **Why:** a violation fails `pnpm lint`, with no new dependency. `eslint-plugin-boundaries` would be more expressive, but adds a dependency this one module does not need.

## D-18: e2e tests on a production build, Chromium only

- **Context:** the Next.js Playwright guide recommends testing production code, and the SSR checks only mean something on a production build (`next dev` renders every request).
- **Decision:**
  - Playwright starts its own server with `pnpm build && pnpm start` on port 3100 and never reuses a running one, so every run starts with an empty in-memory list.
  - Playwright runs one browser, Chromium.
- **Why:** the tests see the app as it ships. One or two flows do not need three browser engines.

## D-19: Newest version at least 7 days old

- **Context:** pnpm 12 refuses by default any package version published less than 7 days ago (`minimumReleaseAge`: 10080 minutes), a supply-chain protection against compromised fresh releases. On 2026-11-19 it blocked ESLint 10.15.0 and typescript-eslint 8.73.0. Vitest 5.1.1, Playwright 1.65.1, tRPC 11.29.5, TanStack Query 5.108.0 and jsdom 31.0.1 would hit the same limit later.
- **Decision:** keep the protection. "Most recent version" (D-01, D-02) means the newest version that is at least 7 days old when it is installed. `package.json` is the source of truth for the exact pins; the version tables here and in `CLAUDE.md` give the line and the reason.
- **Why:** bypassing a security default to gain a few days of release age is a bad trade. Every piece is still on its latest major line, ESLint 10 (D-16) included.
- **Supersedes in part:** the exact versions in D-02 and D-16, where they were newer than 7 days.

## D-20: Limits: title 120, description 1000, page 10 (max 50)

- **Context:** the spec sets no limits, but unbounded text would let one request grow server memory without limit (in-memory storage, D-05).
- **Decision:**
  - The title has 1 to 120 characters and the description up to 1000, both counted after trimming.
  - A page holds 10 tasks by default, and the client may ask for up to 50.
  - Input caps that follow from earlier decisions: an `id` has at most 36 characters (a UUID v4 string), and a cursor at most 84 (D-21: the base64 of a 24-character ISO date, `|` and a 36-character id).
  - The Zod schemas enforce these caps, the page-size range and its default at the edge. Inside, `ListTasks` trusts `limit` (`CLAUDE.md`: input is validated once, at the edge).
  - The constants live in `src/shared/tasks/task-limits.ts` (D-13).
- **Why:** 120 characters fit a one-line title and 1000 a few paragraphs. A default of 10 makes the infinite scroll visible with few tasks; a maximum of 50 caps the cost of one request.

## D-21: Position cursor

- **Context:** the paginated list (D-10) needs a cursor that neither skips nor repeats tasks, and that still works when the task it points to has been deleted between two pages.
- **Decision:**
  - The cursor is an opaque string: the base64 of `<createdAt ISO>|<id>` of the last task on the page.
  - `ListTasks` decodes it, and a malformed cursor fails with `TASK_CURSOR_INVALID`. It then asks the repository for the next `limit + 1` tasks after that position, in the order of D-12 with ties broken by `id` descending. The extra task tells whether another page exists.
- **Why:**
  - A position, unlike an id, does not need the task to still exist.
  - The decoding rule and the page logic stay in the application. The repository only sorts and filters, so a database adapter would map it to a `WHERE (created_at, id) < (…)` query.

## D-22: Storage capped at 1000 tasks

- **Context:** tasks live in server memory (D-05), and the app has no authentication or rate limiting (D-09). Anyone could create tasks in a loop until the server runs out of memory. Every list request also sorts all stored tasks, so a large store makes each page more expensive. A code review raised it on 2026-11-19.
- **Decision:**
  - The in-memory repository holds at most **1000** tasks (`InMemoryTaskRepository.DEFAULT_CAPACITY`, kept in the adapter and not in `src/shared`, because neither the entity nor the client uses it).
  - Saving a _new_ task when full fails with `TASK_STORAGE_FULL`. Saving an existing task (an edit) still works, and deleting frees a place.
  - The cap is a property of the in-memory adapter, not a business rule: it exists only because memory is the storage. A database adapter would not have it.
- **Why:**
  - It bounds memory: in the worst case, about 1.1 million characters of task text (1000 × 1120). V8 stores 1 or 2 bytes per character depending on the content, plus object overhead, so this is an estimate in characters, not a measured size in bytes.
  - It bounds the cost of the per-request sort.
  - It adds no method to the port and no business `if` to a use case.
- **Alternative rejected:** a `count()` on the repository port and the check in `CreateTask`. The rule would sit in the use case (`backend.md`), and every future adapter would have to implement `count()`.

## D-23: Back-end folders by domain and adapters

- **Context:** the folders of D-04 (`domain/`, `application/ports/`, `application/use-cases/`, `infra/`, `trpc/`) were confusing to read: "use cases are framework agnostic, so why are they not in the domain?". The user showed the layout they prefer on 2026-11-19.
- **Decision:**
  - Everything of a domain lives in `src/server/domains/<name>/`, grouped by kind of piece: `entities/` (`entity.ts`, `dto.ts`, `errors.ts`), `repositories/`, and `use-cases/` (one folder per use case).
  - An implementation that imports nothing external sits beside its contract: `in-memory-database-repository.ts` next to `database-repository.ts`. _(The `providers/` folder for the clock and the ID generator was removed by [D-24](#d-24-time-and-ids-without-ports).)_
  - Everything that knows a framework lives in `src/server/adapters/`: `trpc/` (setup, app router, server caller), `controllers/` (the procedures) and `middlewares/` when one is needed. These modules and the composition root `src/server/tasks-module.ts` import `server-only`; `domains/` does not.
  - ESLint: `domains/**` imports nothing external and nothing from `adapters/` or the composition root; `entities/` also imports no use case, repository or provider.
- **Why:**
  - One folder answers "where is everything about tasks", and each subfolder name says what is inside.
  - The architecture is unchanged: the core still imports no framework, and dependencies still point inward.
  - The contract and the in-memory implementation are read side by side.
- **Cost:** a concrete implementation now sits inside the core folder. It is contained because the implementation imports nothing external (ESLint checks it), and the single instance is still created in the composition root, which imports `server-only`.
- **Alternative rejected:** keeping `domain/` and `application/` with the in-memory repository in `infra/`. It is the textbook split, but the user found it harder to follow, and the dependency rule holds either way.

## D-24: Time and IDs without ports

- **Context:** D-04 put time and IDs behind ports (`Clock`, `IdGenerator`) with real implementations (`SystemClock`, `RandomIdGenerator`) and test fakes (`FixedClock`, `SequentialIdGenerator`): six files to wrap `new Date()` and `crypto.randomUUID()`. The user called it overengineering on 2026-11-19 ("simple whenever possible").
- **Decision:** `CreateTask` calls `new Date()` and the global `crypto.randomUUID()` directly. The ports, implementations, fakes and the `providers/` folder are removed; `createTasksModule(repository)` takes only the repository.
- **Why:**
  - Each port wrapped one line and had one real implementation; the only reason for it was tests, and the test tools already cover that: Vitest fake timers freeze `Date`, and a generated id is asserted by its shape (UUID v4) and by being different on each call.
  - Fewer elements (code-style: Kent Beck's rules, "less is more").
  - The dependency rule still holds: both are globals, not imports, and the entity stays deterministic (it receives `id` and `createdAt`).
- **Cost:** tests that check time must turn fake timers on and off; tests cannot predict an id, so they read it from the created task.
- **Alternative rejected:** keeping the ports. Textbook hexagonal, but here they add six files and no behavior.

## D-25: Error responses and transport

- **Context:** the roadmap fixed the error shape (`data.code`, `data.domainCode`, `data.fieldErrors`) and left the tRPC code of `TASK_STORAGE_FULL` open. The tRPC docs (read 2026-11-19) say a non-`TRPCError` keeps its message on the way to the client, in production too, and that `data.stack` is sent in development. The sub-plan 3 review found three more gaps: tRPC's infinite query adds `direction` to the input, unexpected errors left no trace, and batched requests had no limit.
- **Decision:**
  - One translation point: the middleware of `publicProcedure` (`src/server/adapters/trpc/init.ts`) maps each domain code to a tRPC code with a `Record<TaskErrorCode, …>` table: `TASK_NOT_FOUND` → `NOT_FOUND`; the title, description and cursor codes → `BAD_REQUEST`; `TASK_STORAGE_FULL` → `CONFLICT` (409, user decision: the request conflicts with the current state, and deleting a task resolves it).
  - The error formatter builds `data` field by field: `code`, `httpStatus`, `path`, `domainCode` (or `null`) and `fieldErrors` (`z.flattenError(…).fieldErrors` for a validation error, or `null`). It never sends `stack`, and the message of an `INTERNAL_SERVER_ERROR` becomes `'Internal server error'`.
  - The handler logs every `INTERNAL_SERVER_ERROR` with `console.error`, the one place where `no-console` is disabled, with the reason on the line (user decision).
  - Batching is off (`allowBatching: false`, user decision): one HTTP request is one call. The React client uses `httpLink` (sub-plan 4).
  - `task.list` accepts `direction: 'forward' | 'backward'` and ignores it, because `@trpc/tanstack-react-query` 11.28.0 sends `{ ...input, cursor, direction }` from an infinite query (checked in its source); every other unknown key is still rejected (user decision).
- **Why:**
  - The client tells errors apart by code (D-07) and sees no internal detail; the server log keeps what the client cannot see.
  - A `Record` over the code union makes a new domain code fail type checking until it is mapped.
  - Without batching, the field caps and the page-size cap bound each request.
- **Alternative rejected:** catching errors in each procedure. It repeats the mapping five times, and the hard rules forbid `try/catch` in procedures.

## D-26: Client code imports only types from `src/server/`

- **Context:** the tRPC client needs the `AppRouter` type, which lives in `src/server/adapters/trpc/app-router.ts`; the hard rule said nothing under `src/server/` is imported by a client component.
- **Decision:** a client file may `import type` from `src/server/` (user decision). A value import stays forbidden, and `server-only` makes it fail the build. Output types reach the client through the router's inferred types, so `src/shared/` holds only the input schemas.
- **Why:** `import type` is erased at build (`verbatimModuleSyntax`), so no server code reaches the browser; writing the contract's types again by hand would duplicate the router and could drift from it.

## D-27: List page rendering

- **Context:** `/` must show the list rendered on the server with data from the in-memory store, then let the client delete and refresh it. With `cacheComponents` (on since sub-plan 1), Next.js 16.4.6 prerenders at build time whatever it cannot see is dynamic, and an in-memory read is invisible to it (the version-matched docs in `node_modules/next/dist/docs/`, read 2026-11-19). The tRPC 11 docs for `@trpc/tanstack-react-query` describe a per-request query client, a server options proxy and hydration.
- **Decision:**
  - `page.tsx` keeps the heading and a `<Suspense>` fallback as the static shell; the list section calls `await io()` from `next/cache` first, so it renders on every request (the docs prefer `io()` to `connection()` with Cache Components). `pnpm build` lists `/` as `◐ (Partial Prerender)`.
  - The section fetches the first page of the infinite list query through `createTRPCOptionsProxy` over the shared `tasksModule` (`src/server/adapters/trpc/server.ts`, one query client per request with React `cache`), awaits it, and hands the cache to the client with `HydrationBoundary`. The query options come from `src/shared/tasks/task-list-query.ts`, shared by the page and `TaskList`, so both build the same cache key.
  - `makeQueryClient` (`src/shared/trpc/query-client.ts`) sets only `staleTime: 30_000`, so hydrated data counts as fresh and the browser does not request it again. The streaming dehydrate options of the docs are left out: the fetch is awaited.
  - The fetch uses `queryClient.infiniteQuery(…).catch(noop)`: TanStack Query 5.107 deprecates `prefetchInfiniteQuery` in its favor. A failed fetch is not dehydrated (only successful queries are), so the client loads the list itself and shows the error.
  - The browser client uses `httpLink` to the relative `/api/trpc` (batching is off, D-25).
  - Dates follow D-14: the server and the hydration render show `YYYY-MM-DD HH:mm UTC`, cut from the ISO string without locale data, so Node and the browser produce the same text; after hydration, `Intl.DateTimeFormat` in the browser's locale and zone. The switch uses `useSyncExternalStore`, so no effect sets state and hydration matches.
- **Why:** the spec asks for SSR of the list; the task is in the server HTML, no `task.list` request fires on first load and no hydration error is logged (e2e, production build).
- **Alternative rejected:** fetching in the client only (no SSR), or rendering the list from a server caller without the query cache (the client would then refetch, and delete could not invalidate one query).

## D-28: Front-end structure and delete UX

- **Context:** sub-plan 4 adds the first client code: where it lives, how it is tested and how delete gives feedback (the spec asks for feedback and loading, success and failure states).
- **Decision:**
  - Client code lives in `src/client/` (user decision), mirroring `src/server/`. _Superseded in part by [D-32](#d-32-front-end-folders-page-components-next-to-the-page-shared-ones-in-srcclientshared): page components live next to their page, shared ones in `src/client/shared/`._ ESLint keeps it to `import type` from `@/server/*` and never `server-only` (D-26). The query client factory is in `src/shared/trpc/`, used by both sides.
  - Components are tested in jsdom inside the real providers, with tRPC's `localLink` to `appRouter` over a fresh `InMemoryTaskRepository`, so the error formatter applies as over HTTP; the network is simulated with links in `src/test/trpc-links.ts`. TanStack Query notifies React as a microtask in these tests (`setup-dom.ts`), so updates land inside `act`.
  - The list shows the full-page error only when the first load fails (`isLoadingError`): a failed refresh keeps the tasks on screen. A failed first load, on the list or the edit page, offers `Retry` when the failure may pass (no tRPC code, as with the network down, or `INTERNAL_SERVER_ERROR`; `isTemporaryError` in `src/client/shared/error-message/`); a missing task or an invalid id shows only its message (project review, 2026-11-19).
  - Delete: no confirmation (user decision: the spec asks only for feedback). Each button is named after its task (`Delete <title>`). Every delete button stays disabled until the list has refetched (`onSettled` returns the invalidation promise), so the deleted row cannot be clicked again. _Superseded in part by [D-29](#d-29-create-and-edit-form): the toast state lives in a `ToastProvider` in the root layout._ A toast shows `Task deleted.` (`role="status"`) or the error text mapped from its code (`role="alert"`) and hides after 4 seconds (user decision: a toast that disappears); it is keyed per result, so a new delete restarts the timer. Both live regions stay on the page, empty until a result, because screen readers announce a change inside an existing region but often miss a region inserted with its text.
- **Why:** each piece is the smallest that meets the spec's feedback states; testing against the real router avoids mocks of our own code.
- **Alternative rejected:** a confirmation dialog (not asked by the spec), a toast library (one small component is enough).

## D-29: Create and edit form

- **Context:** the spec asks for a create/update page with a form built from functional components and hooks, validation (no empty title), messages for front-end and back-end errors, and loading, success and failure states. With `cacheComponents`, Next.js 16 hides a page it leaves with React `<Activity>` and keeps its state (`node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`).
- **Decision:**
  - `/tasks/new` and `/tasks/[id]/edit` share one `TaskForm` (`src/client/shared/task-form/`, D-32) with `useState`. It validates title and description on submit with the shared schema (`createTaskInputSchema`: the field rules are the same for create and update; the server checks the update input with its own strict schema), shows the schema's message under each invalid field and moves the focus to the first one. _Superseded in part by [D-36](#d-36-task-status-to-do-doing-done): the form also edits the status and validates with `updateTaskInputSchema.omit({ id: true })`._
  - Save is disabled from the click until the navigation (`Saving…` while pending). A failed save shows the code-mapped text (D-07) in the toast. _Superseded in part by [D-35](#d-35-create-and-edit-in-a-modal-over-the-list): a failed save shows in the form, and inside the modal the form closes by going back, with the toast after the dialog closes._ On success the form awaits the cache refresh (the list with `refetchType: 'all'` in the filter, since it is off screen; on update also `task.getById` for that id), shows `Task created.` or `Task saved.` and returns to `/` (user decision). The toast lives in a `ToastProvider` in the root layout, which stays mounted across navigations.
  - `TaskForm` is keyed by `useRouter().bfcacheId`, so each visit through a link starts a fresh form while the browser's back button restores a draft (`use-router.md`).
  - The edit page reads `params` inside `<Suspense>` and loads the task in the browser only (user decision), with `retry: false`, so a missing task shows `This task no longer exists.` at once on the page (user decision); an id over 36 characters shows `Some fields are invalid.`.
  - Component tests mock `next/navigation`, because `useRouter` throws outside a mounted App Router; it is the only module mocked.
- **Why:** one form and one feedback channel cover both modes with the fewest pieces; each behavior above is proved by a component or e2e test (sub-plan 5).
- **Alternative rejected:** a form library (two fields), staying on the form after a save (the user chose the list), a server prefetch for the edit page (the spec asks for SSR only on the list).

## D-30: Only plain data is shared on `globalThis`

- **Context:** in the production build, `TASK_NOT_FOUND` reached the client as `INTERNAL_SERVER_ERROR` (found by the sub-plan 5 e2e). Next.js bundles pages and the API route separately, each with its own copy of the domain classes. The repository on `globalThis` (D-05) was built by the first bundle that loaded `tasks-module.ts` (the list page, which Playwright requests to know the server is up), so its `TaskNotFoundError` failed `instanceof DomainError` in the API route's copy.
- **Decision:** `globalThis` keeps only the `Map` of task snapshots (plain data). Each bundle builds its own `InMemoryTaskRepository` over it (`new InMemoryTaskRepository({ snapshots })`), so every error and entity a bundle sees comes from its own classes. The constructor takes `{ capacity?, snapshots? }`.
- **Why:** it removes the cause (class instances crossing bundles) instead of working around one `instanceof`; `instanceof` stays valid everywhere. The e2e `returns NOT_FOUND for a missing task after a page has rendered` proves it, and fails with the shared instance.
- **Alternative rejected:** recognizing domain errors by their `code` in the middleware: smaller, but entities and errors from another bundle would still cross over.

## D-31: Infinite scroll on the list

- **Context:** infinite scroll is a bonus of the spec; the list contract is cursor-paginated since D-10, and the client reads it as an infinite query since sub-plan 4. TanStack Query 5.107's `fetchNextPage` cancels a running fetch by default (`cancelRefetch: true`), and a list refetch (after a delete or a save, or on window focus) is not a "next page" fetch (`query-core` source, read 2026-11-19).
- **Decision:**
  - A sentinel after the list, watched by an `IntersectionObserver` with `rootMargin: '200px'`, calls `fetchNextPage()`. Only the scroll triggers it; there is no `Load more` button (user decision).
  - The observer runs only while a next page exists, no fetch is running (so a refetch is never cancelled and a deleted task never comes back) and no page has failed.
  - A failed page shows the code-mapped error and a `Retry` button; scrolling does not retry it, and while `Retry` reloads the page, the error and the button give way to `Loading more tasks…`. After the last page, `No more tasks.` shows when more than one page is loaded (user decision).
  - A screen taller than the first page loads the second right away (the observer reports on start), so D-27's "no `task.list` request on first load" holds when the first page fills the screen.
  - Tests: component tests fake `IntersectionObserver` (absent from jsdom) and fire it on demand (`src/test/intersection-observer.ts`); e2e tests run on one worker, and the list tests use a 400 px tall viewport, so the first page fills it.
- **Why:** the smallest trigger that loads as the user scrolls, with every state the spec asks for; the guards come from measured library behavior, each proved by a test that fails without it.
- **Alternative rejected:** a `Load more` button (the spec asks for scrolling), a library for the observer (one effect is enough), parallel e2e workers (tests on one in-memory server would push each other's tasks off the first page).

## D-32: Front-end folders: page components next to the page, shared ones in `src/client/shared/`

- **Context:** all client components lived in one `src/client/tasks/` folder, whatever page used them (D-28). The user asked for a layout that shows who uses each one.
- **Decision (user decision):**
  - A component used by one page lives in that route's `_components/<name>/` folder: `src/app/_components/task-list/`, `src/app/_components/task-date/`, `src/app/tasks/[id]/edit/_components/edit-task/` _(moved to `src/client/shared/edit-task/` by [D-35](#d-35-create-and-edit-in-a-modal-over-the-list), when the modal route started using it too)_. `_components` is a Next.js private folder: an underscore keeps it out of routing (`node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`).
  - A component or client module used by more than one page lives in `src/client/shared/<name>/`: `task-form/` (the new and edit pages), `toast/` (the layout, the list, the form), `error-message/` (the list, the form, the edit page). `src/client/trpc/provider.tsx` stays.
  - Each folder holds `index.tsx` or `index.ts`, its tests and its `dto.ts` when it has one, like the use-case folders on the server.
  - The D-26 ESLint block covers `src/client/**` and `src/app/**/_components/**`, so a page component cannot import a server value either.
- **Why:** where a file lives says who uses it; moving a component to `shared/` is the signal that a second page needs it.
- **Alternative rejected:** one folder per feature (`src/client/tasks/`), the previous layout: it hid which page owns each component.

## D-33: Styling with Tailwind CSS only

- **Context:** the app had no styles. The spec asks for a simple layout ("não é necessário um design elaborado").
- **Decision (user decision):**
  - Tailwind CSS 4.3.5 (`tailwindcss`, `@tailwindcss/postcss`, pinned dev dependencies, the newest release at least 7 days old, D-19), wired as the Next.js docs show (`postcss.config.mjs`, `src/app/globals.css` imported by the root layout).
  - No component library: shadcn was considered and declined; it would add runtime dependencies and its own `components/ui` folder for markup this small.
  - Utility classes in the markup; the few patterns repeated on several pages are component classes in `globals.css` built with `@apply` (`button`, `button-primary`, `button-secondary`, `button-danger`, `card`, `field`, `page-title`, `text-muted`, `text-error`); a `select.field` draws its own arrow, as far in from the right edge as the text is from the left, because the native one hugs the edge (user report, 2026-11-20), so a change to a button or a field happens once.
  - A neutral look: a centered column, the list's heading, `New task` and the filters (D-34) pinned to the top as one block while the page scrolls (user decision: a sticky header, not a scrolling list area, so the page keeps native scrolling and the infinite scroll keeps the viewport as its root; the block is rendered by `FilteredTaskList`, with the heading passed in by the page, which also shows it in the loading fallback), tasks as cards with their status as a colored pill (D-36), a visible focus style on every control, a red border on an invalid field, the toast with a green or red edge in the top-right corner (user decision, 2026-11-20: at the bottom it went unnoticed), with `pointer-events-none` so it never blocks a click on the `New task` link it may cover for its 4 seconds; dark mode follows the system (`prefers-color-scheme`).
- **Why:** the smallest setup that gives every page a consistent look, with no change to text, roles or structure, so every test stays as it was.
- **Alternative rejected:** shadcn (above), CSS Modules (more files for the same result), React components for buttons and fields (the class names are enough for plain elements).

## D-34: Title search and creation-date filter on the list

- **Context:** the user asked for a search by title and a filter by creation date on 2026-11-20. The spec does not ask for filters, and `code-style.md` listed "no filters" under YAGNI; the user's request overrides it. The list is cursor-paginated (D-10, D-21) and loaded by infinite scroll (D-31).
- **Decision (user decisions: a From/To range, applied as you type, kept in the URL):**
  - `task.list` takes three optional fields, in `taskListFilterSchema` (`src/shared/tasks/task-schemas.ts`), which `listTasksInputSchema` extends (still strict):
    - `titleContains`: trimmed, 1 to 120 characters (`TASK_TITLE_MAX_LENGTH`: a longer search matches no title);
    - `createdFrom` (inclusive) and `createdBefore` (exclusive): ISO 8601 UTC strings with milliseconds, the form `toISOString()` produces (`z.iso.datetime({ precision: 3 })`: always 24 characters; it rejects offsets, date-only values and longer fractions; D-11).
  - An invalid field is a `BAD_REQUEST` with its field issue, through the existing formatter (D-25).
  - The repository applies the filter while it pages: `listAfter(position, count, filter)` filters before it slices, like a `WHERE` clause, so every page holds only matching tasks and the cursor of D-21 is unchanged. `ListTasks` passes the filter through.
  - The search is a substring match that ignores case and accents (user decision: "acao" finds "Ação"). Both sides are normalized to NFD, their diacritic marks dropped and lower-cased; the match uses `includes`, never a `RegExp` built from input.
  - A task created or edited while a filter is active may not match it, and then it leaves the list after the save (user decision: accepted).
  - **In the browser** (user decisions: applied as you type, kept in the URL, a `Clear filters` button always visible):
    - The URL keys are the input keys (`?titleContains=…&createdFrom=…&createdBefore=…`). The page reads `searchParams` once with `readTaskListFilter` (`src/shared/tasks/task-list-query.ts`), which keeps each valid single-string key and drops the rest, so a hand-edited URL still renders. It prefetches that filtered first page and passes the filter to `FilteredTaskList` as a prop.
    - The browser never reads the filter back from the URL. Under the modal routes, `useSearchParams` returns the modal's URL (Next.js builds it from the global URL), and a repeated key would read differently on each side. `FilteredTaskList` keeps the filter in state and writes the URL with `window.history.replaceState` (Next.js integrates it with its router), only while the path is `/`. Replace, not push, so filters add no history entries.
    - `TaskFilters`:
      - The search has a row of its own. On a phone, From and To share the next row, then Status and Clear; on a wider screen, From, To, Status and Clear share one row. Every control is 40 px tall (code review, 2026-11-20: with five columns, the search was about 120 px wide and the dates were cut on a phone).
      - The search applies 300 ms after the last keystroke.
      - A day is applied when it is picked. From is the start of that day in the browser's zone; To is the start of the next day (`createdBefore`, exclusive), moved by calendar days, so a 23- or 25-hour day still counts as one.
      - The date inputs show their days only after hydration, because the server does not know the browser's zone (the D-14 pattern).
      - `Clear filters` empties the three fields at once and is disabled when there is nothing to clear.
    - `TaskList` takes the filter as its query input with `placeholderData: keepPreviousData`, so the previous results stay, dimmed and `aria-busy`, while new ones load. With no match it shows `No tasks match the filters.`.
- **Why:**
  - Filtering on the server is the only correct option with pagination: filtering the pages already loaded in the browser would miss matches on pages not loaded yet.
  - The cost is one extra pass over at most 1000 tasks (D-22).
  - An exclusive upper bound lets the client express "up to the end of a day" as the start of the next one, with no millisecond edge.
- **Alternative rejected:**
  - Client-side filtering of loaded pages: wrong with infinite scroll.
  - A separate search procedure: a second contract for the same list.
  - `router.replace` for each change: a server round trip per keystroke.
  - Reading the URL with `useSearchParams`: wrong under the modal routes.

## D-35: Create and edit in a modal over the list

- **Context:** the user asked that `New task` and `Edit` open the form in a modal instead of another page (2026-11-20). The spec asks for a create/update **page**. Next.js 16.4.6 documents modals as parallel + intercepting routes (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/parallel-routes.md` § Modals, `intercepting-routes.md`).
- **Decision (user decision: a modal with a URL):**
  - **Routes:**
    - The root layout renders a `@modal` slot after `children`.
    - `src/app/@modal/(.)tasks/new/page.tsx` and `src/app/@modal/(.)tasks/[id]/edit/page.tsx` render the same `TaskForm` and `EditTask` inside `Modal`.
    - `@modal/default.tsx` renders nothing.
    - A click on `New task` or `Edit` opens the modal over the list, and the URL becomes `/tasks/new` or `/tasks/<id>/edit`. A direct load or a refresh of those URLs renders the full pages, which stay.
    - `EditTask` moved to `src/client/shared/edit-task/`, since two routes use it (D-32).
  - **`Modal`** (`src/client/shared/modal/`): a native `<dialog>` opened with `showModal()`, which gives the top layer, the inert page behind it, focus containment and Escape.
    - Closing is going back in history (`router.back()`), so the list's URL and its filters (D-34) come back. The ways to close are the `Close` button, Escape, a click on the backdrop and the browser's Back.
    - Escape is caught in `cancel`, prevented, and then the modal goes back. There is no `close` handler, so the dialog closing on unmount, or when hidden, never navigates a second time.
    - The dialog has no padding of its own, so a click on its padded content never counts as a backdrop click.
    - It goes back once per opening. A double click on `Close`, or `Close` then Escape, would otherwise go back twice and leave the list (found in code review, 2026-11-20). The guard resets when the dialog opens again; Cache Components can show the same instance again (`<Activity>`).
    - A save can finish after the user has closed the modal: a `useMutation` option callback still runs after unmount (`query-core` `mutation.js`). Then `closeModal` shows the toast at once and does not go back again.
    - It opens with the focus on the form's first field. `showModal()` would focus `Close`, and React's `autoFocus` only calls `focus()` while the dialog is still closed, without writing the attribute (`react-dom-client`). The Title keeps `autoFocus` for the edit form, which appears after the task loads, and for the full pages.
    - The page behind an open modal does not scroll (`:root:has(dialog:modal) { overflow: hidden }`), and `scrollbar-gutter: stable` keeps the layout from shifting when the scrollbar goes away.
  - **Feedback** (updates D-29):
    - The page behind a modal dialog is inert and under the top layer, so a toast there is hidden and not announced.
    - A failed save shows its code-mapped text in the form (`role="alert"`, in both modes), next to `Save`, and it clears on the next save. The region stays on the page while empty, never `display: none`, so a screen reader announces it (the D-28 rule).
    - Inside a modal, the form closes through `useCloseModal()`, and the success toast is shown in the dialog's cleanup, once it has closed. On the full page, it still shows the toast and goes to `/`.
  - **Styles:** a `card` component class (border, background, shadow) is shared by the list items, the full form pages and the dialog, so the form is not a card inside a card.
  - **Tests:** jsdom 31 has no `showModal`/`close`. `src/test/dialog.ts` fakes them by toggling `open`, and e2e covers the real dialog: opening over the list, Escape, editing with a search kept, and the full page on a direct load. A click on `New task` before React has hydrated the list is a plain page load and opens the full page (measured: 1 in 3 clicks sent at page commit). For a user that is the working fallback; for e2e it was a race, so tests that interact right after loading the list wait for hydration with `gotoHydrated` (`e2e/hydration.ts`).
- **Why:**
  - It keeps the spec's pages and adds the modal the user asked for.
  - The URL can be shared and survives a refresh.
  - Back closes the modal.
- **Alternative rejected:** a `<dialog>` held in the list's state with no route. It is smaller, but it has no link and no refresh, and the spec's page would be gone.

## D-36: Task status (to do, doing, done)

- **Context:** the user asked, beyond the spec, to know whether a task is to do, in progress or done (2026-11-20). The spec's task model lists "at least" four fields, so a fifth is allowed.
- **Decision (user decisions: changed on the card and in the form, a badge on the existing list, a status filter):**
  - **Values:**
    - A task has a `status`: `'todo' | 'doing' | 'done'`.
    - The values and the default (`todo`) are defined once in `src/shared/tasks/task-statuses.ts`, used by the entity, the Zod schemas and the UI (the D-13 pattern).
    - Any status can move to any other.
  - **Entity:**
    - `Task.create` takes an optional status (`todo` when absent). `task.changeStatus(status)` changes it.
    - Both reject a value outside the set with `TASK_STATUS_INVALID`, translated to `BAD_REQUEST`, even though `z.enum` rejects it first at the edge (D-06: the entity guards its invariants whatever the caller).
    - `edit()` still takes only title and description.
  - **Contract:**
    - `TaskDto` gains `status`.
    - `task.create` takes `status?`.
    - `task.update` requires `status`: the form always sends it, so an update replaces the whole content. An optional `status` would mean "keep it", while an omitted `description` means "clear it".
    - `task.list` takes `status?` as a filter, applied by the repository like the others (D-34).
  - **`task.changeStatus({ id, status })`:** a procedure and use case (`ChangeTaskStatus`) for the card. A status change must not send, or overwrite, a title or description. The form saves the whole task, so an open form overwrites a status changed meanwhile on a card (last write wins, as for the title).
  - **Old dev data:** tasks stored before this change, in a dev server already running, have no status; restart `pnpm dev` once (production always starts empty, D-05).
  - **In the browser** (labels, texts and colors proposed in the plan and accepted by the user):
    - The labels are `To do`, `Doing` and `Done`, defined once in `src/client/shared/task-status/`. A select's string becomes a status through the shared schema (`toTaskStatus`), never with a cast.
    - **Card:** the badge is the control, a pill (zinc, amber or emerald by status) over a native `<select>` named `Status of <title>`. The pill shows a label trimmed to the cap height (`text-box: trim-both cap alphabetic`) and its own arrow, and the select lies invisible on top and takes clicks, keys and the screen reader. A select draws its own text, which sat low in Segoe UI (Windows), and `text-box` has no effect inside a select (measured in Chromium 158), so this is the only way to center the label in any font (user report, 2026-11-20).
      - Choosing a value saves at once with `task.changeStatus`, and the toast shows `Status updated.` or the code-mapped error.
      - While the change is saved, the pill shows the chosen value (the mutation's variables). Every status pill ignores changes until the list has refetched, as delete does (D-28). They are marked `aria-disabled`, not `disabled` (code review, 2026-11-20): the arrow keys change a closed select at once in Chrome on Windows and Linux, and a focused control that becomes `disabled` drops the focus, so a keyboard user landed back at the top of the page after each change (measured in Chromium). The e2e `keeps the focus on the status after a keyboard change` covers it.
      - On success the saved task is written to its `task.getById` cache entry. An inactive query is not refetched by an invalidation, so the edit form would open with the old status and saving would bring it back (found by a test while implementing).
    - **Form:** a `Status` select, `To do` for a new task (`TASK_STATUS_DEFAULT`). The form validates with `updateTaskInputSchema.omit({ id: true })`, so its data fits both `create` and `update`, and the rules still come from one schema.
    - **Filter bar:** a `Status` select (`All` and the three labels), applied on change, kept in the URL (`status`) and reset by `Clear filters`.
- **Why:**
  - Three states are what the user named.
  - One shared set of values keeps the entity, the schema and the UI in step.
  - A dedicated procedure keeps a one-click change from carrying the rest of the task.
- **Alternatives rejected:**
  - A boolean `done`: two states, and the user asked for three.
  - A kanban board: the user chose the list.
  - A status change through `task.update` from the card: it would overwrite a concurrent edit of the title.

---

## Open decisions

None open. New ones are added here when a plan raises them.
