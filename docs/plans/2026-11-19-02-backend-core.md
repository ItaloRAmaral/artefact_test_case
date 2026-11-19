# Plan: back-end core (sub-plan 2)

| Field   | Value                                                                                                                                                                                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status  | Approved                                                                                                                                                                                                                                                                                   |
| Date    | 2026-11-19                                                                                                                                                                                                                                                                                 |
| Request | "segue para o sub-plano 2": sub-plan 2 of the roadmap, the back-end core (domain, application, infra)                                                                                                                                                                                      |
| Context | [Roadmap](2026-11-19-roadmap.md) sub-plan 2, "Interfaces between sub-plans" and "Security"; [`docs/DECISIONS.md`](../DECISIONS.md) D-04, D-05, D-07, D-10, D-12, D-13, D-15, D-17, D-19; `.claude/rules/backend.md`; `.claude/rules/tests.md`; `docs/SPEC.md` §2 (model, CRUD, validation) |
| Roadmap | [2026-11-19-roadmap.md](2026-11-19-roadmap.md), sub-plan 2                                                                                                                                                                                                                                 |

**Goal:** the task domain, the five use cases and the in-memory repository, fully unit-tested with the 90% gate on `src/server/**` now enforced, with no tRPC, Zod or Next.js involved.

**Architecture:** everything in `.claude/rules/backend.md`'s layout. `src/shared/tasks/task-limits.ts` holds the limits. `src/server/tasks/domain/` holds `Task` and its errors. `src/server/tasks/application/` holds the ports and one folder per use case; the cursor codec sits in `list-tasks/`, its only user. `src/server/tasks/infra/` holds the adapters, and `tasks-module.ts` wires them. Test fakes and factories go in `src/test/`.

## Global constraints

- Limits (D-20): title 1 to 120 characters after trimming, description up to 1000 after trimming, page size default 10, maximum 50. Input caps derived from earlier decisions, not picked: `id` up to 36 characters (a UUID v4 string) and `cursor` up to 84 characters (base64 of a 24-character ISO date, `|`, and a 36-character id: 61 bytes → 84 characters). They are enforced by the schemas in sub-plan 3.
- Order (D-12): `createdAt` descending, then `id` descending to break ties (descending like `createdAt`, so the order reads one way).
- The page-size range (1 to `TASK_PAGE_SIZE_MAX`) and its default are enforced by the Zod schema in sub-plan 3, at the edge (`CLAUDE.md`: inside, code trusts the types). `ListTasks` trusts `limit`, so the roadmap's "limit cap" test belongs to sub-plan 3's router tests.
- Cursor (D-21): opaque string, base64 of `<createdAt ISO>|<id>` of the last task of the page. The application decodes it; the repository receives a position, never the raw cursor.
- Error codes (roadmap interface, D-07): `TASK_NOT_FOUND`, `TASK_TITLE_REQUIRED`, `TASK_TITLE_TOO_LONG`, `TASK_DESCRIPTION_TOO_LONG`, `TASK_CURSOR_INVALID`. Each is a `DomainError` subclass with a literal `code`.
- IDs are UUID v4 from `node:crypto` `randomUUID()`, in infra only. Time comes from `Clock`.
- `domain/` and `application/` import nothing external (D-17 lint). `infra/` and `tasks-module.ts` import `server-only` (D-13).
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

## Security

| Threat                            | How this plan handles it                                                                                                                                                                                                                 | Task and test                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Mass assignment                   | `CreateTask` input has no `id` or `createdAt`; both come from ports                                                                                                                                                                      | Task 3, `sets id and createdAt from the ports` |
| Unbounded input                   | title and description limits enforced by the entity                                                                                                                                                                                      | Task 1, limit tests                            |
| Stored state mutated by reference | the repository stores snapshots and returns new entities                                                                                                                                                                                 | Task 2, `returns copies, not stored state`     |
| Forged cursor                     | strict decoding, `TASK_CURSOR_INVALID` on anything malformed; length cap at the edge in sub-plan 3                                                                                                                                       | Task 4                                         |
| Server code in client bundles     | `server-only` as the first import of `in-memory-task-repository.ts`, `system-clock.ts`, `random-id-generator.ts` and `tasks-module.ts`; the build-level proof (a client import failing) arrives with the first client code in sub-plan 3 | Task 5, step 2 (grep check)                    |
| Internal details in errors        | domain errors carry only `code`; translation is sub-plan 3                                                                                                                                                                               | Task 1                                         |

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
  - `TaskRepository`: `findById(id: string): Promise<Task | null>`, `save(task: Task): Promise<void>`, `delete(id: string): Promise<void>`, `listAfter(position: TaskPosition | null, count: number): Promise<Task[]>`, where `interface TaskPosition { readonly createdAt: Date; readonly id: string }` lives in its own file, `application/ports/interfaces/task-position.ts` (code-style: one interface per file, in `interfaces/`);
  - `Clock`: `now(): Date`;
  - `IdGenerator`: `next(): string`.
- Produces fakes: `FixedClock extends Clock`, with constructor `(now: Date)`; `SequentialIdGenerator extends IdGenerator`, returning `task-1`, `task-2`, ….
- Produces `InMemoryTaskRepository extends TaskRepository`:
  - imports `server-only`;
  - stores `Map<string, TaskSnapshot>`;
  - `save` stores `task.toSnapshot()`, and `findById` and `listAfter` return `Task.restore(...)` of a copy;
  - `listAfter` sorts by `createdAt` desc then `id` desc, keeps the tasks strictly after `position` in that order, and takes `count`, with a short why-comment (strictly after a position, so the task the cursor came from may be gone, D-21; `id` breaks ties, D-12).

