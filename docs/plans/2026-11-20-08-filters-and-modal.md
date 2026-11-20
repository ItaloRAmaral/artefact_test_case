# Plan: title search, creation-date filter and the create/edit modal

| Field   | Value                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status  | Approved                                                                                                                                                                                                                                                                                                                                                                                               |
| Date    | 2026-11-20                                                                                                                                                                                                                                                                                                                                                                                             |
| Request | "agora vamos adicionar um filtro por data de criação e um search por titulo blz ? Gostaria também que ao clicar em new task ou edit não fosse redirecionado para outra pagina, e sim um modal de criação, acho mais moderno e mais ui/ux"                                                                                                                                                              |
| Context | `docs/SPEC.md` §3 (list page with SSR, create/update **page** with a form, feedback states) and §4 (infinite scroll); DECISIONS D-10, D-12, D-14, D-21, D-25, D-27, D-29, D-31, D-32; Next.js 16.4.6 docs in `node_modules/next/dist/docs/`: `parallel-routes.md` § Modals, `intercepting-routes.md`, `01-getting-started/04-linking-and-navigating.md` § Native History API, `page.md` § searchParams |

**Goal:** the list can be narrowed by a title search and a creation-date range, both kept in the URL and applied on the server, and `New task` and `Edit` open the form in a modal over the list while their URLs still work as full pages.

**Architecture:** the filter is part of the `task.list` input. The repository filters while it pages (the cursor of D-21 is unchanged), so infinite scroll stays correct. The URL carries the filter; the page reads `searchParams` and prefetches the filtered first page. In the browser the filter bar writes the URL with `window.history.replaceState`, and `TaskList` reads it with `useSearchParams`, so a filter change is a tRPC query and not a server round trip. The modal is the Next.js parallel + intercepting routes pattern: an `@modal` slot in the root layout with `(.)tasks/new` and `(.)tasks/[id]/edit`. A direct load or a refresh renders the existing pages.

## Global constraints

- Title search: at most `TASK_TITLE_MAX_LENGTH` (120) characters after trimming, at least 1 (D-20; a search longer than any title can match nothing).
- Dates on the wire are ISO 8601 UTC strings with milliseconds (D-11), validated with `z.iso.datetime({ precision: 3 })`: the 24-character form `toISOString()` produces. Zod 4.6.7 rejects an offset, a date-only value and, with `precision: 3`, any other number of fractional digits (checked 2026-11-20).
- The list order stays newest first, ties broken by `id` (D-12, D-21); the cursor format is unchanged (D-21).
- `listTasksInputSchema` stays strict: unknown keys are rejected (`.extend` on a `strictObject` keeps it strict, checked 2026-11-20); `direction` is still accepted and ignored (D-25).
- `src/server/domains/` imports nothing external; no client file imports a value from `src/server/` (D-26).
- Every async action has visible loading, success and failure states; feedback uses `role="status"` / `role="alert"` (code-style).
- Component tests run with `TZ=America/Sao_Paulo` (UTC−3, no daylight saving; `vitest.config.ts`).
- jsdom 31.0.0 does not implement `HTMLDialogElement.showModal` (its `HTMLDialogElement-impl.js` is empty, checked 2026-11-20).

## Decisions with the user

| Question                                     | Answer                                                                                                                                                                                | Date       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| How does the modal work?                     | Modal with a URL (parallel + intercepting routes): a click opens it over the list; a direct load or refresh shows the full page; Back closes it. The create/edit pages stay (spec §3) | 2026-11-20 |
| Date filter shape                            | A `From` / `To` range, both optional, both days inclusive, read in the browser's time zone                                                                                            | 2026-11-20 |
| When filters apply and where they are stored | As you type (search debounced about 300 ms; dates on change), kept in the URL, so SSR renders the filtered list and a refresh keeps it                                                | 2026-11-20 |
| Does the search ignore accents?              | Yes: "acao" finds "Ação"                                                                                                                                                              | 2026-11-20 |
| May a saved task leave a filtered list?      | Yes, when it does not match the active filter                                                                                                                                         | 2026-11-20 |
| Filters vs code-style YAGNI ("no filters")   | The user asked for them: recorded as D-34; the YAGNI line of `code-style.md` names this exception                                                                                     | 2026-11-20 |

## Review focus

