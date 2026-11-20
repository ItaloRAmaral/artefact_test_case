# Plan: front-end folders and styling

| Field   | Value                                                                                                                                                                                                                                                                                                                       |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status  | Proposed                                                                                                                                                                                                                                                                                                                    |
| Date    | 2026-11-20                                                                                                                                                                                                                                                                                                                  |
| Request | "não tem CSS NENHUM né? Fora a arquitetura de pastas do front que está uma bagunça. Se é componente compartilhado [...] renomeie para Shared e dentro dela uma pasta para cada componente. Se o componente é só de uma página específica, crie uma pasta componente dentro da página [...]. Para o CSS vamos usar tailwind" |
| Context | `docs/SPEC.md` §3 ("layout simples, não é necessário um design elaborado"); `docs/DECISIONS.md` D-19, D-26, D-28; Next.js 16.4.6 docs `01-getting-started/02-project-structure.md` (private folders) and `11-css.md` (Tailwind CSS)                                                                                         |

**Goal:** client components live next to the page that uses them (`_components/<name>/`) or in `src/client/shared/<name>/` when more than one page uses them, and every page has a simple, consistent look styled with Tailwind CSS.

**Architecture:** Task 1 only moves files and fixes imports (no behavior change; every test passes as is). Task 2 adds Tailwind as the Next.js docs show (`tailwindcss` and `@tailwindcss/postcss` as dev dependencies, a PostCSS config, `src/app/globals.css` imported by the root layout) and adds utility classes to the existing markup; text, roles and structure stay, so the tests stay.

## Global constraints

- Folder rules (user decisions): a component used by one page lives in that route's `_components/<name>/` (Next.js private folder: `_folder` is not routable, `02-project-structure.md`); a component or client module used by more than one page lives in `src/client/shared/<name>/`. Each folder holds `index.tsx` (or `index.ts`), its tests (`index.test.tsx`, `index.server.test.ts`) and its `dto.ts` when it has one. `src/client/trpc/provider.tsx` stays.
- Target tree (approved by the user):
  - `src/app/_components/task-list/` (from `src/client/tasks/task-list.tsx` and its test), `src/app/_components/task-date/` (from `task-date.tsx`, `task-date.test.tsx`, `task-date.server.test.ts`): used only by `/`.
  - `src/app/tasks/[id]/edit/_components/edit-task/` (from `edit-task.tsx` and its test): used only by the edit page.
  - `src/client/shared/task-form/` (from `task-form.tsx` and its test: `/tasks/new` and the edit page), `src/client/shared/toast/` (from `toast.tsx` and `dto.ts`: the layout, the list, the form), `src/client/shared/error-message/` (from `error-message.ts` and its test: the list, the form, the edit page).