- [ ] **Step 1:** Vitest alias `server-only` → `node_modules/server-only/empty.js`. Its `exports` map sends the default condition to a throwing `index.js` and `react-server` to `empty.js`. This is a test-runner setting for a third-party marker, not a mock of project code. A short comment says why.
- [ ] **Step 2:** write the repository tests (Task 2 rows), red, then implement the ports, fakes and adapter, green.
- [ ] **Step 3:** `pnpm test`, `pnpm lint` (ports in `application/` import only `domain/`) green.

**Suggested commit:** `feat(server): add repository, clock and id ports with the in-memory adapter`

## Task 3: `CreateTask`, `GetTask`, `UpdateTask`, `DeleteTask`

**Files:**

- Create: `src/server/tasks/application/use-cases/<name>/<name>.ts` and `<name>.test.ts` for `create-task`, `get-task`, `update-task` and `delete-task`

**Interfaces:**

- `CreateTask(repository, clock, idGenerator).execute(input: { title: string; description?: string | null }): Promise<Task>`
- `GetTask(repository).execute(input: { id: string }): Promise<Task>`: throws `TaskNotFoundError`
- `UpdateTask(repository).execute(input: { id: string; title: string; description?: string | null }): Promise<Task>`: load, throw `TaskNotFoundError` if missing, `task.edit(...)`, save, return
- `DeleteTask(repository).execute(input: { id: string }): Promise<void>`: throws `TaskNotFoundError` if missing, then deletes

- [ ] **Step 1:** one test file per use case (Task 3 rows), with a fresh `InMemoryTaskRepository`, `FixedClock` and `SequentialIdGenerator`. Async errors are asserted with `await expect(promise).rejects.toMatchObject({ code: 'TASK_NOT_FOUND' })`. A failed update or delete leaves the repository unchanged, asserted by reading it back.
- [ ] **Step 2:** red, implement each use case as a thin script (load → entity → save → return), green.

**Suggested commit:** `feat(server): add create, get, update and delete task use cases`

## Task 4: `ListTasks` with the position cursor

**Files:**

- Create: `src/server/tasks/application/use-cases/list-tasks/list-tasks.ts`, `task-cursor.ts`, `list-tasks.test.ts`

**Interfaces:**

- `task-cursor.ts`: `encodeTaskCursor(position: TaskPosition): string` (base64 of `<createdAt ISO>|<id>`, with `btoa`) and `decodeTaskCursor(cursor: string): TaskPosition`. Decoding throws `TaskCursorInvalidError` on invalid base64, a part count other than 2, an invalid date or an empty id. Pure functions, tested through `ListTasks`. A short why-comment at the top: the cursor is a position, not an id, so it survives the deletion of its task (D-21).
- `ListTasks(repository).execute(input: { cursor: string | null; limit: number }): Promise<{ items: Task[]; nextCursor: string | null }>`. It decodes the cursor and asks the repository for `limit + 1` tasks after the position. If more than `limit` come back, it returns the first `limit` and the cursor of the last one returned; otherwise `nextCursor: null`. `limit` is trusted: the schema validates it in sub-plan 3 and applies `TASK_PAGE_SIZE_DEFAULT`.

- [ ] **Step 1:** pagination tests from "Review focus", written with literal tasks saved at fixed `createdAt` values, and the invalid-cursor table (`'%%%'`, the base64 of `'only-one-part'`, the base64 of `'not-a-date|task-1'`, the base64 of `'2026-11-19T12:00:00.000Z|'`). Red, implement, green.

**Suggested commit:** `feat(server): add paginated ListTasks with a position cursor`

## Task 5: real adapters, composition and closing docs

**Files:**

- Create: `src/server/tasks/infra/system-clock.ts`, `random-id-generator.ts` (with tests), `src/server/tasks/tasks-module.ts` (with test)
- Modify: this plan's status, the roadmap's sub-plan 2 status (D-20 and D-21 are written with this plan)

**Interfaces:**

- `SystemClock extends Clock` (`new Date()`); `RandomIdGenerator extends IdGenerator` (`randomUUID()` from `node:crypto`). Both import `server-only`.
- `createTasksModule(deps: { repository: TaskRepository; clock: Clock; idGenerator: IdGenerator }): { createTask: CreateTask; listTasks: ListTasks; getTask: GetTask; updateTask: UpdateTask; deleteTask: DeleteTask }`. Imports `server-only`. The `globalThis` singleton is sub-plan 3's composition root.

- [ ] **Step 1:** tests:
  - `returns the current time`: the result is a `Date` between two `Date` values taken before and after the call, so no logic;
  - `generates distinct UUIDs`: the first call in Arrange, the second is the Act; both match a literal UUID v4 regex and differ;
  - `wires the use cases to the given ports`: create through the module, then get the task through the module.

  Red, implement, green.

- [ ] **Step 2:** `pnpm test:coverage` meets 90% lines and branches on `src/server/**` (paste the summary); `pnpm lint`, `pnpm typecheck` and `pnpm format:check` green; `grep -L "^import 'server-only';"` on the four server-wiring files lists none.
- [ ] **Step 3:** mark this plan "Done" and sub-plan 2 "Done" in the roadmap; add the D-03 field mapping to the README (the model now exists); in `CLAUDE.md` "Stack", Zod → "installed in sub-plan 3" and add `server-only` 0.0.1.

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
