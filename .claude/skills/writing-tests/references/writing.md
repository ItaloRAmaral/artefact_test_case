# Writing a test

## Contents

- Structure
- Names
- Expected values
- Data
- Doubles
- Levels
- Example

## Structure

- **Arrange, Act, Assert**, separated by one blank line, **with no comments**.
- **One Act per test.** Two actions are two tests.
- **No logic in the test:** no `if`, loops or computed expectations deciding what to assert. Logic in a test is code without a test.
- **One behavior per test.** An "and" in the name means two tests.
- **Case tables** (`it.each`, `pytest.mark.parametrize`) are allowed for boundaries and variants, under four conditions: every row has the same behavior and assertion shape; the table holds only literals; the body has no `if`; the name shows the varying value. Success and error cases with different shapes go in separate tables. A table that needs an `if` in its body is two tests pretending to be one.
- Test through the public boundary (the seam), never private functions or internal state.

## Names

- Describe the behavior (what), not the mechanism (how): `rejects creating a task with an empty title`, not `calls schema.parse`.
- In English, like all code. Never invent requirement IDs.

## Expected values

- **Derive them independently:** a literal, a value worked out by hand, or the example from the spec. Never compute the expected value with the code under test or its helpers: that test passes no matter what the code does.
- **No change detectors:** do not assert a constant's value, an exact message, or private structure. Assert the behavior that depends on it (not "`MAX_RETRIES` is 5" but "the sixth attempt never happens").
- Errors are asserted by **code**, never by message.

## Data

- **Factories** with fixed data and overrides: `makeUser({ role: 'admin' })`. Each test creates its own data; no test depends on another's.
- **No randomness without a fixed seed.** Property tests use a fixed seed.
- **Only fake data,** never real or production data.

## Doubles

- **Prefer the real thing.** The repository adapter is already in memory: tests use a fresh real `InMemoryTaskRepository`, never a mock of the port.
- **Fake only at system boundaries:** time and ID generation (injected or fixed), and the network in component tests (pass callbacks or a test tRPC client; never mock your own hooks).
- **Never assert on a double** ("was called with"), unless the call itself is the contract (an e-mail sent, an audit entry written). Assert the outcome a caller sees.
- A fake that accepts anything verifies nothing: each branch (success, error) gets its own fixture.
- Cleanup used only by tests lives in test utilities, never in production code.

## Levels

| Level      | Tool                             | For                                                                                                                                                                                                                           | Notes                                                       |
| ---------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| unit       | Vitest                           | the `Task` entity, each use case (with the in-memory repository), the in-memory repository's ordering and cursor, the shared Zod schema, the tRPC router through `createCaller` (validation, error translation, output shape) | milliseconds; fresh repository and fixed clock/IDs per test |
| component  | Vitest + Testing Library + jsdom | the form (client validation, submit disabled while sending, backend error shown), the delete feedback                                                                                                                         | query by role and label; no snapshot tests                  |
| end to end | Playwright                       | create → see in list → edit → delete with feedback; SSR shows tasks without client fetch                                                                                                                                      | one or two flows against the running app; not edge cases    |

## Example

```ts
describe('task router', () => {
  it('rejects updating a task that does not exist', async () => {
    const caller = makeCaller();

    const promise = caller.task.update({
      id: 'missing-id',
      title: 'Write the README',
    });

    await expect(promise).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
```

In sync code, a `catchError(() => ...)` helper keeps the Act on its own line, and the Assert checks the returned error's `code`. Never `expect(() => ...).toThrow()`, which merges Act and Assert, and never assert on the message.
