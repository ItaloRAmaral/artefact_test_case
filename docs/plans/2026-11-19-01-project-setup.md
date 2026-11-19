# Plan: project setup and tooling (sub-plan 1)

| Field   | Value                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status  | Approved                                                                                                                                                                                                                                                                                                                                                                                                     |
| Date    | 2026-11-19                                                                                                                                                                                                                                                                                                                                                                                                   |
| Request | "aprovado, pode começar o sub-plano 1": sub-plan 1 of the roadmap, project setup and tooling                                                                                                                                                                                                                                                                                                                 |
| Context | [Roadmap](2026-11-19-roadmap.md) sub-plan 1 and "Risks and pending decisions"; [`docs/DECISIONS.md`](../DECISIONS.md) D-01, D-02, D-08, D-13, D-16 to D-18; `CLAUDE.md` "Stack" and "Commands"; `.claude/rules/code-style.md` "TypeScript"; `.claude/rules/backend.md` "Dependency rule"; Next.js 16 docs read on 2026-11-19 (upgrade guide, ESLint config, `create-next-app`, Vitest and Playwright guides) |
| Roadmap | [2026-11-19-roadmap.md](2026-11-19-roadmap.md), sub-plan 1                                                                                                                                                                                                                                                                                                                                                   |

**Goal:** a Next.js 16.4.6 app with the pinned toolchain where every script in `CLAUDE.md` "Commands" runs green, the layer rule is enforced by lint, and one real unit test and one e2e smoke test prove the test setup.

**Architecture:** configuration at the repository root (`package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.prettierrc.json`, `vitest.config.mts`, `playwright.config.ts`), a placeholder App Router page in `src/app/`, the first test helper in `src/test/`, the smoke test in `e2e/`. Each dependency is added by the first sub-plan that uses it: tRPC, Zod and TanStack Query come in 2 and 3, Testing Library and the React plugin for Vitest in 4.

## Global constraints

- Exact versions, no ranges (D-02, D-16): `next` 16.4.6, `react` and `react-dom` 19.3.1, `typescript` 6.0.3, `eslint` 10.15.0, `eslint-config-next` 16.4.6, `typescript-eslint` 8.73.0, `prettier` 3.10.1, `vitest` 5.1.1, `@vitest/coverage-v8` 5.1.1, `vite` 8.3.8 (Vitest 5 peer), `@playwright/test` 1.65.1, `@types/node` 24.19.2 (Node 24), `@types/react` and `@types/react-dom` 19.3.0. `packageManager`: `pnpm@12.21.0` (latest; pnpm switches to it automatically). `.nvmrc`: `24.22.2`.
- **Release age (D-19, found in Task 2):** pnpm 12 refuses versions younger than 7 days. Installed instead: `eslint` 10.14.0 and `typescript-eslint` 8.72.2 (Task 2); `vitest` and `@vitest/coverage-v8` 5.1.0 (Task 3); `@playwright/test` 1.65.0 (Task 4). The rest are unchanged.
- Next.js 16 facts, from its docs: `next lint` is removed and `next build` no longer lints, so `lint` runs the ESLint CLI; the ESLint config is flat, built from `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`; Turbopack is the default for `dev` and `build`; Playwright tests are recommended against a production build.
- The scripts are exactly those of `CLAUDE.md` "Commands", plus `format` (writes formatting), which is added to that table.
- Nothing under `src/server/` exists yet. The coverage gate (90% lines and branches on `src/server/**`, D-08) is configured here and proves itself in sub-plan 2, its first code.

## Decisions with the user

| Question                                                                                                                                   | Answer                                                                | Date       |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ---------- |
| ESLint 9.39.5 (D-02) or 10.15.0, now that the Next.js docs state ESLint 10 support while three of its plugins still declare peers up to 9? | 10.15.0, accepting the peer warnings (D-16)                           | 2026-11-19 |
| How to enforce the layer dependency rule?                                                                                                  | ESLint's built-in `no-restricted-imports`, one block per layer (D-17) | 2026-11-19 |
| Playwright browsers?                                                                                                                       | Chromium only (D-18)                                                  | 2026-11-19 |

## Review focus