- **Filter + infinite scroll:** the next page keeps the filter. The client sends the same filter with the cursor (same query key), and the repository filters before it slices `count`. A page never mixes matching and non-matching tasks, and never stops early when later tasks match.
- **Range edges:** `createdFrom` is inclusive and `createdBefore` exclusive. The UI turns "To = 20 Nov" into the start of 21 Nov in local time, so a task created at 23:59 local on the 20th is included and one at 00:00 on the 21st is not.
- **From after To:** the result is empty with "No tasks match the filters."; it is not an error. The date inputs set `min`/`max` on each other, so the picker discourages it.
- **Case and accents:** the search ignores both ("readme" finds "Write the README", "acao" finds "Ação"; user decision, 2026-11-20). It is a substring match, never a regex built from user input.
- **Blank or whitespace search:** no filter. The search is trimmed, and an empty one is left out of the URL and the input.
- **One source for the filter:**
  - The server reads `searchParams` once and passes the filter as a prop.
  - The client never reads it back from the URL: with the modal open, `useSearchParams` returns the modal URL's params (`app-router.js` builds them from the global URL), and a repeated key would read differently on each side.
  - The client writes the URL only while the path is `/`, so a debounce that fires after a click on `Edit` cannot rewrite the modal URL.
- **Hand-edited URL:** `?titleContains=` (empty), a 500-character search, `?createdFrom=yesterday`, a repeated key (`?titleContains=a&titleContains=b`) or an unknown key. Each invalid or non-string value is dropped by `readTaskListFilter`, so the page still renders and never sends a request the server would reject. Unknown keys are ignored.
- **Time zones and hydration:** the server cannot know the browser's zone. The date inputs render empty on the server and in the hydration render, then show the local day (the D-14 pattern), so hydration has no mismatch. The filtered list itself depends only on ISO instants, so SSR and the client build the same query key.
- **Typing while a query runs:** the previous results stay on screen, dimmed, with `aria-busy` (`placeholderData: keepPreviousData`), instead of a "Loading tasks…" flash per keystroke. The infinite-scroll guard (`isFetching`) already stops paging during it.
- **Delete under a filter:** invalidating `task.list` by path refetches the filtered query that is on screen.
- **Feedback inside the modal:**
  - The dialog is in the top layer and the rest of the page is inert, so a toast outside it is hidden and not announced.
  - A failed save shows its code-mapped message in the form (`role="alert"`) in both modes.
  - The success toast is shown after the dialog has closed.
- **Save from the modal:** the form closes with `router.back()`, so the list URL and its filters come back. A full-page save still goes to `/` (D-29). A save refreshes every cached list query (`refetchType: 'all'`, D-29), including the other filter combinations still cached; that cost is bounded by the query cache's gcTime.
- **Closing the modal:** the close button, Escape and a click on the backdrop all call `router.back()` once. Escape is handled in `cancel` (prevented, then `router.back()`), not in `close`. Unmounting or hiding the dialog (the cleanup calls `dialog.close()`) must not trigger a second `back()`.
- **Modal on a hard load:** `/tasks/new` and `/tasks/<id>/edit` loaded directly render the full page and no dialog (`@modal/default.tsx` returns `null`).
- **Edit modal for a missing task:** it shows "This task no longer exists." inside the modal (the existing `EditTask` behavior).

## Security

| Threat                             | How this plan handles it                                                                                                                                                                        | Task and test                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Unknown or extra input keys        | `listTasksInputSchema` stays strict after `.extend`                                                                                                                                             | T1: `rejects an unknown key in the list input` (schema), `rejects an invalid creation date` (router) |
| Unbounded input / cost per request | Search ≤ 120 characters; dates are 24-character ISO strings (`precision: 3`); page size cap unchanged (50); the filter adds one pass over at most 1000 tasks (D-22)                             | T1: `rejects a search longer than 120 characters`                                                    |
| ReDoS                              | The match is `String.prototype.includes` on lower-cased strings, never a `RegExp` built from input                                                                                              | T1 (review: no `RegExp` in the repository)                                                           |
| XSS through the search or the URL  | The search is rendered only as an input `value` and goes back into the URL through `URLSearchParams`; titles stay React text                                                                    | T2: `keeps the search from the URL in the input`                                                     |
| Errors leaking internals           | No new error path: a bad filter is a Zod `BAD_REQUEST` through the existing formatter (D-25)                                                                                                    | T1: `rejects an invalid creation date`                                                               |
| Server code in client bundles      | `TaskFilters`, `Modal` and the moved `EditTask` import only `@/shared`, `@/client` and `import type` from `@/server` (D-26 ESLint block covers `src/client/**` and `src/app/**/_components/**`) | T2, T3: `pnpm lint`, `pnpm build`                                                                    |
| Secrets                            | None involved                                                                                                                                                                                   | —                                                                                                    |

