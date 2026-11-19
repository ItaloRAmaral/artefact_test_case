# Plan: infinite scroll and final documentation (sub-plan 6)

| Field   | Value                                                                                                                                                                                                                                                                       |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status  | Approved                                                                                                                                                                                                                                                                    |
| Date    | 2026-11-19                                                                                                                                                                                                                                                                  |
| Request | "pode seguir para o sub-plano 6": infinite scroll and the final documentation of the roadmap                                                                                                                                                                                |
| Context | [Roadmap](2026-11-19-roadmap.md) sub-plan 6 and its "e2e state shared by parallel workers" risk; [`docs/DECISIONS.md`](../DECISIONS.md) D-10, D-12, D-20, D-21, D-25, D-27, D-28; plans of sub-plans 4 and 5; `docs/SPEC.md` §4 (Infinite Scroll; Comentários/Documentação) |
| Roadmap | [2026-11-19-roadmap.md](2026-11-19-roadmap.md), sub-plan 6                                                                                                                                                                                                                  |

**Goal:** the list loads the next page when the user scrolls near its end, shows `Loading more tasks…` while it loads, shows the error with a `Retry` button when a page fails, and says `No more tasks.` after the last page; the README explains how the system works, `DECISIONS.md` is complete and the main decisions have their comments.

**Architecture:** `TaskList` already reads `task.list` as an infinite query (sub-plan 4). It gains a sentinel element after the list, watched by an `IntersectionObserver` created in a `useEffect` while another page can be loaded; the observer calls `fetchNextPage()`. Component tests replace the browser's `IntersectionObserver` (absent from jsdom) with a small fake in `src/test/`. The e2e suite runs on one worker, because its tests share one in-memory server and look for their tasks on the first page.

## Global constraints

- Contract (D-15, D-20, D-21, D-25): `task.list` `{ cursor?, limit?, direction? }` → `{ items, nextCursor }`, newest first, 10 per page by default; `getNextTaskListCursor` (`src/shared/tasks/task-list-query.ts`) returns `nextCursor`, so `hasNextPage` is `false` after the last page. A position cursor does not skip or repeat tasks created or deleted between pages (D-10).
- Trigger: a `<div ref={sentinelRef} />` after the `<ul>`; `new IntersectionObserver(callback, { rootMargin: '200px' })` (a proposal: start loading 200 px before the end), observing it only while `hasNextPage && !isFetching && !isFetchNextPageError`; the callback calls `void fetchNextPage()` when an entry is intersecting; the effect disconnects on cleanup. Why `!isFetching` and not only `!isFetchingNextPage`: `fetchNextPage()` cancels a running fetch by default (`cancelRefetch: true`, `query-core` `queryObserver.ts`, `query.ts`), and a list refetch (after a delete or a save, or on window focus) sets `isFetching` but not `isFetchingNextPage` (`infiniteQueryObserver.ts`: only a forward fetch does). Reaching the end during a refetch would cancel it and leave a deleted task on screen. A real observer reports the current state when it starts observing, so when the fetch ends with the sentinel still on screen, the next page loads.
- Failure: while `isFetchNextPageError && !isFetchingNextPage`, `<p role="alert">{getErrorMessage(list.error)}</p>` and `<button type="button">Retry</button>`, which calls `fetchNextPage()`. During the retry the query keeps its error (`fetchState` resets it only without data), so both are hidden while `isFetchingNextPage` and `Loading more tasks…` shows instead: no double request from a second click. The observer stays off while the error shows, so scrolling does not retry by itself. The loaded tasks stay (`isLoadingError` is `false` once data exists, sub-plan 4).
- States (UI text, English; proposals of this plan except the end text, a user decision): `Loading more tasks…` while `isFetchingNextPage`; `No more tasks.` when `!hasNextPage` and more than one page is loaded (`list.data.pages.length > 1`).
- Screen height: when the first page does not fill the screen (sentinel within 200 px of the viewport), the next page loads right after hydration. D-27's "no `task.list` request on first load" holds when the first page fills the screen; D-31 and the README say so.
- `CLAUDE.md` hard rules: no client import of server values; texts by code (`getErrorMessage`, D-07); task text rendered as text.

## Decisions with the user

