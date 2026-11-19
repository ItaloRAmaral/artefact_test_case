# Plan: back-end core (sub-plan 2)

| Field   | Value                                                                                                                                                                                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status  | Done                                                                                                                                                                                                                                                                                       |
| Date    | 2026-11-19                                                                                                                                                                                                                                                                                 |
| Request | "segue para o sub-plano 2": sub-plan 2 of the roadmap, the back-end core (domain, application, infra)                                                                                                                                                                                      |
| Context | [Roadmap](2026-11-19-roadmap.md) sub-plan 2, "Interfaces between sub-plans" and "Security"; [`docs/DECISIONS.md`](../DECISIONS.md) D-04, D-05, D-07, D-10, D-12, D-13, D-15, D-17, D-19; `.claude/rules/backend.md`; `.claude/rules/tests.md`; `docs/SPEC.md` §2 (model, CRUD, validation) |
| Roadmap | [2026-11-19-roadmap.md](2026-11-19-roadmap.md), sub-plan 2                                                                                                                                                                                                                                 |

**Goal:** the task domain, the five use cases and the in-memory repository, fully unit-tested with the 90% gate on `src/server/**` now enforced, with no tRPC, Zod or Next.js involved.

**Architecture:** everything in `.claude/rules/backend.md`'s layout. `src/shared/tasks/task-limits.ts` holds the limits. Since Task 3's review (D-23), everything of the domain lives in `src/server/domains/task/`: `entities/` (`Task`, its shapes and errors), `repositories/` (the contract and the in-memory implementation beside it), (until D-24) `providers/` for the clock and ID generator, and `use-cases/` (one folder per use case; the cursor codec sits in `list-tasks/`, its only user). `src/server/tasks-module.ts` wires them. (Before D-23 the folders were `domain/`, `application/` and `infra/` under `src/server/tasks/`; the notes of Tasks 1 to 3 use those paths.) Test fakes and factories go in `src/test/`.

## Global constraints

- Limits (D-20): title 1 to 120 characters after trimming, description up to 1000 after trimming, page size default 10, maximum 50. Input caps derived from earlier decisions, not picked: `id` up to 36 characters (a UUID v4 string) and `cursor` up to 84 characters (base64 of a 24-character ISO date, `|`, and a 36-character id: 61 bytes → 84 characters). They are enforced by the schemas in sub-plan 3.
- Order (D-12): `createdAt` descending, then `id` descending to break ties (descending like `createdAt`, so the order reads one way).
- The page-size range (1 to `TASK_PAGE_SIZE_MAX`) and its default are enforced by the Zod schema in sub-plan 3, at the edge (`CLAUDE.md`: inside, code trusts the types). `ListTasks` trusts `limit`, so the roadmap's "limit cap" test belongs to sub-plan 3's router tests.
- Cursor (D-21): opaque string, base64 of `<createdAt ISO>|<id>` of the last task of the page. The application decodes it; the repository receives a position, never the raw cursor.
- Error codes (roadmap interface, D-07): `TASK_NOT_FOUND`, `TASK_TITLE_REQUIRED`, `TASK_TITLE_TOO_LONG`, `TASK_DESCRIPTION_TOO_LONG`, `TASK_CURSOR_INVALID`, `TASK_STORAGE_FULL` (D-22). Each is a `DomainError` subclass with a literal `code`.
- IDs are UUID v4 from the global Web Crypto `crypto.randomUUID()`, only in `RandomIdGenerator` (no import, so it can sit beside its contract, D-23). Time comes from `Clock`.
- `src/server/domains/` imports nothing external (D-17 lint, D-23). `tasks-module.ts` imports `server-only` (D-13, D-23).
- Ports return `Promise`: the contract fits any storage. The in-memory adapter's methods are not `async` and return `Promise.resolve(...)`, because `strictTypeChecked` includes `@typescript-eslint/require-await`.
- New dependency: `server-only` 0.0.1 (released 2022, meets D-19).

## Decisions with the user

| Question                                 | Answer                                                                                                                                                   | Date       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Maximum length of title and description? | Title 120, description 1000 (D-20)                                                                                                                       | 2026-11-19 |
| Page size default and maximum?           | Default 10, maximum 50 (D-20)                                                                                                                            | 2026-11-19 |
| Cursor encoding?                         | Position: base64 of `createdAt\|id`, decoded by `ListTasks`; the repository filters "after this position", so a deleted task's cursor still works (D-21) | 2026-11-19 |

## Review focus