## Test plan

| Requirement or review-focus line                     | Level     | Test name                                                                                                                                                                                      | Task |
| ---------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Search matches a substring, ignoring case            | unit      | `lists only tasks whose title contains the search, ignoring case`                                                                                                                              | 1    |
| `createdFrom` inclusive                              | unit      | `includes a task created exactly at createdFrom`                                                                                                                                               | 1    |
| `createdBefore` exclusive                            | unit      | `excludes a task created exactly at createdBefore`                                                                                                                                             | 1    |
| Filter + cursor                                      | unit      | `pages through filtered tasks after a position` (repository); `continues a filtered list with its cursor` (router)                                                                             | 1    |
| No filter keeps today's behavior                     | unit      | existing repository / use-case / router list tests, unchanged except the new argument                                                                                                          | 1    |
| Schema: trim, empty, length, date format, strictness | unit      | `trims the search`, `rejects an empty search`, `rejects a search longer than 120 characters`, `rejects a creation date with an offset`, `rejects an unknown key in the list input`             | 1    |
| Router validates the filter                          | unit      | `rejects an invalid creation date` (`BAD_REQUEST` with `fieldErrors.createdFrom`)                                                                                                              | 1    |
| URL → filter, dropping bad values                    | unit      | `reads a valid filter from the URL`, `drops an empty search`, `drops an invalid date`, `ignores a repeated key`, `ignores unknown keys`                                                        | 2    |
| Search writes the URL after the debounce             | component | `writes the search to the URL after the user stops typing`                                                                                                                                     | 2    |
| Blank search clears it                               | component | `removes the search from the URL when it is cleared`                                                                                                                                           | 2    |
| From/To written as local-day instants                | component | `writes the start of the From day in local time`, `writes the start of the day after To in local time`                                                                                         | 2    |
| Inputs restored from the URL                         | component | `keeps the search from the URL in the input`, `shows the From and To days from the URL`                                                                                                        | 2    |
| List reads the filter from the URL                   | component | `lists only the tasks that match the filter in the URL`                                                                                                                                        | 2    |
| Empty result under a filter                          | component | `shows that no task matches the filters`                                                                                                                                                       | 2    |
| Previous results kept while a filter loads           | component | `keeps the previous tasks while the filtered list loads`                                                                                                                                       | 2    |
| SSR of a filtered list                               | e2e       | `renders a filtered list in the server HTML`                                                                                                                                                   | 2    |
| Search as you type in the browser                    | e2e       | `searches tasks by title`                                                                                                                                                                      | 2    |
| Date range in the browser                            | e2e       | `filters tasks by creation date`                                                                                                                                                               | 2    |
| Modal renders title and content; close button        | component | `shows the title and the content in a dialog`, `goes back when Close is pressed`                                                                                                               | 3    |
| Escape and backdrop                                  | component | `goes back when Escape is pressed`, `goes back when the backdrop is clicked`                                                                                                                   | 3    |
| Form inside a modal closes it after saving           | component | `closes the modal after saving`                                                                                                                                                                | 3    |
| Form outside a modal returns to the list             | component | existing `returns to the list after saving` (TaskForm), unchanged                                                                                                                              | 3    |
| Modal flows in the browser                           | e2e       | `opens the new task form in a modal over the list`, `closes the modal with Escape`, `edits a task in a modal and keeps the search`, `shows the full page when the form URL is loaded directly` | 3    |
| Existing create/edit flows                           | e2e       | existing `task-form.spec.ts` tests, unchanged (they assert URLs, labels and toasts, which still hold)                                                                                          | 3    |

- **Levels used and why:**
  - **Unit:** the schema, the repository, the use case and the router (TDD, `CLAUDE.md`), plus the URL reader.
  - **Component:** the filter bar, the list, the modal and the form in jsdom, with the real router over `localLink`.
  - **e2e:** SSR of a filtered URL, `history.replaceState` integration with `useSearchParams`, real `showModal` and interception, none of which jsdom can show.
