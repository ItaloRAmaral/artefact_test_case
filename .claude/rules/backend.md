---
paths:
  - 'src/server/**'
  - 'src/shared/**'
---

# Back-end architecture

Hexagonal architecture (ports and adapters) with a repository pattern, SOLID and clean code where they pay off, kept to the size of this test: one folder per domain, rich entities, one use case per folder with its test, abstract-class contracts, error codes, `make-*` factories, and none of the anti-patterns in "Do not repeat". Decided with the user on 2026-11-19; the trade-off against the spec's "less is more" is recorded in `docs/DECISIONS.md`. On doubt, read the code and docs first; if still unclear, ask.

## Layout

One folder per domain under `src/server/domains/` (today only `task`), holding everything of that domain grouped by kind of piece; everything that knows a framework lives in `src/server/adapters/`. Layout agreed with the user on 2026-11-19 (DECISIONS D-23).

```
src/
  shared/
    tasks/
      task-limits.ts         limits as plain constants, no imports (title and description max length, page size)
      task-schemas.ts        strict Zod input schemas of the tRPC contract; imported by the controller AND the form (output types come from the router, D-26)
      task-list-query.ts     the list query's input and next-cursor getter, shared by the page's server fetch and TaskList (same cache key, D-27)
    trpc/
      query-client.ts        makeQueryClient: the TanStack Query defaults of the server fetch and the browser (D-27)
  server/
    domains/
      task/                  the core: imports nothing external
        entities/
          entity.ts          Task entity
          dto.ts             the entity's shapes (TaskSnapshot, TaskContent)
          errors.ts          DomainError and the task errors, each with a literal code
        repositories/
          database-repository.ts             TaskRepository, the contract (abstract class)
          in-memory-database-repository.ts   InMemoryTaskRepository, beside its contract (+ .test.ts)
          dto.ts                             shapes of the contract (TaskPosition) and the in-memory options ({ capacity?, snapshots? })
        use-cases/
          create-task/       index.ts (the use case), dto.ts (input/output), index.test.ts; one folder per use case
          list-tasks/        index.ts, dto.ts, task-cursor.ts, index.test.ts
          get-task/          index.ts, dto.ts, index.test.ts
          update-task/       index.ts, dto.ts, index.test.ts
          delete-task/       index.ts, dto.ts, index.test.ts
    adapters/                the outer ring: knows the framework, imports server-only
      trpc/
        init.ts              initTRPC, the domain-error middleware (one translation table) and the error formatter
        dto.ts               TrpcContext
        app-router.ts        merges the controllers' routers; exports the AppRouter type
        handler.ts           fetch adapter for /api/trpc (batching off, logs unexpected errors)
        server.ts            per-request query client and the tRPC options proxy over tasksModule, for the page's server fetch
      controllers/
        task/                index.ts (procedures: input schema → use case → output object), dto.ts (TaskDto),
                             to-task-dto.ts, index.test.ts
      middlewares/           only when one is needed
    tasks-module.ts          composition root: createTasksModule(repository), and tasksModule over the snapshots Map kept on globalThis
  test/
    factories/               make-task.ts (fixed data with overrides), make-caller.ts, seed-tasks.ts
```

Folders are created when their first file arrives (git keeps no empty folder). File and folder names are a starting point for the plan; the dependency rule below is not.

## Dependency rule

`adapters/` and `tasks-module.ts` → `domains/`. Nothing in `domains/` points outward. ESLint enforces it (`no-restricted-imports`, D-17), test files excepted.

- **`domains/<name>/` imports nothing external:** no `zod`, no `@trpc/*`, no Node built-ins (`node:crypto`), no Next, no `server-only`. Its one import from outside `src/server/` is `src/shared/tasks/task-limits.ts`, which is plain constants.
- **Inside a domain:** `entities/` holds the rules and knows no use case or repository; repositories know the entity; use cases know both.
- **An implementation that needs nothing external lives beside its contract** (`InMemoryTaskRepository` next to `TaskRepository`). An implementation that needs a library or a Node built-in would go to `adapters/`.
- **`adapters/`** is the only place that knows a framework or a library (tRPC, Zod at the edge).
- **`src/shared/`** holds only what both client and server need (the limits, the Zod contract, the list query options and the query client factory); it never imports anything from `src/server/`.
- **`server-only`** is imported by the modules that wire or expose the server (`tasks-module.ts` and `adapters/`), so a client import of them fails the build. `domains/` stays free of it; no client code imports it either.

## Entities

- **Entity `Task`:** private state; `static create(props)` checks invariants (title not blank after trimming, within the length limit); `static restore(snapshot)` rehydrates without re-running creation rules; business-named methods (`edit({ title, description })`); rules shared by several methods are private methods of the entity, never loose functions in its file; `toSnapshot()` for the repository; no setters, no `Object.assign` from input.
- **Domain errors** extend a small `DomainError` with a literal `code` (`TASK_NOT_FOUND`, `TASK_TITLE_REQUIRED`); no sentences for the user, no transport status.
- **Limits** are constants defined once in `src/shared/tasks/task-limits.ts`; the entity and the Zod schema both use them. The schema checks shape for field-level feedback; the entity guarantees no invalid task exists whatever the caller. Same limit, one definition.