- **Whitespace-only or padded title:** trimmed before checks; `"   "` → `TASK_TITLE_REQUIRED`; `"  a  "` is stored as `"a"`.
- **Blank or omitted description** → `null`, on create and on edit (D-15).
- **Exactly at the limit:** 120-character title and 1000-character description accepted; 121 and 1001 rejected.
- **`createdAt` and `id` never come from input:** `CreateTask` takes neither.
- **Edit keeps `id` and `createdAt`.**
- **Missing task** on get, update and delete → `TASK_NOT_FOUND`; on failure nothing is saved or deleted.
- **Failed edit of an existing task** (blank title) → `TASK_TITLE_REQUIRED`, and the stored task is unchanged (`edit` throws before `save`).
- **Stored state cannot leak:** mutating a returned `Task` (through `edit`) without `save` does not change the stored one.
- **Pagination:**
  - empty list → `{ items: [], nextCursor: null }`;
  - exactly `limit` tasks → one page with `nextCursor: null` (no empty extra page);
  - `limit + 1` tasks → `nextCursor` set, and the second page holds the last task;
  - `2 × limit + 1` tasks → the page fetched with the first cursor holds tasks `limit + 1` to `2 × limit` and returns a non-null `nextCursor` (middle page);
  - two tasks with the same `createdAt` → ordered by `id` descending, none skipped or repeated across pages;
  - the task the cursor points to was deleted → the next page still starts right after its position.
- **Undecodable cursor** (not base64, wrong number of parts, invalid date, empty id) → `TASK_CURSOR_INVALID`.
- **Accepted limitation, an edit racing a delete:** `UpdateTask` loads, awaits, edits and saves. If a delete of the same task lands between those awaits, `save` (an upsert) recreates the deleted task. In a single process with in-memory storage, the window is a few microtasks. Closing it needs an update-only save in the port, which adds contract for a case this app cannot meaningfully hit. Not fixed; recorded here (second review, 2026-11-19).

## Security

| Threat                                                            | How this plan handles it                                                                                                                                                                                                                                   | Task and test                                                                                                                                                   |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mass assignment                                                   | `CreateTask` input has no `id` or `createdAt`; both come from ports                                                                                                                                                                                        | Task 3, `sets id and createdAt from the ports`                                                                                                                  |
| Unbounded input                                                   | title and description limits enforced by the entity                                                                                                                                                                                                        | Task 1, limit tests                                                                                                                                             |
| Unbounded storage (memory exhaustion by creating tasks in a loop) | the in-memory repository holds at most 1000 tasks; a new task beyond that fails with `TASK_STORAGE_FULL`, edits still save (D-22)                                                                                                                          | Task 2, `rejects a new task when the storage is full`, `still saves an existing task when the storage is full`, `accepts a new task again after one is deleted` |
| Stored state mutated by reference                                 | the repository stores snapshots and returns new entities                                                                                                                                                                                                   | Task 2, `returns copies, not stored state`                                                                                                                      |
| Forged cursor                                                     | strict decoding, `TASK_CURSOR_INVALID` on anything malformed; length cap at the edge in sub-plan 3                                                                                                                                                         | Task 4                                                                                                                                                          |
| Server code in client bundles                                     | `server-only` as the first import of `tasks-module.ts`, the only way the server's single instances are built; `domains/` imports nothing external (D-23); the build-level proof (a client import failing) arrives with the first client code in sub-plan 3 | Task 5, step 2 (grep check)                                                                                                                                     |
| Internal details in errors                                        | domain errors carry only `code`; translation is sub-plan 3                                                                                                                                                                                                 | Task 1                                                                                                                                                          |

## Test plan