- **Test data:**
  - **Unit and component:** `makeTask` and `seedTasks` with fixed `createdAt` values on both sides of each edge (for example `2026-11-20T02:59:59.999Z` and `2026-11-20T03:00:00.000Z` for a São Paulo midnight).
  - **e2e:** each test creates tasks with a unique `Date.now()` title through the API and filters by that title, so the shared in-memory server does not mix tests.
- **Edge and security cases:** each "Review focus" and "Security" line maps to a row above.
- **Targets:** ≥ 90% lines and branches in `src/server/**` (enforced); no mutation testing.
- **How to run:** `pnpm test`, `pnpm test:coverage`, `pnpm test:e2e`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm build`.

## Style deviations

| Principle broken | Criterion and evidence | Alternative rejected | Review trigger | Impact on tests |
| ---------------- | ---------------------- | -------------------- | -------------- | --------------- |

None. The filters change the YAGNI line itself at the user's request; that is recorded as D-34, not a deviation. The hydration guard (`useSyncExternalStore`, D-14) appears a second time in `TaskFilters`: two copies stay below the rule of three, so it is not extracted.

---

## Task 1: filter in the `task.list` contract (back end)

**Files:**

- Modify: `src/shared/tasks/task-schemas.ts`, `src/server/domains/task/repositories/{dto,database-repository,in-memory-database-repository}.ts`, `src/server/domains/task/use-cases/list-tasks/{dto,index}.ts`, `src/server/adapters/controllers/task/index.ts`
- Test: `src/shared/tasks/task-schemas.test.ts` (create if absent; otherwise extend), `src/server/domains/task/repositories/in-memory-database-repository.test.ts`, `src/server/domains/task/use-cases/list-tasks/index.test.ts`, `src/server/adapters/controllers/task/index.test.ts`, plus the e2e `trpc-api.spec.ts` only if a list call there breaks

**Interfaces:**

- Produces (shared):
  - `taskListFilterSchema = z.strictObject({ titleContains: z.string().trim().min(1).max(TASK_TITLE_MAX_LENGTH).optional(), createdFrom: z.iso.datetime().optional(), createdBefore: z.iso.datetime().optional() })`
  - `type TaskListFilterInput = z.infer<typeof taskListFilterSchema>`
  - `listTasksInputSchema = taskListFilterSchema.extend({ cursor, limit, direction })`, with `cursor`, `limit` and `direction` as today
- Produces (domain): `interface TaskListFilter { readonly titleContains: string | null; readonly createdFrom: Date | null; readonly createdBefore: Date | null }` in `repositories/dto.ts`
  - `ListTasksInput extends TaskListFilter` (adds `cursor`, `limit`)
  - `TaskRepository.listAfter(position: TaskPosition | null, count: number, filter: TaskListFilter): Promise<Task[]>`
- Produces (tRPC): `task.list` input `{ cursor?, limit?, direction?, titleContains?, createdFrom?, createdBefore? }`; output and error codes unchanged; an invalid filter field → `BAD_REQUEST` with `fieldErrors.<field>`

- [ ] **Step 1: write the failing tests**
  - **Schema:** the names in the Test plan. `{ titleContains: '  readme ' }` parses to `'readme'`; `'   '` fails; 121 characters fail; `'2026-11-20T03:00:00-03:00'` fails; `{ foo: 1 }` fails.
  - **Repository:** three tasks titled `Write the README`, `Plan the week` and `Read me later`; the search `readme` returns only the first, because case is ignored and the space breaks "Read me". Edges: tasks at `createdFrom`, at `createdBefore` and 1 ms before it. Paging: with a filter and a position, the next `count` matching tasks come after the position, skipping non-matching ones in between.
  - **Use case:** `ListTasks` returns only matching tasks, and `nextCursor` paging continues with the filter.
  - **Router:** `task.list({ titleContains: 'readme' })`, the cursor continuation, and `task.list({ createdFrom: 'yesterday' })` rejecting with `BAD_REQUEST` and `fieldErrors.createdFrom`.
- [ ] **Step 2: run and watch them fail.** Command: `pnpm test` · Expected: FAIL (unknown keys rejected, `listAfter` ignores the filter).
- [ ] **Step 3: implement**
  - **Repository:** `InMemoryTaskRepository.listAfter` filters by position, title and range before `.slice(0, count)`, in one `.filter`. The title predicate is `snapshot.title.toLowerCase().includes(filter.titleContains.toLowerCase())`. The existing D-21 comment stays; add one line saying the repository only filters and sorts, like a `WHERE` clause (D-21, D-34).
  - **Use case:** `ListTasks` passes `{ titleContains, createdFrom, createdBefore }` to `listAfter`.
  - **Controller:** it maps an absent field to `null` and the two dates with `new Date(iso)`.
  - **Existing calls:** every current call of `listAfter` and `listTasks.execute` in tests passes the empty filter (all `null`).
- [ ] **Step 4: run and watch them pass.** `pnpm test:coverage` (server ≥ 90%), `pnpm lint`, `pnpm typecheck`.

**Done differently from the plan (execution, 2026-11-20):**

- **D-34 written here.** The README contract table, the YAGNI line of `code-style.md` and `backend.md` (`listAfter(position, count, filter)`) changed in this task too, not in Task 2: the decision is made in the change that adds the contract (`CLAUDE.md`). Task 2 adds the UI half to D-34.
- **Schema cases in the router tests.** They are checked through `createCaller` (`rejects $invalid on list`), the existing pattern for input validation, so no `task-schemas.test.ts` was added.
- **New factory.** `src/test/factories/make-task-list-filter.ts` (`makeTaskListFilter(overrides)`, all `null` by default) passes the filter in the repository and use-case tests.

**Suggested commit:** `feat(api): filter the task list by title and creation date` · files: the files above.

---

## Task 2: filter bar, filtered SSR and the list (front end)

**Files:**

- Modify:
  - `src/shared/tasks/task-list-query.ts` (replace `TASK_LIST_INPUT` with `readTaskListFilter`)
  - `src/app/page.tsx`
  - `src/app/_components/task-list/index.tsx` (`filter` prop)
- Create:
  - `src/app/_components/filtered-task-list/index.tsx` (holds the filter, renders the bar and the list)
  - `src/app/_components/task-filters/index.tsx`
- Test:
  - `src/shared/tasks/task-list-query.test.ts`
  - `src/app/_components/task-filters/index.test.tsx`
  - `src/app/_components/filtered-task-list/index.test.tsx`
  - `src/app/_components/task-list/index.test.tsx`
  - `src/client/shared/task-form/index.test.tsx` and `src/app/tasks/[id]/edit/_components/edit-task/index.test.tsx`: they render `TaskList`, which now needs `filter={{}}`
  - `e2e/list-page.spec.ts`
  - `e2e/task-form.spec.ts`: `getByLabel('Title')` becomes `getByLabel('Title', { exact: true })`, because the substring match would also find `Search by title`
- Docs:
  - `docs/DECISIONS.md`: D-34 gains its UI half.
  - `.claude/rules/backend.md`: the `task-list-query.ts` line in the layout.
  - `README.md`: how the list works.
  - `CLAUDE.md` "What this is": search and date filter.

**Interfaces:**

- Consumes: `taskListFilterSchema` and `TaskListFilterInput` (Task 1).
- Produces:
  - `readTaskListFilter(params: Record<string, string | string[] | undefined>): TaskListFilterInput` in `src/shared/tasks/task-list-query.ts`:
    - It keeps only the keys of `taskListFilterSchema` whose value is a single string that passes that key's schema.
    - It never throws.
    - URL keys are the input keys: `titleContains`, `createdFrom`, `createdBefore`.
    - Only the server calls it.
  - `FilteredTaskList({ initialFilter }: { initialFilter: TaskListFilterInput })` (client):
    - It keeps `filter` in `useState(initialFilter)` and renders `<TaskFilters filter onChange />` and `<TaskList filter />`.
    - `onChange(next)` sets the state and writes the URL.
  - `TaskFilters({ filter, onChange }: { filter: TaskListFilterInput; onChange: (filter: TaskListFilterInput) => void })` (client).
  - `TaskList({ filter }: { filter: TaskListFilterInput })`.

- [ ] **Step 1: write the failing tests** (names in the Test plan, plus the ones below)
  - **`readTaskListFilter`:**
    - `{ titleContains: ' readme ', createdFrom: '2026-11-20T03:00:00.000Z' }` returns `{ titleContains: 'readme', createdFrom: '2026-11-20T03:00:00.000Z' }`.
    - `''`, `'yesterday'`, `['a', 'b']` and `{ page: '2' }` are dropped.
  - **`TaskFilters`** (jsdom, TZ São Paulo, fake timers, `onChange` a spy):
    - Typing `readme` and advancing 300 ms calls `onChange({ titleContains: 'readme' })`, and nothing is called before 300 ms.
    - From `2026-11-20` calls it with `createdFrom: '2026-11-20T03:00:00.000Z'`.
    - To `2026-11-20` calls it with `createdBefore: '2026-11-21T03:00:00.000Z'`.
    - `removes the search when it is cleared` and `removes a date when it is cleared`: the key is absent.
    - With `filter = { titleContains: 'readme', createdFrom: '2026-11-20T03:00:00.000Z', createdBefore: '2026-11-21T03:00:00.000Z' }`, the inputs show `readme`, `2026-11-20` and `2026-11-20`.
  - **`FilteredTaskList`** (`replaceState` spied, `location` at `/`):
    - `writes the filter to the URL`: `?titleContains=readme` after the search.
    - `does not write the URL away from the list`: the path is `/tasks/new`, so there is no call.
  - **`TaskList`:**
    - `lists only the tasks that match the filter`.
    - `shows that no task matches the filters`, for a From after To. `No tasks yet.` stays for an empty unfiltered list.
    - `keeps the previous tasks while the filtered list loads`: a scripted link, with `aria-busy="true"`.
    - `refreshes the filtered list after a delete`.
  - **e2e:**
    - `renders a filtered list in the server HTML`.
    - `searches tasks by title`: the URL has `titleContains`, and a reload keeps it.
    - `filters tasks by creation date`: From `2000-01-01` shows the new task; From `2999-01-01` shows `No tasks match the filters.`. These are fixed dates, so the test computes no "today".
- [ ] **Step 2: run and watch them fail.** `pnpm test` · Expected: FAIL.
- [ ] **Step 3: implement**
  - **`page.tsx`:**
    - `HomePage` passes the `searchParams` promise to `TaskListSection`.
    - After `await io()`, the section builds `filter = readTaskListFilter(await searchParams)` and prefetches `infiniteQueryOptions(filter, …)`.
    - It renders `<FilteredTaskList initialFilter={filter} />` inside the `HydrationBoundary`.
  - **`FilteredTaskList`:**
    - It writes the URL with `window.history.replaceState(null, '', query === '' ? '/' : `?${query}`)`, only when `window.location.pathname === '/'` (one-line comment: the modal routes keep this page mounted).
    - It never reads the URL back.
  - **`TaskList`:**
    - Query input: `filter`, with `placeholderData: keepPreviousData`.
    - `aria-busy={list.isPlaceholderData}` on the section, and `opacity-60` on the `<ul>` while it shows placeholder data.
    - The empty state is `No tasks match the filters.` when `filter` has a key, otherwise `No tasks yet.`.
  - **`TaskFilters`:**
    - Fields labelled `Search by title` (`type="search"`), `Created from` and `Created to` (`type="date"`), with local state for the three fields.
    - The search calls `onChange` from an effect with a 300 ms `setTimeout` (`SEARCH_DEBOUNCE_MS`); dates call it on change.
    - Day ↔ instant:
      - From → `new Date(y, m - 1, d).toISOString()`;
      - To → the same for `d + 1` (calendar arithmetic, so a 23- or 25-hour day is still one day);
      - back to a day: the local `YYYY-MM-DD` of `createdFrom`, and of `createdBefore` minus 1 ms.
    - The date inputs show their value only after hydration (the `useSyncExternalStore` guard of D-14).
    - `Created from` has `max` = To and `Created to` has `min` = From.
  - **Docs:** D-34 gains:
    - URL keys, local-day semantics, the server-read-once rule and the `/` guard;
    - `keepPreviousData`;
    - alternatives rejected: `router.replace` (a server round trip per keystroke), and reading the URL on the client (wrong under the modal).
- [ ] **Step 4: run and watch them pass.** `pnpm test`, `pnpm test:e2e`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm build` (`/` still `◐`).