- **Peer warnings from ESLint 10** (`eslint-plugin-react`, `-jsx-a11y`, `-import` declare up to 9): pnpm warns but installs; a rule that crashes under ESLint 10 fails `pnpm lint`, which Task 2's verification catches. If one crashes, stop and ask (fall back to 9.39.5, or disable that rule).
- **`create-next-app` refuses a non-empty folder** (the repo has `docs/`, `.claude/`, `CLAUDE.md`): the scaffold is generated in the scratchpad as a reference, and only the files listed in Task 1 are copied.
- **Next.js rewrites `tsconfig.json` on the first `dev`/`build`** (fields it requires): the change is accepted and kept, never fought.
- **`pnpm test` with no test files exits with an error**: Task 3 adds the first real test, so there is no `passWithNoTests`.
- **Coverage gate with no files under `src/server/`**: what Vitest prints is recorded in Task 3's verification. If it fails on an empty include, the gate is added in sub-plan 2's first task instead, and this plan's status says so.
- **e2e server port**: Playwright starts its own production server on port 3100 and never reuses one already running. A `pnpm dev` on 3000 cannot be tested by mistake, and every e2e run starts with an empty in-memory list.
- **Browsers not installed**: `pnpm test:e2e` fails until `pnpm exec playwright install chromium` runs once. The README says so.
- **Layer rules on folders that do not exist yet**: verified by piping a violating snippet through `eslint --stdin` with a fake file name, so no violating file is ever created.

## Security

| Threat                               | How this plan handles it                                                                                                           | Task and test                               |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Secrets committed                    | `.gitignore` covers `.env*`; no secrets are needed                                                                                 | Task 1, review                              |
| Supply chain drift                   | exact versions and the committed `pnpm-lock.yaml`; installs use the lockfile                                                       | Task 1 (`pnpm install` writes the lockfile) |
| Server code in client bundles        | lint blocks `src/shared/**` from importing `@/server/**` (D-13, D-17); `server-only` arrives with its first importer in sub-plan 2 | Task 2, `eslint --stdin` check              |
| Input validation, XSS, error leakage | not applicable: no input, no data, no API in this sub-plan                                                                         | —                                           |

## Test plan

| Requirement or review-focus line                     | Level      | Test name                                            | Task |
| ---------------------------------------------------- | ---------- | ---------------------------------------------------- | ---- |
| `catchError` returns what the function throws        | unit       | `returns the error the function throws`              | 3    |
| `catchError` fails loudly when nothing is thrown     | unit       | `throws when the function does not throw`            | 3    |
| The app serves its home page from a production build | e2e        | `renders the home page`                              | 4    |
| Layer rule enforced                                  | lint check | `eslint --stdin` violations in Task 2's verification | 2    |

- **Levels used and why:** unit for the one helper that exists; e2e for the running app; the component level starts in sub-plan 4 with the first component worth testing.
- **Test data:** literals only.
- **Targets:** the 90% gate on `src/server/**` is configured (Task 3) and enforced from sub-plan 2 on.
- **How to run:** `pnpm test`, `pnpm test:coverage`, `pnpm test:e2e` (after `pnpm exec playwright install chromium`).

## Style deviations

| Principle broken | Criterion and evidence | Alternative rejected | Review trigger | Impact on tests |
| ---------------- | ---------------------- | -------------------- | -------------- | --------------- |

None. One change to the style guide itself: in `code-style.md` "TypeScript", the naming-cases row moves from "Tool: ESLint" to review only. Configuring `@typescript-eslint/naming-convention` for React components (UpperCamelCase functions) would add more config than it saves on a codebase this size. The row is edited in Task 2.

---

## Task 1: Next.js app skeleton

**Files:**

- Create: `package.json`, `pnpm-lock.yaml` (by `pnpm install`), `tsconfig.json`, `next.config.ts`, `.gitignore`, `.nvmrc`, `src/app/layout.tsx`, `src/app/page.tsx`

**Interfaces:**

- Produces: scripts `dev` (`next dev`), `build` (`next build`), `start` (`next start`), `typecheck` (`next typegen && tsc --noEmit`, see the execution notes); import alias `@/*` → `src/*`; the home page `/` with the heading `Tasks` (role `heading`, level 1), which sub-plan 4 replaces with the list.

- [x] **Step 1: generate the reference scaffold** in the scratchpad: `pnpm create next-app@16.4.6 <scratchpad>/next-reference --ts --eslint --app --src-dir --no-tailwind --empty --use-pnpm --import-alias "@/*" --skip-install --disable-git --yes`. Copy `tsconfig.json`, `next.config.ts` and `.gitignore` from it; read its `package.json` for the generated scripts and its `src/app/` for the minimal layout. Nothing else is copied.
- [x] **Step 2: write `package.json`** with name `task-manager`, `private: true`, `packageManager: "pnpm@12.21.0"`, the four scripts above, `next`/`react`/`react-dom` as dependencies and `typescript`, `@types/node`, `@types/react`, `@types/react-dom` as dev dependencies, all at the exact versions in "Global constraints".
- [x] **Step 3: harden `tsconfig.json`** with the options in `code-style.md` "TypeScript" (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `forceConsistentCasingInFileNames`), keeping every field the scaffold sets.
- [x] **Step 4: placeholder page and layout:** `layout.tsx` with `<html lang="en">` and metadata title `Tasks`; `page.tsx` renders `<h1>Tasks</h1>`. Add `.gitignore` entries for `coverage/`, `test-results/`, `playwright-report/` and `.env*` if the scaffold does not have them; write `.nvmrc`.
- [x] **Step 5: verify:** `pnpm install` (peer warnings for the ESLint plugins arrive in Task 2, not here) · `pnpm build` succeeds · `pnpm typecheck` exits 0 · `pnpm dev` serves `Tasks` at `http://localhost:3000`. Keep any change Next.js makes to `tsconfig.json`.