| Requirement or review-focus line                    | Level | Test name                                                                                                                                                                                      | Task |
| --------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Task needs a title (spec §2)                        | unit  | `rejects a blank title` (table: `''`, `'   '`)                                                                                                                                                 | 1    |
| Title and description limits                        | unit  | `accepts a title of 120 characters`, `rejects a title longer than 120 characters`, the same for description at 1000                                                                            | 1    |
| Trimming and `null` description                     | unit  | `trims the title`, `trims the description`, `accepts a 120-character title surrounded by spaces`, `stores a missing or blank description as null` (table: `undefined`, `''`, `'   '`)          | 1    |
| Edit applies the same rules, keeps id and createdAt | unit  | `edits title and description`, `rejects a blank title on edit`, `clears the description when an edit omits it`, `stores a blank description as null on edit`, `keeps id and createdAt on edit` | 1    |
| Restore does not re-run creation rules              | unit  | `restores a task from its snapshot`                                                                                                                                                            | 1    |
| Repository stores, finds, deletes, copies           | unit  | `finds a saved task by id`, `returns null for an unknown id`, `deletes a task`, `returns copies, not stored state`                                                                             | 2    |
| Repository order and position filter                | unit  | `lists newest first, breaking ties by id`, `lists only tasks after a position`                                                                                                                 | 2    |
| `server-only` importable in Vitest                  | unit  | covered by the repository test file importing the adapter                                                                                                                                      | 2    |
| Create (spec §2)                                    | unit  | `creates a task`, `sets id and createdAt from the ports`                                                                                                                                       | 3    |
| Get, update, delete, with not found (spec §2)       | unit  | `gets a task by id`, `updates a task`, `deletes a task`, `fails with TASK_NOT_FOUND …` for each, `fails with TASK_TITLE_REQUIRED and keeps the stored task`                                    | 3    |
| Pagination (D-10, D-12, D-21)                       | unit  | every pagination line of "Review focus"                                                                                                                                                        | 4    |
| Invalid cursor                                      | unit  | `rejects an invalid cursor` (table of literals)                                                                                                                                                | 4    |
| Real adapters and wiring                            | unit  | `returns the current time`, `generates distinct UUIDs`, `wires the use cases to the given ports`                                                                                               | 5    |

- **Levels:** unit only. No transport or UI exists yet; the router level is sub-plan 3.
- **Data:** `makeTask(overrides)` and `makeTaskSnapshot(overrides)` factories with fixed values; `FixedClock` (a constant time given to its constructor) and `SequentialIdGenerator` (`task-1`, `task-2`, …) in `src/test/fakes/`. Each test builds a fresh repository.
- **Targets:** at least 90% lines and branches on `src/server/**`, enforced by `pnpm test:coverage` from this sub-plan on.
- **How to run:** `pnpm test`, `pnpm test:coverage`, `pnpm lint`, `pnpm typecheck`.

## Style deviations

| Principle broken | Criterion and evidence | Alternative rejected | Review trigger | Impact on tests |
| ---------------- | ---------------------- | -------------------- | -------------- | --------------- |

None.

---

## Task 1: limits, domain errors and the `Task` entity

**Files:**

- Create: `src/shared/tasks/task-limits.ts`, `src/server/tasks/domain/task-errors.ts`, `src/server/tasks/domain/interfaces/task-snapshot.ts`, `src/server/tasks/domain/task.ts`, `src/server/tasks/domain/task.test.ts`, `src/test/factories/make-task.ts`

**Interfaces:**

- Produces `task-limits.ts`: `TASK_TITLE_MAX_LENGTH = 120`, `TASK_DESCRIPTION_MAX_LENGTH = 1000`, `TASK_PAGE_SIZE_DEFAULT = 10`, `TASK_PAGE_SIZE_MAX = 50`, `TASK_ID_MAX_LENGTH = 36`, `TASK_CURSOR_MAX_LENGTH = 84` (the last two with a one-line comment on how they are derived). Plain constants, no imports.
- Produces `task-errors.ts`: `abstract class DomainError extends Error { abstract readonly code: string }`, and `TaskNotFoundError`, `TaskTitleRequiredError`, `TaskTitleTooLongError`, `TaskDescriptionTooLongError`, `TaskCursorInvalidError`, each with `readonly code = '<CODE>' as const`.
- Produces `interfaces/task-snapshot.ts` and `task.ts`:
  - `interface TaskSnapshot { readonly id: string; readonly title: string; readonly description: string | null; readonly createdAt: Date }`;
  - `class Task`, private constructor;
  - `static create(props: { id: string; title: string; description?: string | null; createdAt: Date }): Task`;
  - `static restore(snapshot: TaskSnapshot): Task`;
  - `edit(changes: { title: string; description?: string | null }): void`;
  - read-only getters `id`, `title`, `description`, `createdAt`;
  - `toSnapshot(): TaskSnapshot`, which returns a new object with a copied `Date`.
- Produces `make-task.ts`: `makeTask(overrides?: Partial<TaskSnapshot>): Task` (through `restore`) and `makeTaskSnapshot(overrides?)`, with fixed defaults (`id: 'task-1'`, `title: 'Write the README'`, `description: null`, `createdAt: new Date('2026-11-19T12:00:00.000Z')`).