**Done differently from the plan (execution, 2026-11-20):**

- **User requests during the task:**
  - The heading, `New task` and the filters form one sticky block. `FilteredTaskList` renders it; the page passes the heading as `header` and also shows it in the `Suspense` fallback.
  - A `Clear filters` button, always visible and disabled when there is nothing to clear.
  - Tests: `clears every filter at once`, `clears a search that is still being typed`, `disables Clear when there is no filter`, `shows the header above the filters`; e2e `clears the filters` and `keeps the header and the filters on screen while scrolling` (checked to fail without `sticky`).
- **`TaskFilters` tests type with `fireEvent.change`.** With pure fake timers, `user-event` hangs on Testing Library's `setTimeout(0)` wait; `shouldAdvanceTime` would make the "not before 300 ms" test depend on real time.
- **Added tests:**
  - `keeps the dates when the search changes` (a mutant dropped the other filters);
  - e2e `does not request task.list on first load of a filtered URL`;
  - e2e `loads a URL with a date range without console errors`, in `Asia/Tokyo`, for date hydration across zones.
- **`readTaskListFilter`** returns the three keys with `undefined` for a dropped value, not a smaller object. The query key and the URL ignore `undefined`.
- **`server.test.ts`** used the removed `TASK_LIST_INPUT`; it now prefetches with `{}`.