**Execution notes (2026-11-19):**

- The scaffold also generated `pnpm-workspace.yaml` (`allowBuilds: { sharp: false, unrs-resolver: false }`, pnpm's build-script approval). It is copied too; without it `pnpm install` asks about those builds.
- `typecheck` is `next typegen && tsc --noEmit`, not `tsc --noEmit`: the layout uses the global `LayoutProps` route type, which lives in the generated (and gitignored) `next-env.d.ts` and `.next/types`. On a clean tree `tsc` alone failed with `TS2304: Cannot find name 'LayoutProps'`; with `next typegen` first it exits 0.
- The scaffold's `next.config.ts` enables `cacheComponents: true` and `partialPrefetching: true` by default, kept as generated. `pnpm build` lists `/` as `○ (Static)`, the risk sub-plan 4 must handle (roadmap updated).
- The scaffold's `tsconfig.json` already includes `**/*.mts`. Next.js changed nothing in it on build or dev. Task 2's `disableTypeChecked` therefore covers only `**/*.mjs`.
- `next dev` created `AGENTS.md`, a block Next.js manages that points AI agents to the version-matched docs in `node_modules/next/dist/docs/`. It is written only when an AI agent runs `next dev`, re-created if deleted, and disabled with `agentRules: false`. Kept and committed, so the tree stays clean.
- Verified: `pnpm install` (pnpm switched to 12.21.0 from `packageManager`), `pnpm build` green, `pnpm typecheck` exit 0 on a clean tree, `pnpm dev` served `<h1>Tasks</h1>`.

**Suggested commit:** `chore: scaffold Next.js 16 app with pinned versions` · files: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `.nvmrc`, `src/app/layout.tsx`, `src/app/page.tsx`, `AGENTS.md`

## Task 2: lint, layer rule and formatting

**Files:**

- Create: `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`
- Modify: `package.json` (scripts `lint`, `format`, `format:check`; dev dependencies `eslint`, `eslint-config-next`, `typescript-eslint`, `prettier`), `.claude/rules/code-style.md` (naming-cases row → review)

**Interfaces:**

- Produces: `lint` (`eslint .`), `format` (`prettier --write .`), `format:check` (`prettier --check .`).

- [x] **Step 1: `eslint.config.mjs`** (flat, `defineConfig` from `eslint/config`):
  - `eslint-config-next/core-web-vitals`, then `eslint-config-next/typescript`;
  - `typescript-eslint` `strictTypeChecked` and `stylisticTypeChecked` with `parserOptions.projectService: true`, plus `@typescript-eslint/switch-exhaustiveness-check`, `@typescript-eslint/consistent-type-imports`, and core `no-console`, `eqeqeq`, `prefer-const` (`code-style.md` "TypeScript");
  - `disableTypeChecked` for `**/*.mjs` (`eslint.config.mjs`); `.mts` files are in the scaffold's `tsconfig.json` include, so `vitest.config.mts` is type-checked (see Task 1's execution notes);
  - the Next.js default ignores (`.next/**`, `out/**`, `build/**`, `next-env.d.ts`) plus `coverage/**`, `playwright-report/**`, `test-results/**`.
- [x] **Step 2: layer rule** (D-17), `no-restricted-imports` blocks:

| Files                          | Forbidden imports                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/server/**/domain/**`      | `zod`, `@trpc/*`, `@tanstack/*`, `next`, `next/*`, `react`, `react-dom`, `server-only`, `node:*`, any path into `application`, `infra` or `trpc` |
| `src/server/**/application/**` | the same external packages, any path into `infra` or `trpc`                                                                                      |
| `src/shared/**`                | `@/server/*` and any relative path into `src/server/`, `server-only`                                                                             |

Each block's message names the rule ("domain imports nothing external, see `.claude/rules/backend.md`").

- [x] **Step 3: Prettier:** `.prettierrc.json` `{ "singleQuote": true }`, Prettier's defaults otherwise (single quotes match every code example in the rules and skills); `.prettierignore` with `pnpm-lock.yaml`, `.next`, `coverage`, `playwright-report`, `test-results`. Run `pnpm format` once over the repository.
- [x] **Step 4: verify:**
  - `pnpm lint` exits 0, `pnpm format:check` exits 0, `pnpm typecheck` exits 0;
  - pipe `import { z } from 'zod';` through `pnpm exec eslint --stdin --stdin-filename src/server/tasks/domain/check.ts`: expected an error from `no-restricted-imports`;
  - the same with `import 'server-only';` for `src/server/tasks/application/check.ts`, and `import { x } from '@/server/tasks/domain/task';` for `src/shared/tasks/check.ts`: errors from `no-restricted-imports`;
  - the output of each is pasted in the hand-over. If a Next plugin crashes under ESLint 10, stop and ask (review focus).

**Execution notes (2026-11-19):**

- Installed `eslint` 10.14.0 and `typescript-eslint` 8.72.2 instead of 10.15.0 and 8.73.0: pnpm 12's default `minimumReleaseAge` (7 days) refused the newer ones (D-19). `pnpm peers check` lists exactly the three expected warnings (`eslint-plugin-import`, `-jsx-a11y`, `-react` want ESLint up to 9). No rule crashed: `pnpm lint` exits 0.
- `eslint --stdin` cannot check the layer rules: with type-aware linting, the project service rejects a file name that does not exist (`was not found by the project service`). The rules were checked instead with the ESLint Node API, using the real `eslint.config.mjs` and only type-aware linting switched off, on in-memory snippets (a script in the scratchpad, not versioned). Result:
  - `console.log` in `src/app/` → `no-console`;
  - `zod` in `domain/` → `no-restricted-imports`;
  - `../application/...` in `domain/` → `no-restricted-imports`;
  - `server-only` in `application/` → `no-restricted-imports`;
  - `../../infra/...` in `application/use-cases/` → `no-restricted-imports`;
  - `@/server/...` in `src/shared/` → `no-restricted-imports`;
  - `@/shared/tasks/task-limits` in `domain/` → no error (allowed, D-13).
- `.prettierignore` also lists `AGENTS.md`, which Next.js manages; reformatting it would make `next dev` rewrite it. `pnpm format` reformatted the Markdown docs, the rules and skills (table alignment, list numbering), `eslint.config.mjs` and `next.config.ts`; content unchanged.
- Verified: `pnpm lint`, `pnpm format:check` and `pnpm typecheck` exit 0.

**Suggested commit:** `chore: add ESLint 10 flat config, layer import rules and Prettier` · files: `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `package.json`, `pnpm-lock.yaml`, `.claude/rules/code-style.md`, plus files reformatted by `pnpm format`

## Task 3: Vitest with the coverage gate and the first helper (TDD)

**Files:**

- Create: `vitest.config.mts`, `src/test/catch-error.ts`, `src/test/catch-error.test.ts`
- Modify: `package.json` (scripts `test`, `test:coverage`; dev dependencies `vitest`, `@vitest/coverage-v8`, `vite`)

**Interfaces:**

- Produces: `catchError(fn: () => unknown): unknown`, which returns what `fn` throws and throws an `Error` when `fn` returns normally. Sync error tests in sub-plans 2 to 6 use it (`.claude/rules/tests.md`).
- Produces: `test` (`vitest run`), `test:coverage` (`vitest run --coverage`).

- [ ] **Step 1: `vitest.config.mts`:** `resolve.tsconfigPaths: true` (Vite 8 built-in, so no plugin); `test.include: ['src/**/*.test.{ts,tsx}']` so `e2e/` is never picked up; environment `node` (jsdom arrives with the first component test in sub-plan 4); `coverage`: provider `v8`, `include: ['src/server/**']`, `exclude: ['**/*.test.{ts,tsx}']`, `thresholds: { lines: 90, branches: 90 }`.
- [ ] **Step 2: write the failing tests:**

```ts
describe('catchError', () => {
  it('returns the error the function throws', () => {
    const thrown = new Error('boom');

    const error = catchError(() => {
      throw thrown;
    });

    expect(error).toBe(thrown);
  });

  it('throws when the function does not throw', () => {
    const error = catchError(() => catchError(() => 'no error'));

    expect(error).toBeInstanceOf(Error);
  });
});
```

