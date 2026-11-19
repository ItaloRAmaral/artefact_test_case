# Code style

The style guide of this repository and its source of truth. It sits below `CLAUDE.md`: a hard rule there is never broken; a principle here may be, only with the written justification of "Breaking a principle". Each rule says whether a **tool** enforces it or **review** checks it.

On doubt about a rule: look for the answer in the code and the docs first; if it is not there, ask. Never infer.

## Design principles

Priority follows Kent Beck's four rules of simple design: **passes the tests, reveals intention, no duplication, fewest elements**. An element (component, function, file, parameter, dependency) exists only if it serves the first three. The spec's "less is more" is the tie-breaker.

| Principle | Rule | Check |
| --- | --- | --- |
| Names | Reveal intention, with full and consistent words. A quantity carries its unit (`timeoutMs`, `pageSize` is a count so no unit); a count ends in `Count`. Acronyms as words (`taskId`, not `taskID`). | Review |
| One level of abstraction | A function or component works at a single level of abstraction. | Review |
| Function size | No fixed limit. Extract when there is an **intention worth a name**. Do not extract if the result is shallow (only forwards the call) or tangled (only understood by reading the caller). Above about 40 lines, the reviewer asks whether there is a nameable intention. | Review |
| YAGNI | No feature or generalization for a presumed requirement. Nothing the spec does not ask for: no database, no auth, no filters, no state library beyond TanStack Query. | Review |
| Duplication | Business knowledge lives in one place from the start (the task schema validates both the form and the procedure). Code that only looks alike becomes an abstraction at the **third** copy. | Review |
| Wrong abstraction | An abstraction that accumulates parameters and conditionals per caller is inlined back into each caller and extracted again. | Review |
| Deep modules | Prefer simple interfaces that hide a lot of work (Ousterhout). A function that only forwards the call is a warning sign. | Review |
| Design patterns | Only for a variation that exists today, or the ones `backend.md` sets (repository, ports and adapters, one use case per operation). Nothing else "just in case". | Review |
| Inheritance | Avoid. Composition and plain functions. | Review |

## Comments

- **Code should explain itself.** When a passage needs a comment, first make the code clear: a better name, an extracted function named after its intent, a more precise type.
- **Decision comments are expected** (the spec asks for them): at the few places where a main decision lives, say *why* in one to three lines. For example: why the repository instance is kept on `globalThis` (survives hot reload in dev), why the list is prefetched on the server and hydrated, why the cursor is the one chosen. The README links the big picture; the comment stays where the decision is.
- Comment also what the code cannot say: invariants and units the type does not express, workarounds.
- Never write a comment that restates the code. Tests have no comments at all.

## Errors

- **Two kinds.** An **expected** error is part of the flow (task not found, title required) and is a `DomainError` subclass with a literal `code` (`TASK_NOT_FOUND`). A **defect** is a bug: a plain thrown `Error`, which tRPC turns into `INTERNAL_SERVER_ERROR` without leaking its message.
- **One translation point** on the server maps a domain `code` to a tRPC code (`backend.md`). Zod input errors arrive as `BAD_REQUEST` with field issues.
- The client tells errors apart by `code` (and by field issues for validation), never by message text, and maps them to user-facing text in one place.
- Nobody catches an expected error midway: the use case throws, the translation point converts it, the UI shows it.
- Throw only `Error` objects; catch as `unknown` and narrow.

## Data at the edges

- Input shape is validated **once** on the server, in the procedure's `.input()`, with a strict Zod schema. Inside, code trusts the types; the entity guards its own invariants with limits defined once in the domain.
- The form validates with the **same** schema before sending, for immediate feedback; it never hand-writes the rules again.
- Output is an explicit object built from the entity; the repository never hands out a reference to what it stores.
- Dates cross the wire in a form both sides agree on (the plan decides: a tRPC transformer or an ISO string), never implicitly.

## TypeScript