**Suggested commit:** `feat(web): search tasks by title and filter by creation date` · files: the files above.

---

## Task 3: create and edit in a modal

**Files:**

- Create:
  - `src/client/shared/modal/index.tsx` and `index.test.tsx`
  - `src/test/dialog.ts` (fake `showModal`/`close` for jsdom, installed in `src/test/setup-dom.ts`)
  - `src/app/@modal/default.tsx`
  - `src/app/@modal/(.)tasks/new/page.tsx`
  - `src/app/@modal/(.)tasks/[id]/edit/page.tsx`
- Move: `src/app/tasks/[id]/edit/_components/edit-task/` → `src/client/shared/edit-task/` (two routes use it now, D-32), with its test
- Modify:
  - `src/app/layout.tsx` (render the `modal` slot)
  - `src/app/tasks/[id]/edit/page.tsx` (import path)
  - `src/client/shared/task-form/index.tsx` and `index.test.tsx`
  - `e2e/task-form.spec.ts`
- Docs:
  - `docs/DECISIONS.md`: D-35; D-29 "Superseded in part by D-35" (failure feedback inline, post-save navigation); D-32 (the `edit-task` location).
  - `.claude/rules/tests.md`: the `next/navigation` mock also returns `back`; `src/test/dialog.ts` joins the helper list.
  - `README.md`.