| Question                        | Answer                                                                                                       | Date       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------- |
| Trigger for the next page       | Only the scroll (a sentinel and `IntersectionObserver`); no `Load more` button; `Retry` only after a failure | 2026-11-19 |
| Feedback at the end of the list | `No more tasks.` after the last page, when more than one page is loaded                                      | 2026-11-19 |

## Review focus

- **More tasks than one page** → reaching the end loads the next page and appends it; the first page's tasks stay.
- **Next page loading** → `Loading more tasks…` shows; reaching the end again starts no second request.
- **Reaching the end during a list refetch** (after a delete, a save or a window focus) → no page request until the refetch ends, so the refetch is not cancelled.
- **Next page fails** (network down) → the error and `Retry` show, the loaded tasks stay, reaching the end again does not retry.
- **Retry** → loads the page; while it loads, the error and `Retry` are hidden and `Loading more tasks…` shows.
- **Last page loaded** → `No more tasks.`; reaching the end again sends no request.
- **Exactly one page** (10 or fewer tasks) → no `No more tasks.`, no request when the end is reached.
- **Empty list** → `No tasks yet.` as before; no sentinel is observed.
- **A delete or a save after loading two pages** → the list refetches both pages (existing invalidation, TanStack Query's infinite refetch); not retested.
- **Parallel e2e tests** → serial run, so a test that creates 11 tasks cannot push another test's task off the first page.

## Security

| Threat                                          | How this plan handles it                                                                                               | Task and test                                                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Unbounded page requests                         | the page size stays capped by the schema (D-20); one request at a time, none while a fetch runs or after the last page | Task 1, `does not request the same page twice while it loads`, `does not request another page after the last one` |
| Internal details in errors                      | the next-page error shows only `getErrorMessage` text                                                                  | Task 1, `shows an error with a retry when the next page fails`                                                    |
| XSS, mass assignment, server code in the bundle | unchanged: no new input, task text rendered as text, the ESLint block on `src/client/**`                               | existing tests; `pnpm lint`                                                                                       |

## Test plan

| Requirement or review-focus line | Level     | Test name                                                  | Task |
| -------------------------------- | --------- | ---------------------------------------------------------- | ---- |
| Next page on reaching the end    | component | `loads the next page when the end of the list is reached`  | 1    |
| Loading indicator                | component | `shows a loading indicator while the next page loads`      | 1    |
| One request at a time            | component | `does not request the same page twice while it loads`      | 1    |
| Refetch not cancelled            | component | `waits for a running refresh before loading the next page` | 1    |
| Failed page with retry           | component | `shows an error with a retry when the next page fails`     | 1    |
| No retry on scroll               | component | `does not retry a failed page on scroll`                   | 1    |
| Retry loads the page             | component | `loads the failed page again on retry`                     | 1    |
| Retry state                      | component | `hides the error while the page loads again`               | 1    |
| End of the list                  | component | `shows the end of the list after the last page`            | 1    |
| No request after the last page   | component | `does not request another page after the last one`         | 1    |
| One page only                    | component | `does not request a page when everything fits in one`      | 1    |
| Scrolling across the stack       | e2e       | `loads more tasks when scrolling to the end`               | 2    |

- **Levels used and why:** component (Vitest + Testing Library + jsdom, the real providers with `localLink`) for the trigger and the states, with a fake `IntersectionObserver` that the test fires (`revealListEnd()`): the observer is a browser API at the system boundary, like time and the network; e2e (Playwright, production build) for real scrolling against the server-rendered first page. No unit level: the cursor and the page size are tested in sub-plans 2 and 3.
- **Test data:** `seedTasks(repository, 11)` (ids `task-1`…`task-11`, one minute apart, all titled `Write the README`), so the first page has 10 items and the second 1; items are counted with `getAllByRole('listitem')`. e2e creates 11 tasks through the API with a unique title prefix.
- **Edge and security cases:** every "Review focus" and "Security" line maps to a row above, except the refetch of loaded pages, which is TanStack Query's behavior.
- **Targets:** 90% lines and branches on `src/server/**` (no server change; stays at 100%); every branch of the new client code has a test.
- **How to run:** `pnpm test`, `pnpm test:coverage`, `pnpm test:e2e`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`.

## Style deviations

| Principle broken | Criterion and evidence | Alternative rejected | Review trigger | Impact on tests |
| ---------------- | ---------------------- | -------------------- | -------------- | --------------- |

None: the observer lives in `TaskList`, its one caller (no hook extracted for a single use), and no library is added for it.

---

## Task 1: load the next page on scroll

**Files:**

- Create: `src/test/intersection-observer.ts`
- Modify: `src/client/tasks/task-list.tsx`, `src/client/tasks/task-list.test.tsx`, `src/test/setup-dom.ts`, `src/test/trpc-links.ts`

**Interfaces:**

- Consumes: `TaskList`, `renderWithTrpc` (returns `queryClient`), `routerLink`, `failingLink`, `pendingRefreshLink` (sub-plans 4 and 5); `seedTasks`.
- Produces:
  - `intersection-observer.ts`: `class FakeIntersectionObserver implements IntersectionObserver` with every member of the DOM interface (`root = null`, `rootMargin`, `scrollMargin`, `thresholds`, `observe`, `unobserve`, `disconnect`, `takeRecords`), keeping its callback, its observed elements and the live instances in a module `Set` (removed on `disconnect`); `revealListEnd(): void` calls, inside `act`, each live observer's callback with one entry per observed element (`{ isIntersecting: true, target }` with an `as IntersectionObserverEntry` and a comment: `TaskList` reads only those two fields). It never fires on `observe`, so a test decides when the end is reached.
  - `setup-dom.ts`: `globalThis.IntersectionObserver = FakeIntersectionObserver` (jsdom has none).
  - `trpc-links.ts`: `scriptedListLink(repository, script: readonly ('serve' | 'fail' | 'hang')[])`: the n-th `task.list` call follows `script[n - 1]` (`'fail'` like `failingLink`, `'hang'` never settles), calls beyond the script and every other procedure go through `routerLink`; `countingLink(link): { link: TRPCLink<AppRouter>; listCallCount: () => number }` wraps any link and counts `task.list` calls.
  - `TaskList`: the sentinel, the effect and the states in "Global constraints", rendered after the `<ul>` in the list branch only, with a why-comment on the observer condition (DECISIONS D-31).

- [x] **Step 1: write the failing tests** in `task-list.test.tsx`, each with `seedTasks(repository, 11)` and the first page awaited (10 list items) in the Arrange unless stated:
  - `loads the next page when the end of the list is reached`: `revealListEnd()` → 11 list items.
  - `shows a loading indicator while the next page loads`: `pendingRefreshLink(repository)`; `revealListEnd()` → `Loading more tasks…`.
  - `does not request the same page twice while it loads`: `countingLink(pendingRefreshLink(repository))`; `revealListEnd()` (Arrange); `revealListEnd()` → `listCallCount()` is 2.
  - `waits for a running refresh before loading the next page`: `countingLink(pendingRefreshLink(repository))`; start a refetch without awaiting it (`act(() => { void queryClient.invalidateQueries(); })`, Arrange: call 2 never settles); `revealListEnd()` → `listCallCount()` is 2.
  - `shows an error with a retry when the next page fails`: `scriptedListLink(repository, ['serve', 'fail'])`; `revealListEnd()` → text `Something went wrong. Check your connection and try again.` with `role="alert"` (found by text: the toast's empty `alert` region is always present), a `Retry` button, still 10 list items.
  - `does not retry a failed page on scroll`: `countingLink(scriptedListLink(repository, ['serve', 'fail']))`; `revealListEnd()` and the error shown (Arrange); `revealListEnd()` → `listCallCount()` is 2, the error still shown.
  - `loads the failed page again on retry`: `scriptedListLink(repository, ['serve', 'fail'])`; error shown (Arrange); click `Retry` → 11 list items, no `Retry` button.
  - `hides the error while the page loads again`: `scriptedListLink(repository, ['serve', 'fail', 'hang'])`; error shown (Arrange); click `Retry` → `Loading more tasks…`, no `Retry` button, no error text.
  - `shows the end of the list after the last page`: `revealListEnd()` → `No more tasks.`.
  - `does not request another page after the last one`: `countingLink(routerLink(repository))`; `revealListEnd()` and 11 items (Arrange); `revealListEnd()` → `listCallCount()` is 2.
  - `does not request a page when everything fits in one`: `seedTasks(repository, 10)`, `countingLink(routerLink(repository))`; `revealListEnd()` → `listCallCount()` is 1, no `No more tasks.`.
- [x] **Step 2:** run and watch them fail (no request on `revealListEnd`, no indicator, no `Retry`), implement, run and watch them pass; every existing test passes. Sabotage checks, each must fail a test: the observer condition without `!isFetching` (only `!isFetchingNextPage`) fails `waits for a running refresh…`; without `!isFetchNextPageError` fails `does not retry a failed page on scroll`; the error shown during `isFetchingNextPage` fails `hides the error…`. `pnpm lint`, `pnpm typecheck` green.

**Execution notes (2026-11-19):**

- As built, the fake exposes `FakeIntersectionObserver.revealAll()` (a static method) instead of a loose `revealListEnd()` function: `code-style.md` keeps loose functions out of a file with a class. The live observers are a private static `Set`.
- Red: 9 of the 11 tests failed (nothing happened on `revealAll()`: no 11th item, no `Loading more tasks…`, no `Retry`, no `No more tasks.`). `waits for a running refresh before loading the next page` and `does not request a page when everything fits in one` passed before the code, as they must with no observer at all; the sabotage checks below prove them.
- `waits for a running refresh…` first got 3 calls instead of 2 with the real code: a synchronous `act` returns before TanStack Query's microtask tells React the refetch started, so the observer was still on. The Arrange starts the refetch inside an async `act` (`act(() => { void queryClient.invalidateQueries(); return Promise.resolve(); })`).
- Sabotage checks: only `!isFetchingNextPage` in the observer condition fails `waits for a running refresh…`; without `!isFetchNextPageError`, `does not retry a failed page on scroll` fails; with the error shown during the retry, `hides the error while the page loads again` fails. Without `hasNextPage`, every test passes: with no next cursor TanStack Query returns the data without a request, so a request count cannot see it. The guard stays: a real `IntersectionObserver` reports on `observe`, so after the last page, with the sentinel on screen, each request-less `fetchNextPage` would toggle `isFetching`, recreate the observer and fire again, in a loop the fake (which never fires on `observe`) cannot reproduce.
- Result: 184 tests (59 in the components project), no `act` warnings; coverage on `src/server/**` 100%; `pnpm lint`, `pnpm typecheck`, `pnpm format:check` exit 0; the 13 e2e tests still pass with the default viewport.

**Suggested commit:** `feat(web): load the next page of tasks on scroll` · files: the list above

## Task 2: serial e2e and the scroll flow

**Files:**

- Modify: `playwright.config.ts`, `e2e/list-page.spec.ts`

**Interfaces:**

- Consumes: Task 1.
- Produces:
  - `playwright.config.ts`: `workers: 1`, with a why-comment (the tests share one in-memory server and look for their tasks on the first page; a parallel test creating tasks could push them to the second; roadmap risk "e2e state shared by parallel workers").
  - `e2e/list-page.spec.ts`: `test.use({ viewport: { width: 1280, height: 400 } })` at the top of the file, with a comment (ten unstyled tasks are taller than 400 px plus the 200 px margin, so the first page fills the screen: the first-load test sees no `task.list` request and the scroll test needs the scroll); a local helper `createTasks(request, prefix, count)` that posts `${prefix} ${n}` titles through the API.

- [ ] **Step 1: write the test** `loads more tasks when scrolling to the end`: create 11 tasks with a unique prefix (Arrange), `page.goto('/')`; Act `page.keyboard.press('End')`; Assert headings matching the prefix have count 11.
- [ ] **Step 2:** sabotage check: with the sentinel removed from `TaskList`, it fails (10 headings); restore, run the whole e2e suite with `workers: 1` and watch it pass, `does not request task.list on first load` included.

**Suggested commit:** `test(e2e): run serially and cover scrolling through the list` · files: the list above

## Task 3: final documentation

**Files:**

- Modify: `README.md`, `docs/DECISIONS.md`, `.claude/rules/tests.md`, `.claude/skills/writing-tests/references/writing.md`, `CLAUDE.md`, `docs/plans/2026-11-19-roadmap.md`, this plan

**Interfaces:** none (prose only).

- [ ] **Step 1: README.** Remove the "Work in progress" note. Add "How it works" after the intro: the back end (hexagonal layers: `domains/task` with the entity, the repository contract and the use cases; `adapters/` with tRPC; the in-memory store shared on `globalThis`, D-05, D-30); the request path (form or list → tRPC client → `/api/trpc` → controller → use case → entity and repository → output object; domain error codes → tRPC codes → UI texts, D-07, D-25); the pages (`/` server-rendered and hydrated, with infinite scroll; `/tasks/new`, `/tasks/[id]/edit`); where the code lives (`src/server`, `src/shared`, `src/client`, `src/app`). "API": the schemas are reused by the form (not "will reuse"). "List page" gains the infinite scroll in one sentence, and that a screen taller than the first page loads the second right away. "Test" says the e2e tests run on one worker and why.
- [ ] **Step 2: DECISIONS.** **D-31** infinite scroll UI: the sentinel with `IntersectionObserver` and `rootMargin: '200px'`, observing only while no fetch runs (the `cancelRefetch` reason), no `Load more` button (user decision), no automatic retry while a page error shows, `Retry` hidden while it loads, `No more tasks.` (user decision), a screen taller than the first page loading the second right away, the fake observer in component tests, the serial e2e run with a short viewport on the list tests. Index row for D-31; "Open decisions" stays "None open".
- [ ] **Step 3: rules and project guide.** `tests.md` and the `writing-tests` reference: `IntersectionObserver` is faked in component tests (`src/test/intersection-observer.ts`, a browser API jsdom lacks); e2e tests run serially. `CLAUDE.md`: the stack rows drop their "(sub-plan N)" notes that are now history, and "Tests → Levels" lists the component level as the list, the form and the edit page.
- [ ] **Step 4: comments audit.** Confirm each main decision has its why-comment where it lives (today: D-05/D-30 `tasks-module.ts`, D-07/D-25 `init.ts` and `handler.ts`, D-21 `task-cursor.ts`, D-20/D-21 `task-limits.ts`, D-14/D-27 `task-date.tsx`, `page.tsx`, `query-client.ts`, `provider.tsx`, D-29 `toast.tsx`, `task-form.tsx`, `edit-task.tsx`; D-31 `task-list.tsx` and `playwright.config.ts` from Tasks 1 and 2) and every `DECISIONS D-NN` cited in a comment exists in `docs/DECISIONS.md`: `grep -rn "DECISIONS D-" src playwright.config.ts` against the index.
- [ ] **Step 5: close.** Roadmap: sub-plan 6 Done, roadmap status Done, the risk "e2e state shared by parallel workers" closed (serial run, D-31). This plan: Done. `pnpm format:check` green.

**Suggested commit:** `docs: describe how the system works and close the roadmap` · files: the list above

---

## Review

| #   | Finding                                                                                                     | Source                       | Accepted? | Reason                                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------- | ---------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The observer can cancel a running list refetch (`fetchNextPage` defaults to `cancelRefetch: true`)          | plan-reviewer (error 1)      | Yes       | confirmed in `query-core` `queryObserver.ts`, `query.ts`, `infiniteQueryObserver.ts`; the condition uses `!isFetching`; test `waits for a running refresh…` |
| 2   | `Retry`, the error and the loading text all show during a retry; a second click restarts the request        | plan-reviewer (error 2)      | Yes       | confirmed in `fetchState`; error and `Retry` hidden while `isFetchingNextPage`; test `hides the error while the page loads again`                           |
| 3   | Two review-focus lines had no test; the `!isFetchNextPageError` sabotage could not fail                     | plan-reviewer (error 3)      | Yes       | tests `does not retry a failed page on scroll` and `does not request the same page twice while it loads`; `countingLink` wraps any link                     |
| 4   | The fake observer would not type-check as "the parts `TaskList` uses"                                       | plan-reviewer (suggestion 1) | Yes       | it implements every member of the DOM interface; the entries use a commented `as`                                                                           |
| 5   | The e2e scroll test may not need the scroll, and 11 more tasks can break the first-load test                | plan-reviewer (suggestion 2) | Yes       | a 400 px viewport for the list tests; README and D-31 say a taller screen loads page 2 right away                                                           |
| 6   | README says the form "will reuse" the schemas                                                               | plan-reviewer (suggestion 3) | Yes       | fixed in Task 3, Step 1                                                                                                                                     |
| 7   | `rootMargin: '200px'`, the texts `Loading more tasks…` and `Retry`, and no retry on scroll are plan choices | plan-reviewer (assumptions)  | Asked     | listed for the user at hand-over                                                                                                                            |