- [ ] **Step 3: run and watch them fail for the right reason:** create `src/test/catch-error.ts` exporting `catchError` that returns `undefined` without calling `fn`, so the tests compile and reach their assertions. `pnpm test`. Expected: both FAIL on their `expect` (the first gets `undefined` instead of the error, the second gets `undefined` instead of an `Error`), not on an import error.
- [ ] **Step 4: implement `catchError`** in `src/test/catch-error.ts`: call `fn` inside `try`, return the caught value; after a normal return, throw an `Error`.
- [ ] **Step 5: run and watch them pass:** `pnpm test`, expected PASS (2 tests). Then `pnpm test:coverage`: record what Vitest prints for the empty `src/server/**` include, and handle a failure as the review focus says. `pnpm lint` and `pnpm typecheck` stay green.

**Suggested commit:** `test: set up Vitest with the server coverage gate and catchError helper` · files: `vitest.config.mts`, `src/test/catch-error.ts`, `src/test/catch-error.test.ts`, `package.json`, `pnpm-lock.yaml`

## Task 4: Playwright smoke test, README and closing docs

**Files:**

- Create: `playwright.config.ts`, `e2e/home.spec.ts`, `README.md`
- Modify: `package.json` (script `test:e2e`; dev dependency `@playwright/test`), `CLAUDE.md` ("Stack": ESLint 10.15.0 and pnpm 12.21.0; "Commands": `format`, browser install), `docs/plans/2026-11-19-roadmap.md` (sub-plan 1 status), this plan's status

**Interfaces:**

- Produces: `test:e2e` (`playwright test`). Config: `testDir: 'e2e'`; one project, Desktop Chrome (Chromium, D-18); `use.baseURL: 'http://localhost:3100'`; `webServer`: command `pnpm build && pnpm start --port 3100`, url `http://localhost:3100`, `reuseExistingServer: false`, `timeout: 180_000` (the build runs inside it; Playwright's default web-server timeout is 60 s). Sub-plans 4 to 6 add their flows to `e2e/`.

- [ ] **Step 1: write the failing test** `e2e/home.spec.ts`:

```ts
test('renders the home page', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Tasks' }),
  ).toBeVisible();
});
```

- [ ] **Step 2: run and watch it fail:** `pnpm test:e2e` before writing `playwright.config.ts`. Expected: FAIL (no config, so no web server and no `baseURL`). Then write the config.
- [ ] **Step 3: install the browser and pass:** `pnpm exec playwright install chromium`, then `pnpm test:e2e`. Expected: PASS (1 test) against the production build.
- [ ] **Step 4: README** (English): what the project is (one paragraph, link to `docs/SPEC.md`); requirements (Node 24.22.2, pnpm); how to run (`pnpm install`, `pnpm dev`, `pnpm build && pnpm start`); how to test (`pnpm test`, `pnpm test:coverage`, `pnpm exec playwright install chromium` once, then `pnpm test:e2e`); lint and format; links to `docs/DECISIONS.md` and `docs/plans/`. The field mapping (D-03) and "how it works" arrive with the code (sub-plans 2 to 6).
- [ ] **Step 5: close:** update `CLAUDE.md` "Stack" and "Commands"; set this plan's status to "Done" and sub-plan 1 to "Done" in the roadmap. Run every script once: `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm test`, `pnpm test:coverage`, `pnpm build`, `pnpm test:e2e`, all green.

**Suggested commit:** `test: add Playwright smoke test on a production build, README` · files: `playwright.config.ts`, `e2e/home.spec.ts`, `README.md`, `package.json`, `pnpm-lock.yaml`, `CLAUDE.md`, `docs/plans/2026-11-19-roadmap.md`, `docs/plans/2026-11-19-01-project-setup.md`

---

## Review

| #   | Finding                                                                              | Source                    | Accepted? | Reason                                                                                    |
| --- | ------------------------------------------------------------------------------------ | ------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| 1   | Prettier `printWidth: 100` traced to nothing                                         | self-review (assumptions) | Yes       | only `singleQuote` kept, which matches the code examples in the rules; defaults otherwise |
| 2   | Playwright web-server timeout said "long enough", deciding nothing                   | self-review (step scan)   | Yes       | `180_000` with the reason                                                                 |
| 3   | Task 3 would fail red on an import error, not on the behavior                        | self-review (tests)       | Yes       | a stub returning `undefined` makes both tests fail on their assertions                    |
| 4   | `vitest.config.mts` is outside the tsconfig include, so typed lint would error on it | self-review (interfaces)  | Yes       | `disableTypeChecked` covers `**/*.{mjs,mts}`                                              |
| 5   | `server-only` alias had no importer in sub-plan 1                                    | self-review (coverage)    | Yes       | moved to sub-plan 2 (the infra imports it first); roadmap updated                         |