- [x] **Step 1:** write the entity tests from the test plan (Task 1 rows). Assert errors by `code` with `catchError` (sync). Use `'a'.repeat(120)` literals for the limits, so no logic.
- [x] **Step 2:** run and watch them fail on the assertions. A minimal `Task` that compiles and does nothing makes this possible.
- [x] **Step 3:** implement the limits, errors and `Task`. `create` and `edit` share one private static method, `Task.normalizeContent`: trim the title, check blank then length; trim the description, blank → `null`, check length.
- [x] **Step 4:** `pnpm test` green; `pnpm lint` green (the domain imports only `@/shared/tasks/task-limits`).

**Execution notes (2026-11-19):**

- Red: with a `Task` that stored input as given, 13 of 21 tests failed on their assertions (`expected '  Write the README  ' to be 'Write the README'`, `expected '' to be null`, 4 × `Expected the function to throw, but it returned normally`), none on an import. The 8 that already passed check what the stub did on purpose (store input, restore). They include the "just inside" sides of the limit pairs (120 and 1000 accepted), which guard against an off-by-one once validation exists.
- Green: 21 passed. `pnpm lint` (the domain imports only `@/shared/tasks/task-limits`) and `pnpm typecheck` exit 0.
- Coverage of `src/server/**` after this task: 83.33% lines, 100% branches. `pnpm test:coverage` fails the gate until Tasks 3 and 4 use `TaskNotFoundError`, `TaskCursorInvalidError` and the `id`/`createdAt` getters. The plan checks the gate at Task 5.
- Lengths are counted in UTF-16 code units (`String.length`), the same unit Zod's `.max` uses in sub-plan 3, so the form and the entity agree.

- After review (user request): `TaskSnapshot` moved to its own file, `domain/interfaces/task-snapshot.ts`; the internal `TaskContent` interface was replaced by `Pick<TaskSnapshot, 'title' | 'description'>`. Convention added to `code-style.md` (one interface per file, in an `interfaces/` folder of its layer), and `TaskPosition` in Task 2 goes to `application/ports/interfaces/task-position.ts`.

- After review (user request): the shared title/description rule moved from a loose `normalizeContent` function in `task.ts` to the private static method `Task.normalizeContent`, so the rule stays in the entity and nothing loose sits next to the class. Convention added to `code-style.md` and `backend.md`.