- Imports follow `code-style.md`: relative only within the folder or to its parent's children (`../task-date`), `@/` otherwise (`@/client/shared/toast`, `@/app/_components/task-list`).
- D-26 still holds: the ESLint block that keeps client code to `import type` from `@/server/*` covers `src/client/**` and now also `src/app/**/_components/**` (tests excepted).
- Styling: Tailwind CSS 4.3.5 (`tailwindcss`, `@tailwindcss/postcss`, pinned exactly, dev dependencies; the newest release at least 7 days old on 2026-11-20, D-19). No component library (user decision: Tailwind only, no shadcn). Dark mode follows the system (`dark:` variants, Tailwind's default `prefers-color-scheme`).
- Visual design (proposals of this plan; the spec asks for a simple layout): a centered column (`max-w-2xl`, padding), the page heading with the `New task` link styled as a primary button; each task as a bordered, rounded card with the title in semibold, the description and the date in muted text, and `Edit` (secondary) and `Delete` (danger) actions; the form with stacked labels, full-width fields, a focus ring, field errors in red under the field, and `Save` as a primary button with a disabled style; status texts (`Loading…`, `No tasks yet.`, `No more tasks.`) in muted text; errors in red; the toast as a rounded, shadowed box at the bottom right, green-bordered for success and red-bordered for errors, replacing its inline `style`. Every interactive element keeps a visible focus style.
- Unchanged: all UI text, roles, labels and the DOM order the tests use; the e2e list viewport comment (`list-page.spec.ts`) changes from "unstyled tasks" to "tasks", and its assumption (ten tasks taller than 600 px) is checked again.

## Decisions with the user

| Question                           | Answer                                                                                                                                                     | Date       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Styling                            | Tailwind CSS only, no shadcn                                                                                                                               | 2026-11-20 |
| Folder for a page's own components | `_components` (the Next.js private folder convention)                                                                                                      | 2026-11-20 |
| Folder tree                        | The target tree above: page components under the route's `_components/`, shared ones under `src/client/shared/<name>/`, one folder per component or module | 2026-11-20 |

## Review focus

- **A moved module imported by its old path** → `pnpm typecheck` and `pnpm lint` fail; none may remain.
- **A client component under `src/app/**/_components/` importing a server value** → the extended ESLint block rejects it.
- **A `_components` folder becoming a route** → `pnpm build` lists only `/`, `/tasks/new`, `/tasks/[id]/edit` and `/api/trpc/[trpc]`.
- **Styles missing in production** → the e2e suite runs on the production build; the screenshots (Task 2) are taken from it.
- **Taller list items** → the 400 px e2e viewport must still need a scroll: the no-`End` sabotage of `loads more tasks when scrolling to the end` still fails.
- **Dark mode and focus** → readable text and a visible focus ring in both color schemes (screenshots).

## Security

| Threat                           | How this plan handles it                                                                                     | Task and test                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Server code in the client bundle | the D-26 ESLint block extended to `src/app/**/_components/**`; checked with the ESLint API, as in sub-plan 4 | Task 1, ESLint check, `pnpm build` |
| XSS                              | unchanged: task text still rendered as text; classes are static strings                                      | existing tests                     |
| Supply chain                     | two dev dependencies, pinned, at least 7 days old (D-19)                                                     | Task 2, `pnpm install` output      |

## Test plan

| Requirement or review-focus line | Level                | Test or check                                                                                                                                                                    | Task |
| -------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Behavior unchanged by the move   | unit, component, e2e | every existing test, unchanged except import paths                                                                                                                               | 1    |
| Client rule on `_components`     | lint                 | ESLint API check: a value import from `@/server/tasks-module` in `src/app/_components/task-list/index.tsx` is an error; `import type` is not                                     | 1    |
| No new routes                    | build                | `pnpm build` route list                                                                                                                                                          | 1    |
| Behavior unchanged by the styles | unit, component, e2e | every existing test, unchanged                                                                                                                                                   | 2    |
| Scroll still needed at 400 px    | e2e sabotage         | `loads more tasks when scrolling to the end` fails without `End`                                                                                                                 | 2    |
| The look                         | manual               | Playwright screenshots of `/` (light and dark), `/tasks/new` with a field error, an edit page, and a toast, from the production build, reviewed before hand-over (not committed) | 2    |

- **Levels and why:** this plan changes no behavior, so the existing tests are the regression suite; no new test is written. Styles are checked by eye on screenshots: asserting class names or computed colors would test the mechanism, not the behavior.
- **Targets:** 90% lines and branches on `src/server/**` (no server change).
- **How to run:** `pnpm test`, `pnpm test:coverage`, `pnpm test:e2e`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm build`.

## Style deviations

| Principle broken | Criterion and evidence | Alternative rejected | Review trigger | Impact on tests |
| ---------------- | ---------------------- | -------------------- | -------------- | --------------- |

None.

---

## Task 1: move the components into the new folders

**Files:**

- Move (with `git mv`): the files listed in the target tree.
- Modify: every importer of a moved file (`src/app/page.tsx`, `src/app/layout.tsx`, `src/app/tasks/new/page.tsx`, `src/app/tasks/[id]/edit/page.tsx`, the moved files and tests, `src/test/render-with-trpc.tsx`), `eslint.config.mjs` (the D-26 block's `files` gains `src/app/**/_components/**`)
- Modify (docs): `docs/DECISIONS.md` (**D-32** front-end folders: the rule, the tree, `_components` as a Next.js private folder, the ESLint scope; D-28's "Client code lives in `src/client/`" gets "_Superseded in part by D-32_"; D-29's path to `TaskForm` updated with the same note), `CLAUDE.md` ("Where things live"), `README.md` ("Where the code lives"), `.claude/rules/code-style.md` (one line under "Next.js and React": where a client component lives)

**Interfaces:**

- Consumes: the current files.
- Produces: the same exports at the new paths (`TaskList` from `@/app/_components/task-list`, `TaskDate` from `@/app/_components/task-date`, `EditTask` from `@/app/tasks/[id]/edit/_components/edit-task`, `TaskForm` from `@/client/shared/task-form`, `ToastProvider`, `useShowToast` and the types from `@/client/shared/toast`, `getErrorMessage`, `isTemporaryError` from `@/client/shared/error-message`).

- [ ] **Step 1:** move the files, fix the imports, extend the ESLint block. Run every test: all pass unchanged (190 unit and component, 14 e2e). `pnpm lint`, `pnpm typecheck`, `pnpm format:check` green; `pnpm build` lists the same routes as before.
- [ ] **Step 2:** ESLint API check (scratchpad script, an existing file path as in sub-plan 4): a value import from `@/server/tasks-module` in `src/app/_components/task-list/index.tsx` is reported; an `import type` from `@/server/adapters/trpc/app-router` is not.
- [ ] **Step 3:** docs as listed in "Files".

**Suggested commit:** `refactor(web): move components next to their pages and into client/shared` · files: the list above

## Task 2: style the app with Tailwind CSS

**Files:**

- Create: `postcss.config.mjs`, `src/app/globals.css`
- Modify: `package.json` and `pnpm-lock.yaml` (`pnpm add -D --save-exact tailwindcss@4.3.5 @tailwindcss/postcss@4.3.5`), `src/app/layout.tsx` (imports `./globals.css`; the body's base colors), the pages and every component in the target tree (classes only), `e2e/list-page.spec.ts` (the viewport comment)
- Modify (docs): `docs/DECISIONS.md` (**D-33** styling: Tailwind CSS only, no component library, user decision; dark mode from the system), `CLAUDE.md` (stack row for Tailwind CSS), `README.md` (one line: styled with Tailwind CSS), this plan and its status

**Interfaces:** none (classes only).

- [ ] **Step 1:** install and wire Tailwind as `11-css.md` shows; `pnpm build` passes and the CSS is served.
- [ ] **Step 2:** add the classes of "Visual design"; the toast's inline `style` becomes classes.
- [ ] **Step 3:** run every test (unchanged, all green); run the e2e sabotage without `End` (must fail); take the screenshots from the production build and review them; fix what reads badly.
- [ ] **Step 4:** docs as listed; this plan Done.

**Suggested commit:** `feat(web): style the app with Tailwind CSS` · files: the list above

---

## Review

| #   | Finding | Source | Accepted? | Reason |
| --- | ------- | ------ | --------- | ------ |
