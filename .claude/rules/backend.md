---
paths:
  - 'src/server/**'
  - 'src/shared/**'
---

# Back-end architecture

Hexagonal architecture (ports and adapters) with a repository pattern, SOLID and clean code where they pay off, kept to the size of this test: one module per context, rich entities, one use case per folder with its test, abstract-class ports, error codes, `make-*` factories, and none of the anti-patterns in "Do not repeat". Decided with the user on 2026-11-19; the trade-off against the spec's "less is more" is recorded in `docs/DECISIONS.md`. On doubt, read the code and docs first; if still unclear, ask.

## Layout

One module per context (vertical slice); today there is only `tasks`.

```
src/
  shared/
    tasks/
      task-limits.ts         limits as plain constants, no imports (title and description max length, page size)
      task-schemas.ts        Zod input/output schemas of the tRPC contract; imported by the router AND the form
  server/
    tasks/
      domain/
        task.ts              Task entity
        task-errors.ts       domain errors, each with a literal code
      application/
        ports/               abstract classes: TaskRepository, Clock, IdGenerator
        use-cases/
          create-task/       create-task.ts + create-task.test.ts (one folder per use case)
          list-tasks/
          update-task/
          delete-task/
      infra/
        in-memory-task-repository.ts   the production adapter (the spec wants memory) and the test double
        system-clock.ts, random-id-generator.ts
      trpc/
        task-router.ts       inbound adapter: input schema → use case → output object
      tasks-module.ts        composition root of the module: builds use cases with their ports
    trpc/
      init.ts                initTRPC, context, error formatter (domain code → client)
      app-router.ts          merges module routers
      server-caller.ts       server-side caller for SSR
  test/
    factories/               make-task.ts, make-task-input.ts: fixed data with overrides
    fakes/                   fixed-clock.ts, sequential-id-generator.ts
```

File and folder names are a starting point for the plan; the dependency rule below is not.

## Dependency rule

`trpc` → `application` → `domain`; `infra` → `application` (implements ports). Nothing points the other way.

- **`domain/` imports nothing external:** no `zod`, no `@trpc/*`, no Node `crypto`, no Next, no `server-only`. IDs and time arrive from outside. Its one import from outside `src/server/` is `src/shared/tasks/task-limits.ts`, which is plain constants.
- **`application/` imports only `domain/`** and its own ports: no `@trpc/*`, no Zod, no infra.
- **`infra/` and `trpc/`** are the only places that know a framework or a library.
- **`src/shared/`** holds only what both client and server need (the limits and the Zod contract); it never imports anything from `src/server/`.
- **`server-only`** is imported by the modules that wire or expose the server (`tasks-module.ts`, `infra/`, `trpc/`, `src/server/trpc/`), so a client import of them fails the build. `domain/` and `application/` stay free of it; no client code imports them either.

## Domain

- **Entity `Task`:** private state; `static create(props)` checks invariants (title not blank after trimming, within the length limit); `static restore(snapshot)` rehydrates without re-running creation rules; business-named methods (`edit({ title, description })`); `toSnapshot()` for the repository; no setters, no `Object.assign` from input.
- **Domain errors** extend a small `DomainError` with a literal `code` (`TASK_NOT_FOUND`, `TASK_TITLE_REQUIRED`); no sentences for the user, no transport status.
- **Limits** are constants defined once in `src/shared/tasks/task-limits.ts`; the entity and the Zod schema both use them. The schema checks shape for field-level feedback; the entity guarantees no invalid task exists whatever the caller. Same limit, one definition.

## Application

- **Use case:** plain class, `execute(input)`, ports through the constructor; no framework decorators. Thin script: load → call the entity → save → return the entity. A business `if` here means the rule belongs in the entity.
- **One use case per operation** (`CreateTask`, `ListTasks`, `UpdateTask`, `DeleteTask`): single responsibility, each tested alone.
- **Ports are abstract classes**, one per conversation with the outside: `TaskRepository` (persistence), `Clock` (time), `IdGenerator` (IDs). Pure deterministic code is called directly, without a port.
- **Repository:** collection-like methods that receive and return entities, never DTOs. A method exists only when a use case calls it (for example `findById`, `save`, `delete`, `listPage({ cursor, limit })`). No `update(dto)`, no generic `findAll()`.
- **Interface segregation:** ports stay small; no method "for later".

## Infra

- **`InMemoryTaskRepository`:** keeps snapshots in a `Map` and returns copies, so nothing outside can mutate stored state; reproduces only storage concerns (ordering, cursor), never business rules. It is the production adapter and the one tests use: no mocks of it.
- **The single instance** lives in the composition root on `globalThis`, so dev hot reload does not wipe the list; a short comment says why.
- **`SystemClock`, `RandomIdGenerator`** are the real adapters; tests use fixed ones.

## tRPC (inbound adapter)

- **Procedure:** input already validated by its strict Zod schema → call the use case → build the output object field by field from the entity (never return the entity or the snapshot as is).
- **No `try/catch` in procedures.** One translation point (a middleware or the error formatter) maps a `DomainError` code to the tRPC code (`TASK_NOT_FOUND` → `NOT_FOUND`) and exposes the domain `code` to the client; anything else stays `INTERNAL_SERVER_ERROR` without internals.
- **Composition:** `tasks-module.ts` builds the use cases with their adapters (plain functions and `new`, no DI container); the router receives the use cases, so tests can build a router with fixed clock and ID generator.

## Do not repeat

Common anti-patterns of this architecture, and the rule that avoids each.

| Anti-pattern                                                                                                        | Rule here                                                                                             |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| the repository checks existence and throws a framework exception (business rule and transport error in the adapter) | the use case loads, the entity decides, the use case throws the domain error; the adapter only stores |
| the repository receives use-case DTOs (`createTask(dto)`, `updateTask(dto)`)                                        | the repository receives and returns entities (`save(task)`)                                           |
| framework imports in the core                                                                                       | `domain/` and `application/` import no framework                                                      |
| errors as sentences from a message table                                                                            | errors carry a literal `code`; the UI owns the text                                                   |
| anemic entities filled by spreading input                                                                           | private state, `create` checks invariants, business-named methods                                     |
| port methods left unimplemented (`throw new Error('Method not implemented.')`)                                      | a port method exists only when a use case calls it                                                    |
| a use case that instantiates infrastructure with `new`                                                              | ports injected through the constructor, wired in the composition root                                 |

## SOLID and clean code, when they pay off

- **S:** one reason to change per class: entity (rules), use case (one operation), adapter (one technology).
- **O/L:** a new storage means a new `TaskRepository` adapter; nothing else changes. Not more than that: no plugin points without a second variant.
- **I:** small ports with only the methods use cases call.
- **D:** use cases depend on ports, never on `new` of infrastructure.
- Clean code and the rest of the style live in `code-style.md`. When a principle here adds a file that does nothing (a forwarding layer, a trivial mapper), the plan says so instead of adding it.