## Use cases and repositories

- **Use case:** plain class, `execute(input)`, contracts through the constructor; no framework decorators. Thin script: load → call the entity → save → return the entity. A business `if` here means the rule belongs in the entity.
- **One use case per operation** (`CreateTask`, `ListTasks`, `UpdateTask`, `DeleteTask`): single responsibility, each tested alone.
- **A contract (abstract class) exists only where it pays off:** `TaskRepository`, because storage is the part that would change (memory today, a database later). Time and IDs are direct calls in `CreateTask` (`new Date()`, the global `crypto.randomUUID()`): tests freeze time with Vitest fake timers and assert the id by its shape, so a `Clock` or `IdGenerator` contract would only wrap one line (user decision, D-24).
- **Repository:** collection-like methods that receive and return entities, never DTOs. A method exists only when a use case calls it (`findExistingById`, `save`, `delete`, `listAfter(position, count)`). No `update(dto)`, no generic `findAll()`.
- **Not found is part of the repository contract** (user decision, 2026-11-19): the contract declares `findExistingById(id): Promise<Task>`, and every implementation rejects with the domain error `TaskNotFoundError` when the task does not exist. Use cases never check for `null`. Like the storage cap (D-22), this is the only domain error an implementation raises, and it is part of the contract; implementations still hold no business rule.
- **Interface segregation:** contracts stay small; no method "for later".

## Implementations

- **`InMemoryTaskRepository`:** keeps snapshots in a `Map` and returns copies, so nothing outside can mutate stored state; reproduces only storage concerns (ordering, cursor), never business rules. It is the production implementation and the one tests use: no mocks of it.
- **The stored tasks** live in one `Map` of snapshots on `globalThis` (`tasks-module.ts`), so dev hot reload does not wipe the list; each Next.js bundle builds its own `InMemoryTaskRepository` over it (`{ snapshots }`), because only plain data may cross bundles: a class instance from another bundle's copy fails `instanceof` (D-30). A short comment says why.

## Adapters (tRPC controllers)

- **Controller procedure:** input already validated by its strict Zod schema → call the use case → build the output object field by field from the entity (never return the entity or the snapshot as is).
- **No `try/catch` in procedures.** One translation point, the middleware of `publicProcedure` in `init.ts` (the only procedure builder exported), maps a `DomainError` code to the tRPC code (`TASK_NOT_FOUND` → `NOT_FOUND`); the error formatter exposes it as `data.domainCode`. Anything else stays `INTERNAL_SERVER_ERROR` without its message or stack, and is logged on the server (D-25).
- **Composition:** `tasks-module.ts` builds the use cases with their implementations (plain functions and `new`, no DI container); procedures get them from the tRPC context (`ctx.tasks`), so tests build a caller over a fresh repository (`makeCaller`).

## Do not repeat

Common anti-patterns of this architecture, and the rule that avoids each.

| Anti-pattern                                                                                                                      | Rule here                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the repository checks a business rule, or throws a framework exception (`ConflictException`-like transport errors in the adapter) | business rules live in the entity and use cases; an implementation raises only the domain errors its contract declares (`TaskNotFoundError` from `findExistingById`, `TaskStorageFullError` from `save`), never a framework error |
| the repository receives use-case DTOs (`createTask(dto)`, `updateTask(dto)`)                                                      | the repository receives and returns entities (`save(task)`)                                                                                                                                                                       |
| framework imports in the core                                                                                                     | `domains/` imports no framework                                                                                                                                                                                                   |
| errors as sentences from a message table                                                                                          | errors carry a literal `code`; the UI owns the text                                                                                                                                                                               |
| anemic entities filled by spreading input                                                                                         | private state, `create` checks invariants, business-named methods                                                                                                                                                                 |
| contract methods left unimplemented (`throw new Error('Method not implemented.')`)                                                | a contract method exists only when a use case calls it                                                                                                                                                                            |
| a use case that instantiates infrastructure with `new`                                                                            | contracts injected through the constructor, wired in the composition root                                                                                                                                                         |

## SOLID and clean code, when they pay off

- **S:** one reason to change per class: entity (rules), use case (one operation), implementation or controller (one technology).
- **O/L:** a new storage means a new `TaskRepository` implementation; nothing else changes. Not more than that: no plugin points without a second variant.
- **I:** small contracts with only the methods use cases call.
- **D:** use cases depend on contracts, never on `new` of infrastructure.
- Clean code and the rest of the style live in `code-style.md`. When a principle here adds a file that does nothing (a forwarding layer, a trivial mapper), the plan says so instead of adding it.