- After review (user request): JavaScript `#` private fields replaced by TypeScript `private`, the form the user can explain in an interview. The state lives in one `private state: TaskSnapshot` (a getter cannot share a field's name, and `_` prefixes were avoided); `edit` replaces it with `{ ...this.state, ...content }`. Convention added to `code-style.md`.

- Code review fixes (user approved): three tests added, written after the code, each with the production change that breaks it:
  - `does not let a changed createdAt from the getter alter the task` breaks if the getter returns `this.state.createdAt` without copying it;
  - `does not let a changed createdAt from a snapshot alter the task` breaks if `toSnapshot` drops its `createdAt: new Date(...)`;
  - `keeps the task unchanged when an edit fails` breaks if `edit` applies the title before validating the description.

  The table tests got readable labels (`empty`, `spaces only`, `missing`). Six doc comments that restated the code were removed (user request). `code-style.md` now says there are no doc comments by default.

**Suggested commit:** `feat(server): add Task entity, domain errors and shared limits`

## Task 2: ports, test fakes and the in-memory repository

**Files:**

- Create: `src/server/tasks/application/ports/task-repository.ts`, `ports/interfaces/task-position.ts`, `clock.ts`, `id-generator.ts`; `src/test/fakes/fixed-clock.ts`, `sequential-id-generator.ts`; `src/server/tasks/infra/in-memory-task-repository.ts` and its `.test.ts`
- Modify: `package.json` (dependency `server-only` 0.0.1), `vitest.config.mts` (alias)

**Interfaces:**

- Produces ports, as abstract classes:
  - `TaskRepository`: `findExistingById(id: string): Promise<Task>` (rejects with `TaskNotFoundError`; was `findById` returning `null`, changed in Task 3's review), `save(task: Task): Promise<void>`, `delete(id: string): Promise<void>`, `listAfter(position: TaskPosition | null, count: number): Promise<Task[]>`, where `interface TaskPosition { readonly createdAt: Date; readonly id: string }` lives in its own file, `application/ports/interfaces/task-position.ts` (code-style: one interface per file, in `interfaces/`);
  - `Clock`: `now(): Date`;
  - `IdGenerator`: `next(): string`.
- Produces fakes: `FixedClock extends Clock`, with constructor `(now: Date)`; `SequentialIdGenerator extends IdGenerator`, returning `task-1`, `task-2`, ….
- Produces `InMemoryTaskRepository extends TaskRepository`:
  - imports `server-only`;
  - stores `Map<string, TaskSnapshot>`;
  - `save` stores `task.toSnapshot()`, and `findExistingById` and `listAfter` return `Task.restore(...)` of a copy;
  - `listAfter` sorts by `createdAt` desc then `id` desc, keeps the tasks strictly after `position` in that order, and takes `count`, with a short why-comment (strictly after a position, so the task the cursor came from may be gone, D-21; `id` breaks ties, D-12).

- [x] **Step 1:** Vitest alias `server-only` → `node_modules/server-only/empty.js`. Its `exports` map sends the default condition to a throwing `index.js` and `react-server` to `empty.js`. This is a test-runner setting for a third-party marker, not a mock of project code. A short comment says why.
- [x] **Step 2:** write the repository tests (Task 2 rows), red, then implement the ports, fakes and adapter, green.
- [x] **Step 3:** `pnpm test`, `pnpm lint` (ports in `application/` import only `domain/`) green.

**Execution notes (2026-11-19):**

- `server-only` 0.0.1 installed. Its `exports` map, checked after install: `react-server` → `empty.js` (empty file), default → `index.js` (throws). The Vitest alias points to `empty.js`.
- Red: against a stub adapter, 5 of 7 repository tests failed on their assertions (`expected [] to deeply equal [ 'task-c', 'task-b', 'task-a' ]`, …). The test file imports the adapter, which imports `server-only`, and loaded fine, so the alias works. The 2 that passed (unknown id → `null`, delete) hold for the stub by coincidence.
- Green: 31 passed. A seventh test, `returns at most the requested number of tasks`, covers `count`.
- Lint: `.sort(InMemoryTaskRepository.compareNewestFirst)` failed `@typescript-eslint/unbound-method`, so it became an arrow callback. The ordering helper is the private static `compareNewestFirst` (no loose functions next to the class). Only one comment was kept, the D-21 why in `listAfter`.
- Verified: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check` exit 0; the VS Code Problems panel is empty.

- Code review follow-up (user decision, D-22): the in-memory repository got a capacity of 1000, the constructor default. It was first placed in `task-limits.ts` as `TASK_STORAGE_CAPACITY`. A second review moved it into the adapter (`private static readonly DEFAULT_CAPACITY`): `src/shared` holds only what client and server both use, and neither the entity nor the schema uses the capacity. Saving a new task when full rejects with `TaskStorageFullError` (`TASK_STORAGE_FULL`); an existing task still saves. Red: only `rejects a new task when the storage is full` failed (`promise resolved "undefined" instead of rejecting`). The other new tests already passed and guard against a wrong cap, such as counting an edit as a new task. `keeps the stored task when the saved instance is edited later` (a review finding) was written after the code; it breaks if `save` stores a reference instead of `task.toSnapshot()`. 35 tests pass.

- Second review: `breaks ties by id whatever the order tasks were saved in` added (the tasks are saved in reverse order, so the `sort` runs both sides of the `id` comparison). It was written after the code; it breaks if the `id` ternary is flipped. Branch coverage is now 100%. D-22's memory figure was corrected from "1.1 MB" (unverified) to 1.1 million characters.

**Suggested commit:** `feat(server): add repository, clock and id ports with the in-memory adapter`

## Task 3: `CreateTask`, `GetTask`, `UpdateTask`, `DeleteTask`

**Files:**

- Create: `src/server/tasks/application/use-cases/<name>/<name>.ts` and `<name>.test.ts` for `create-task`, `get-task`, `update-task` and `delete-task`

**Interfaces:**

- `CreateTask(repository, clock, idGenerator).execute(input: { title: string; description?: string | null }): Promise<Task>`
- `GetTask(repository).execute(input: { id: string }): Promise<Task>`: throws `TaskNotFoundError`
- `UpdateTask(repository).execute(input: { id: string; title: string; description?: string | null }): Promise<Task>`: load, throw `TaskNotFoundError` if missing, `task.edit(...)`, save, return
- `DeleteTask(repository).execute(input: { id: string }): Promise<void>`: throws `TaskNotFoundError` if missing, then deletes

- [x] **Step 1:** one test file per use case (Task 3 rows), with a fresh `InMemoryTaskRepository`, `FixedClock` and `SequentialIdGenerator`. Async errors are asserted with `await expect(promise).rejects.toMatchObject({ code: 'TASK_NOT_FOUND' })`. A failed update or delete leaves the repository unchanged, asserted by reading it back.
- [x] **Step 2:** red, implement each use case as a thin script (load → entity → save → return), green.

**Execution notes (2026-11-19):**

- `findExistingTask(repository, id)` added in `application/use-cases/find-existing-task.ts`. `GetTask`, `UpdateTask` and `DeleteTask` each loaded the task and threw `TaskNotFoundError` when missing: a third copy, which `code-style.md` turns into an abstraction. It is a function with no owner class, in its own file in the layer of its rule.
- Lint: the layer blocks of `eslint.config.mjs` now ignore `**/*.test.{ts,tsx}`. The dependency rule is for production code, and `tests.md` tests use cases with the in-memory adapter from `infra/`.
- Lint: `padding-line-between-statements` is off for tests. In the use-case and repository tests, `eslint --fix` had inserted blank lines inside Arrange, after a `const` and before `await repository.save(...)`. That broke the Arrange/Act/Assert spacing of `tests.md`. The 16 inserted lines were removed, and `code-style.md` records the exception.
- Red: with stubs that reject with `Not implemented`, all 10 use-case tests failed. Green: 46 passed. Coverage on `src/server/**`: 97.43% lines, 100% branches; `pnpm test:coverage` exits 0.
- Verified: `pnpm lint`, `pnpm typecheck`, `pnpm format:check` exit 0.

- Review of Task 3 (user decisions):
  - `findExistingTask` (a loose function) replaced by `findExistingById` in the repository **contract and its implementation**. The port declares it, the in-memory adapter rejects with `TaskNotFoundError`, and the use cases call it. `findById` was removed: no use case calls it any more (`backend.md`: a method exists only when a use case calls it). `backend.md` records that not-found is part of the port contract.
  - Input shapes moved out of the signatures into interfaces:
    - `domain/interfaces/task-content.ts` (`TaskContent`, used by `Task.create`, `Task.edit` and `CreateTask`);
    - each use case's input in its own folder (user request: a shared `use-cases/interfaces/` folder is hard to navigate): then renamed (user request) to the folder pattern `index.ts` / `index.test.ts` / `dto.ts`: every use case, `CreateTask` included (`CreateTaskInput extends TaskContent`), keeps its input in `dto.ts`. `UpdateTaskInput` extends `TaskContent` with `id`. ESLint `no-empty-object-type` allows a single-extends interface.
  - Deep relative imports replaced by the `@/` alias (new rule in `code-style.md`). A blank line now separates `edit` and `save` in `UpdateTask`.
  - New test `fails with TASK_STORAGE_FULL when the storage is full` in `CreateTask`.
  - Tests that read the repository use `findExistingById`; absence is asserted as a `TASK_NOT_FOUND` rejection. 47 tests pass; coverage 97.36% lines, 100% branches.
  - Folders reorganized (user decision, D-23): `src/server/tasks/{domain,application,infra}` became `src/server/domains/task/{entities,repositories,providers,use-cases}`. `TaskSnapshot` and `TaskContent` moved to `entities/dto.ts`, `TaskPosition` to `repositories/dto.ts`. The in-memory repository sits beside its contract as `in-memory-database-repository.ts` and no longer imports `server-only`. ESLint layer blocks rewritten for `domains/**` and `entities/`, checked with the ESLint API: forbidden imports blocked, allowed ones pass. Files only moved; 47 tests still pass.

**Suggested commit:** `feat(server): add create, get, update and delete task use cases`

## Task 4: `ListTasks` with the position cursor

**Files:**

- Create: `src/server/domains/task/use-cases/list-tasks/index.ts`, `dto.ts`, `task-cursor.ts`, `index.test.ts`

**Interfaces:**

- `task-cursor.ts`: `encodeTaskCursor(position: TaskPosition): string` (base64 of `<createdAt ISO>|<id>`, with `btoa`) and `decodeTaskCursor(cursor: string): TaskPosition`. Decoding throws `TaskCursorInvalidError` on invalid base64, a part count other than 2, an invalid date or an empty id. Pure functions, tested through `ListTasks`. A short why-comment at the top: the cursor is a position, not an id, so it survives the deletion of its task (D-21).
- `ListTasks(repository).execute(input: { cursor: string | null; limit: number }): Promise<{ items: Task[]; nextCursor: string | null }>`. It decodes the cursor and asks the repository for `limit + 1` tasks after the position. If more than `limit` come back, it returns the first `limit` and the cursor of the last one returned; otherwise `nextCursor: null`. `limit` is trusted: the schema validates it in sub-plan 3 and applies `TASK_PAGE_SIZE_DEFAULT`.

- [x] **Step 1:** pagination tests from "Review focus", written with literal tasks saved at fixed `createdAt` values, and the invalid-cursor table (`'%%%'`, the base64 of `'only-one-part'`, the base64 of `'not-a-date|task-1'`, the base64 of `'2026-11-19T12:00:00.000Z|'`). Red, implement, green.

**Execution notes (2026-11-19):**

- Files in `src/server/domains/task/use-cases/list-tasks/` (D-23): `index.ts`, `dto.ts` (`ListTasksInput`, `ListTasksOutput`), `task-cursor.ts`, `index.test.ts`.
- Red: with stubs that reject with `Not implemented`, all 15 tests failed on that error, none on an import. Green: 62 tests pass.
- Invalid-cursor table: `'only-one-part'` was replaced by the base64 of a date alone (`'2026-11-19T12:00:00.000Z'`). The first value also fails the date check, so no test would break if the separator check were removed; a valid date with no separator does break it. A "three parts" row was added for the `id.includes('|')` check.
- What breaks each test: asking the repository for `limit` instead of `limit + 1` (no next cursor); taking the cursor from `tasks[limit]` instead of `tasks[limit - 1]` (the last page skips a task); removing any check in `decodeTaskCursor` (its table row).
- `nextCursor` is built from the last task of the page, without a branch that cannot happen: `hasNextPage ? tasks[limit - 1] : undefined`.
- Coverage on `src/server/**`: 100% lines and branches. `pnpm lint`, `pnpm typecheck` and `pnpm format:check` exit 0.

**Suggested commit:** `feat(server): add paginated ListTasks with a position cursor`

## Task 5: real adapters, composition and closing docs

**Files:**

- Move (user request, 2026-11-19: one folder per provider, so `providers/` does not pile up files): `providers/clock.ts` → `providers/clock/clock.ts`, `providers/id-generator.ts` → `providers/id-generator/id-generator.ts`; update their imports (use cases, `src/test/fakes/`)
- Create: `providers/clock/system-clock.ts` and `providers/id-generator/random-id-generator.ts` (with tests), under `src/server/domains/task/`; `src/server/tasks-module.ts` (with test)
- Modify: this plan's status, the roadmap's sub-plan 2 status (D-20 and D-21 are written with this plan)

**Interfaces:**

- `SystemClock extends Clock` (`new Date()`); `RandomIdGenerator extends IdGenerator` (global `crypto.randomUUID()`). Both import nothing (D-23).
- `createTasksModule(deps: { repository: TaskRepository; clock: Clock; idGenerator: IdGenerator }): { createTask: CreateTask; listTasks: ListTasks; getTask: GetTask; updateTask: UpdateTask; deleteTask: DeleteTask }`. Imports `server-only`. The `globalThis` singleton is sub-plan 3's composition root.

- [x] **Step 1:** tests:
  - `returns the current time`: the result is a `Date` between two `Date` values taken before and after the call, so no logic;
  - `generates distinct UUIDs`: the first call in Arrange, the second is the Act; both match a literal UUID v4 regex and differ;
  - `wires the use cases to the given ports`: create through the module, then get the task through the module.

  Red, implement, green.

- [x] **Step 2:** `pnpm test:coverage` meets 90% lines and branches on `src/server/**` (paste the summary); `pnpm lint`, `pnpm typecheck` and `pnpm format:check` green; `tasks-module.ts` starts with `import 'server-only';`, and `grep -r "server-only" src/server/domains` finds nothing.
- [x] **Step 3:** mark this plan "Done" and sub-plan 2 "Done" in the roadmap; add the D-03 field mapping to the README (the model now exists); in `CLAUDE.md` "Stack", Zod → "installed in sub-plan 3" and add `server-only` 0.0.1.

**Execution notes (2026-11-19):**

- Provider contracts moved into one folder each (user request): `providers/clock/clock.ts`, `providers/id-generator/id-generator.ts`; imports updated in `CreateTask` and `src/test/fakes/`.
- `SystemClock` is tested with Vitest fake timers on `Date` only (`vi.setSystemTime`), instead of comparing with two `Date` values taken around the call: the expected value is a literal, and the test has a single Act and no value computed in the Assert. Real timers are restored after each test.
- `generates distinct UUIDs` became two tests, one behavior each: `generates a UUID v4` and `generates a different id on each call`.
- `createTasksModule` has one test per use case (create, list, get, update, delete), each asserting through the repository it was given, instead of a single create-then-get test: a use case wired to another repository would pass the single test. Its return type is inferred; no interface is declared for a shape only this function builds.
- Red: with stub providers that throw and a module wired to a separate repository, all 8 new tests failed on their assertions or the stub error, none on an import. Green: 70 tests pass.
- Coverage on `src/server/**`: 100% lines (96/96) and branches (37/37). `pnpm lint`, `pnpm typecheck` and `pnpm format:check` exit 0. `tasks-module.ts` starts with `import 'server-only';`; `grep -rn server-only src/server/domains` finds nothing.

- Code review after Task 5 (user decisions):
  - The clock and ID generator were removed as overengineering (D-24): `CreateTask` calls `new Date()` and `crypto.randomUUID()` directly, and `createTasksModule(repository)` takes only the repository. Removed: `providers/` (contracts, `SystemClock`, `RandomIdGenerator` and their tests) and `src/test/fakes/`. `CreateTask` tests freeze time with Vitest fake timers and check the id by its UUID v4 shape and by being different on each call. These tests were rewritten together with the code (a refactor, behavior unchanged), not red first; each breaks if `new Date()` or `crypto.randomUUID()` is replaced by a constant.
  - `task-cursor.ts`: a class with static methods was tried and refused by ESLint `no-extraneous-class`, so the cursor stays as functions (user choice: the simplest form). `decodeTaskCursor` now checks the separator before reading the date and id, and base64 decoding is a small function of its own.
  - Imports aligned (`entities` → `repositories` → `use-cases`, a blank line between the `@/` and `./` groups); `ListTasksOutput.items` is `readonly Task[]`.
  - 69 tests pass; coverage 100% lines and branches.

**Suggested commit:** `feat(server): add system adapters and tasks module composition`

---

## Review

| #   | Finding                                                                                                     | Source                           | Accepted? | Reason                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------- | -------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Roadmap puts a "limit cap" test in sub-plan 2, but `ListTasks` trusts `limit` validated at the edge         | self-review (coverage)           | Yes       | range and default enforced by the schema; the test moves to sub-plan 3 (roadmap updated)                                              |
| 2   | D-20 and D-21 were planned for Task 5, but a decision goes in with the change that makes it                 | self-review (decisions and docs) | Yes       | written to `DECISIONS.md` with this plan                                                                                              |
| 3   | Tie-break direction by `id` was not stated as a choice                                                      | self-review (assumptions)        | Yes       | descending, consistent with `createdAt`; stated in "Global constraints" and D-21                                                      |
| 4   | `id` and `cursor` length caps assigned to sub-plan 2 by the roadmap were deferred without a value or record | plan-reviewer (error 1)          | Yes       | both derived from decisions, not picked: UUID = 36, cursor = base64 of 61 bytes = 84; constants in `task-limits.ts`, recorded in D-20 |
| 5   | No test for an omitted description on edit (D-15) or on create                                              | plan-reviewer (error 2)          | Yes       | entity tests added, with a literal table for create                                                                                   |
| 6   | Middle page not planned                                                                                     | plan-reviewer (error 3)          | Yes       | `2 × limit + 1` case added                                                                                                            |
| 7   | Who applies the page-size default not recorded; roadmap rows still pending                                  | plan-reviewer (suggestion 1)     | Yes       | D-20 states it (schema at the edge, `CLAUDE.md` rule); roadmap rows closed                                                            |
| 8   | `async` without `await` fails `require-await`                                                               | plan-reviewer (suggestion 2)     | Yes       | adapter returns `Promise.resolve(...)`                                                                                                |
| 9   | No decision comments planned                                                                                | plan-reviewer (suggestion 3)     | Yes       | why-comments in `task-cursor.ts` and `listAfter`                                                                                      |
| 10  | `FixedClock.set` has no caller                                                                              | plan-reviewer (suggestion 4)     | Yes       | removed                                                                                                                               |
| 11  | "Counted after trimming" and description trim untested                                                      | plan-reviewer (suggestion 5)     | Yes       | tests added                                                                                                                           |
| 12  | Failed edit of an existing task not tested                                                                  | plan-reviewer (suggestion 6)     | Yes       | UpdateTask test added                                                                                                                 |
| 13  | `server-only` security row had no named check                                                               | plan-reviewer (suggestion 7)     | Yes       | grep check in Task 5; build-level proof in sub-plan 3                                                                                 |
| 14  | `CLAUDE.md` stack: Zod row and `server-only`                                                                | plan-reviewer (suggestion 8)     | Yes       | Task 5, step 3                                                                                                                        |