| Convention | Tool | Review |
| --- | --- | --- |
| `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `forceConsistentCasingInFileNames` in `tsconfig.json` | `tsc` | — |
| typescript-eslint `strict-type-checked` and `stylistic-type-checked`, plus `switch-exhaustiveness-check` and `consistent-type-imports`, on top of `next/core-web-vitals` | ESLint | — |
| Cases: `UpperCamelCase` for types and components, `lowerCamelCase` for values and functions, `UPPER_SNAKE_CASE` for global constants; no `I` prefix | ESLint | Clarity |
| Files in kebab-case, except the names Next.js requires (`page.tsx`, `layout.tsx`, `route.ts`) | — | Review |
| No `any`; use `unknown` and narrow. No `!`; `as` only with a comment saying why | ESLint | The reason |
| `interface` for object shapes; `type` for unions and `z.infer` types | ESLint | — |
| No `enum`: union of literals or `as const` object | — | Review |
| `switch` over a union is exhaustive with no `default` | ESLint | — |
| Named exports only, except where Next.js requires a default export (pages, layouts, config files) | — | Review |
| `import type` for types | `verbatimModuleSyntax` | — |
| Promises always handled | `no-floating-promises`, `no-misused-promises` | — |
| `===` always; `const` by default | ESLint | — |
| No `console.log` | `no-console` | — |
| Formatting by Prettier | Prettier | — |

## Next.js and React

- **Server Components by default.** `'use client'` only on components that need state, effects, event handlers or browser APIs, and as low in the tree as possible.
- **SSR of the list:** the page prefetches on the server through the tRPC server caller and hands the data to the client cache (hydration); the client never refetches what the server just rendered on first paint.
- **Server-only modules** (everything under `src/server/`) import `server-only`, so a client import fails the build.
- **Data on the client** goes through tRPC + TanStack Query only: no `fetch` to the API by hand, no copying query data into `useState`. After a mutation, invalidate or update the affected query.
- **Form state** with `useState`/`useReducer` in a functional component; no form library unless the plan justifies it.
- **Every async action has visible states:** loading (control disabled), success and failure messages, and an empty state for the list.
- **Accessibility basics:** each input has a label; feedback messages use `role="status"` or `role="alert"`; buttons are `<button>`.

## Breaking a principle

A plan may break a principle above if **at least one** of these is true:

1. **No real reuse:** the abstraction would have one caller, and nothing in the spec foresees another.
2. **Interface with one implementation:** there is no second implementation and no test double that needs it.
3. **Indirection without benefit:** the extraction would create a forwarding function, a tangled function or a shallow component.
4. **Duplication below the rule of three:** two similar copies whose callers may diverge.
5. **The existing abstraction became wrong:** the plan undoes it and extracts again.
6. **Measured performance:** the "clean" form costs measurable time, and the plan cites the measurement.
7. **Greater local clarity:** a known algorithm reads better whole and commented.
8. **Cheap now, expensive later:** a generalization whose future cost is described concretely.
9. **Test requirement:** the chosen form is the one that allows AAA, a single Act and the coverage target without logic in the test.

For each deviation, the plan records **five things**:

1. **Principle broken:** the exact name of the item in this guide.
2. **Criterion and evidence:** which criterion above, with concrete proof.
3. **Alternative rejected:** in one sentence, how it would look following the principle.
4. **Review trigger:** the fact that would bring the principle back ("third caller", "second implementation").
5. **Impact on tests:** the coverage target is still met.

**Never broken by a plan:** `CLAUDE.md` hard rules (for example: validating input in two places or not at all; telling errors apart by message; breaking the dependency rule of `backend.md`; changing a task outside the entity and use cases; importing server code into a client component; comments or logic in tests).

## Review checklist

What no tool catches:

- [ ] Names reveal intention.
- [ ] Nothing the spec does not ask for; every deviation is recorded in the plan.
- [ ] Task invariants live in the entity; limits are defined once in the domain; the schema reuses them; no rule in use cases, router, repository or UI.
- [ ] Dependency rule of `backend.md` holds; no framework or library in `domain/` or `application/`.
- [ ] Output is an explicit object; no entity or stored snapshot leaks.
- [ ] Domain errors carry a literal code, translated in one place; the UI maps codes to text in one place; no stack trace reaches the client.
- [ ] Every async action shows loading, success and failure; the list has an empty state.
- [ ] `'use client'` only where needed; server-only modules import `server-only`.
- [ ] Main decisions have a short *why* comment where they live; no comment restates code; tests have no comments.
