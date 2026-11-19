# Finding scenarios

## Contents

- Sources, in order
- Reading the code for scenarios
- When the spec is silent
- Scenario list format

## Sources, in order

1. **The approved plan:** "Test plan", "Review focus" and "Security" (Mode A takes its scenarios from here).
2. **The spec** (`docs/SPEC.md`): every stated requirement, and the implicit ones (listed fields, sort orders, example payloads, validation hints).
3. **The code itself**, below. This is what finds the cases the spec never mentions.

## Reading the code for scenarios

Test at the public boundary of the unit (its seam: the entity's public methods, a use case's `execute`, the repository's port methods, a tRPC procedure through `createCaller`, a component's rendered output and user events), never private functions. For each public entry point, walk through:

| Look for                                                   | Scenario it gives                                                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| each branch (`if`, `switch` case, ternary, early `return`) | one scenario per side of the branch                                                                                                              |
| each error raised or returned, with its code               | the input that triggers it, and the code expected                                                                                                |
| each validation or guard                                   | just inside and just outside the accepted range                                                                                                  |
| boundaries                                                 | zero, one, many; empty and missing; minimum, maximum, maximum + 1; pagination edges                                                              |
| state changes                                              | the state before and after; an invalid transition                                                                                                |
| side effects (save, log, event, request sent)              | that it happens on success and does not happen on failure                                                                                        |
| input that comes from a user                               | malformed, unknown fields (`id`, `createdAt` sent on create), whitespace-only title, over the length limit, script content shown as text         |
| ordering and pagination                                    | two tasks with the same `createdAt` (tie-break), first page, last page, empty list, a deletion between two pages, a cursor that no longer exists |
| time                                                       | `createdAt` is set by the server, never taken from the input; time frozen with fake timers in tests                                              |
| UI states                                                  | loading, empty, error, success; submit disabled while sending; backend error shown; client validation error shown before any request             |
| how callers really use it                                  | the realistic sequence of operations: interleaved calls, reuse after an error, retry                                                             |

For each scenario, name the break it catches: the production change that would make the test fail. A scenario that catches no plausible break is not worth a test, but list it under "left out" with the reason, so the user sees what was cut.

**Public contract vs internal detail.** Everything the module exports, and every field of every value it returns, is public contract and may be tested; asserting it is not a change detector. Only what never leaves the module is internal. Check the exports and return types in the code before deciding; do not ask the user what the code already answers.

## When the spec is silent

| Scenario                                                                                         | What to do                                                                                                |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| business behavior (what a user may or may not do, what a value must be) the spec does not define | ask the user; write the test only after the answer, and record it in the plan's "Decisions with the user" |
| technical behavior (a contract between modules, an invariant)                                    | name the test with a plain description of the behavior                                                    |
| code behavior that contradicts the spec                                                          | a bug or a misread spec: stop and ask                                                                     |

## Scenario list format

Show this to the user before writing tests for existing code (Mode B), as the short plan's "Tests" item or the full plan's "Test plan":

| #   | Scenario                        | Source              | Level     | Test name                                     | Break it catches                       |
| --- | ------------------------------- | ------------------- | --------- | --------------------------------------------- | -------------------------------------- |
| 1   | task without a title is refused | spec §2, Validation | unit      | `rejects creating a task with an empty title` | `.min(1)` is removed from the schema   |
| 2   | updating a missing task fails   | spec §2, Validation | unit      | `rejects updating a task that does not exist` | `UpdateTask` skips the not-found check |
| 3   | form blocks an empty title      | spec §3, Form       | component | `does not submit when the title is empty`     | the form skips the schema check        |
