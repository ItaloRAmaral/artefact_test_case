---
paths:
  - '**/*.test.ts'
  - '**/*.test.tsx'
  - 'e2e/**'
---

# Test rules

Source of truth for how to write and verify tests: the `writing-tests` skill.

- Files: unit and component tests sit next to the code as `*.test.ts(x)` (Vitest), each use case's test in its folder; end-to-end tests live in `e2e/*.spec.ts` (Playwright). Test-only helpers live in `src/test/` (`factories/make-*.ts`, `catchError`, `render-with-trpc.tsx`, `trpc-links.ts`, `setup-dom.ts`, `intersection-observer.ts`, `dialog.ts`, `untyped.ts`). A router test that sends an input the contract's types forbid (a value outside a union, a missing field) wraps it in `untyped(...)`, so no test needs an `as`..
- Arrange, Act, Assert separated by blank lines, with no comments; one Act per test; no `if` or loops deciding what to assert.
- `it.each` only when every row has the same behavior and assertion shape, the table holds only literals, the body has no `if`, and the name shows the varying value (`%s`). Success and error cases go in separate tables.
- Expected errors: assert the `code`, never the message. Async: the Act is the call (`const promise = caller.task.update(input);`) and the Assert is `await expect(promise).rejects.toMatchObject({ code: 'NOT_FOUND' })`. Sync: `const error = catchError(() => ...)`, then assert its `code`. Never `expect(() => ...).toThrow()`.
- Test names describe the behavior (what), not the mechanism (how).
- TDD for the entity, the use cases, the router and the form validation: write the test, watch it fail for the right reason, then write the code.
- Use cases are tested with a fresh `InMemoryTaskRepository` per test, never with mocks of the repository; no test depends on another's data. Factories with fixed data and overrides (`makeTaskInput({ title: '' })`). A test that asserts the time freezes it with Vitest fake timers (`vi.useFakeTimers({ toFake: ['Date'] })`, `vi.setSystemTime`, real timers restored after each test); a generated id is asserted by its shape (UUID v4), never by value.
- Tests that go through the shared `tasksModule` (directly or through `handleTrpcRequest`) write to the task store on `globalThis`, which other test files in the same Vitest worker can see: they never assume an empty list. Every other test builds its own repository (`makeCaller(new InMemoryTaskRepository())`).
- The router is tested through `createCaller`, not over HTTP. Exception: what acts only on HTTP responses (the error formatter, the handler options) is tested in-process through the fetch adapter with a Web `Request`, no network or server. Components are tested by what the user sees and does (Testing Library queries by role and label), not by internal state, rendered inside the real providers with `renderWithTrpc` (tRPC's `localLink` to `appRouter` over a fresh repository); network failures and slow calls come from the links in `src/test/trpc-links.ts`. `IntersectionObserver`, which jsdom lacks, is a fake fired on demand (`FakeIntersectionObserver.revealAll()`, `src/test/intersection-observer.ts`); so are `<dialog>`'s `showModal` and `close`, which only toggle `open` (`src/test/dialog.ts`). `next/navigation` is the only module mocked (`vi.mock`, `useRouter` returning `push` and `back` spies): `useRouter` throws outside a mounted App Router, which jsdom does not have. Never mock code you own.
- Playwright tests the main flows against the running app; they do not repeat edge cases the unit tests already prove. They run on one worker (`playwright.config.ts`): they share one in-memory server and look for their tasks on the first page. Tests create their tasks with `createTask` (`e2e/api.ts`), which returns the id; only a test of the API itself posts to it directly. A test that clicks or types right after loading the list opens it with `gotoHydrated` (`e2e/hydration.ts`), which waits until a task's date has switched to local time: before hydration, a link click is a plain page load (the full form page, not the modal) and a filter change is lost. The list must hold a task for it.