**Interfaces:**

- Produces:
  - `Modal({ title, children }: { title: string; children: ReactNode })` (client).
  - `useCloseModal(): ((afterClose: () => void) => void) | null`:
    - It is `null` outside a modal.
    - Inside one, it calls `router.back()` and runs `afterClose` in the dialog's effect cleanup, after `dialog.close()`, so the page is no longer inert when it runs.
- Consumes: `TaskForm`, `EditTask` (moved, same props).

- [ ] **Step 1: write the failing tests**
  - **`Modal`** (`next/navigation` mocked, `back` a spy):
    - `shows the title and the content in a dialog`.
    - `goes back when Close is pressed`: one call.
    - `goes back when Escape is pressed`: the `cancel` event, prevented.
    - `goes back when the backdrop is clicked`: a click on the dialog element.
    - `stays open when the content is clicked`: the click is on the inner wrapper, which holds the padding, since the dialog itself is `p-0`.
    - `does not go back when it unmounts`.
    - `runs the after-close callback once the dialog has closed`.
  - **`TaskForm`:**
    - `closes the modal after saving`, then shows `Task created.` after the unmount.
    - `shows a failed save in the form`: `role="alert"` with the mapped text, in both modes, replacing the error toast of D-29.
    - Existing `push('/')` outside a modal: unchanged.
  - **e2e:**
    - `opens the new task form in a modal over the list`.
    - `closes the modal with Escape`.
    - `edits a task in a modal and keeps the search`: while the modal is open, the list behind it still shows only the filtered tasks. After the save, the URL is `/?titleContains=<unique>`, `Task saved.` shows and the new title is listed.
    - `shows the full page when the form URL is loaded directly`.
