# Decisions

The main decisions behind this project, each with its context, the choice and why. The test statement is in [`SPEC.md`](SPEC.md). New decisions are added in the same change that makes them; a decision that changes is not edited away: the entry gets a "Superseded by D-NN" note and a new entry explains the change.

| #                                                                                 | Decision                                                             | Date       |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------- |
| [D-01](#d-01-latest-nextjs-1646-instead-of-v15)                                   | Latest Next.js (16.4.6) instead of v15                               | 2026-11-19 |
| [D-02](#d-02-newest-compatible-versions-for-the-rest-of-the-stack)                | Newest compatible versions for the rest of the stack                 | 2026-11-19 |
| [D-03](#d-03-english-everywhere-including-the-task-fields)                        | English everywhere, including the task fields                        | 2026-11-19 |
| [D-04](#d-04-hexagonal-architecture-with-a-repository-on-the-back-end)            | Hexagonal architecture with a repository on the back end             | 2026-11-19 |
| [D-05](#d-05-in-memory-repository-kept-on-globalthis)                             | In-memory repository kept on `globalThis`                            | 2026-11-19 |
| [D-06](#d-06-one-zod-contract-shared-by-server-and-form-invariants-in-the-entity) | One Zod contract shared by server and form; invariants in the entity | 2026-11-19 |
| [D-07](#d-07-errors-as-domain-codes-translated-in-one-place)                      | Errors as domain codes, translated in one place                      | 2026-11-19 |
| [D-08](#d-08-lean-test-strategy)                                                  | Lean test strategy                                                   | 2026-11-19 |
| [D-09](#d-09-no-authentication-no-database)                                       | No authentication, no database                                       | 2026-11-19 |
| [D-10](#d-10-infinite-scroll-with-cursor-pagination-from-the-start)               | Infinite scroll, with cursor pagination from the start               | 2026-11-19 |
| [D-11](#d-11-createdat-travels-as-an-iso-8601-string)                             | `createdAt` travels as an ISO 8601 string                            | 2026-11-19 |
| [D-12](#d-12-newest-tasks-first)                                                  | Newest tasks first                                                   | 2026-11-19 |
| [D-13](#d-13-limits-live-in-srcshared-server-only-only-on-server-wiring)          | Limits live in `src/shared`; `server-only` only on server wiring     | 2026-11-19 |
| [D-14](#d-14-dates-rendered-in-utc-on-the-server-local-time-after-hydration)      | Dates rendered in UTC on the server, local time after hydration      | 2026-11-19 |
| [D-15](#d-15-the-trpc-contract)                                                   | The tRPC contract                                                    | 2026-11-19 |
| [D-16](#d-16-eslint-10)                                                           | ESLint 10                                                            | 2026-11-19 |
| [D-17](#d-17-layer-rule-enforced-with-no-restricted-imports)                      | Layer rule enforced with `no-restricted-imports`                     | 2026-11-19 |
| [D-18](#d-18-e2e-tests-on-a-production-build-chromium-only)                       | e2e tests on a production build, Chromium only                       | 2026-11-19 |
| [D-19](#d-19-newest-version-at-least-7-days-old)                                  | Newest version at least 7 days old                                   | 2026-11-19 |
| [D-20](#d-20-limits-title-120-description-1000-page-10-to-50)                     | Limits: title 120, description 1000, page 10 (max 50)                | 2026-11-19 |
| [D-21](#d-21-position-cursor)                                                     | Position cursor                                                      | 2026-11-19 |
| [D-22](#d-22-storage-capped-at-1000-tasks)                                        | Storage capped at 1000 tasks                                         | 2026-11-19 |
| [D-23](#d-23-back-end-folders-by-domain-and-adapters)                             | Back-end folders: `domains/<name>/` and `adapters/`                  | 2026-11-19 |
| [D-24](#d-24-time-and-ids-without-ports)                                          | Time and IDs without ports                                           | 2026-11-19 |
| [D-25](#d-25-error-responses-and-transport)                                       | Error responses and transport                                        | 2026-11-19 |
| [D-26](#d-26-client-code-imports-only-types-from-srcserver)                       | Client code imports only types from `src/server/`                    | 2026-11-19 |

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
- **Decision:** a single `InMemoryTaskRepository` instance, created in the composition root and kept on `globalThis`. It stores snapshots in a `Map` and returns copies.
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
  - `TaskDto = { id, title, description: string | null, createdAt: string }`.
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

---

## Open decisions

None open. New ones are added here when a plan raises them.