- [ ] **Step 2: run and watch them fail.** `pnpm test` · Expected: FAIL.
- [ ] **Step 3: implement**
  - **`Modal`:**
    - A `<dialog aria-labelledby className="p-0 …">` holds an inner padded wrapper with the `h2`, `Close` and `children`, inside the context provider.
    - An effect calls `showModal()`. Its cleanup calls `close()`, then the stored `afterClose`.
    - `onCancel` calls `preventDefault()` and then `router.back()`. There is no `onClose`, so the cleanup never navigates (one-line comment).
    - The backdrop check is `event.target === event.currentTarget`.
  - **Slot and routes:**
    - `@modal/default.tsx` returns `null`.
    - `(.)tasks/new/page.tsx` renders `<Modal title="New task"><TaskForm /></Modal>`.
    - `(.)tasks/[id]/edit/page.tsx` renders `<Modal title="Edit task">` with the same `Suspense` + `params.then` + `EditTask` as the full page. Its props type is checked by `pnpm typecheck` after `next typegen`.
    - The layout renders `{children}{modal}`.
  - **`TaskForm`:**
    - Success:
      - in a modal: `closeModal(() => { showToast('success', text); })`;
      - otherwise: `showToast` + `router.push('/')`.
    - Failure: the mapped message in a `role="alert"` paragraph above `Save`, cleared on the next submit.
    - The `refetchType: 'all'` comment becomes true for both modes: "the list may be off screen (full page) or behind the modal".
  - **Docs:** D-35 records:
    - the pattern and why;
    - top-layer feedback (inline error, toast after close);
    - Escape and `cancel`;
    - the jsdom fake;
    - the alternative rejected: a state-only `<dialog>` with no route.
- [ ] **Step 4: run and watch them pass.** `pnpm test`, `pnpm test:e2e`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm build`. Set this plan's status to "Done".

**Suggested commit:** `feat(web): open the task form in a modal over the list` · files: the files above.

---

## Review

| #   | Finding                                                                                              | Source        | Accepted? | Reason                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------- | ------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | With the modal open, `useSearchParams` returns the modal URL, so the list behind it loses its filter | plan-reviewer | Yes       | Checked in `next/dist/client/components/app-router.js` (search params come from the global `canonicalUrl`). The server reads the filter once and passes it as a prop; the client only writes the URL                                                                 |
| 2   | A repeated URL key reads differently on the server and on the client                                 | plan-reviewer | Yes       | It is fixed by #1: one reader, on the server                                                                                                                                                                                                                         |
| 3   | Save errors in the modal are hidden behind it (top layer, inert page)                                | plan-reviewer | Yes       | A failure shows inline in the form; the success toast runs after the dialog closes                                                                                                                                                                                   |
| 4   | Task 2 breaks the form and edit-task component tests (they render `TaskList`)                        | plan-reviewer | Yes       | Both files are listed; they pass `filter={{}}`                                                                                                                                                                                                                       |
| 5   | `getByLabel('Title')` in e2e also matches `Search by title`                                          | plan-reviewer | Yes       | Changed to `{ exact: true }` in Task 2                                                                                                                                                                                                                               |
| 6   | Review-focus lines without a test                                                                    | plan-reviewer | Partly    | Added: From after To, delete under a filter, clearing a date, the date range through the router (done in Task 1). Not added: the missing task in the edit modal (the same `EditTask`, already tested). Accents: the user chose to ignore them; tests added in Task 1 |
| 7   | `z.iso.datetime()` accepts any number of fractional digits                                           | plan-reviewer | Yes       | Checked (`zod/v4/core/regexes.js`). Uses `precision: 3`, with a router test; done in Task 1                                                                                                                                                                          |
| 8   | The To day shown can be off by one around daylight saving                                            | plan-reviewer | Yes       | Calendar arithmetic for `d + 1`, and 1 ms back for display                                                                                                                                                                                                           |
| 9   | A click on the dialog padding closes it                                                              | plan-reviewer | Yes       | The dialog is `p-0` with an inner padded wrapper, plus a test                                                                                                                                                                                                        |
| 10  | Rules docs and the TaskForm comment go stale                                                         | plan-reviewer | Yes       | `backend.md` `listAfter` was done in Task 1; the `task-list-query.ts` line is in Task 2, `tests.md` and the comment in Task 3                                                                                                                                        |
| 11  | The debounce can rewrite the modal URL                                                               | plan-reviewer | Yes       | The URL is written only while the path is `/`, plus a test                                                                                                                                                                                                           |
| 12  | An e2e "today" could flake at midnight                                                               | plan-reviewer | Yes       | Uses fixed dates (2000-01-01, 2999-01-01)                                                                                                                                                                                                                            |
