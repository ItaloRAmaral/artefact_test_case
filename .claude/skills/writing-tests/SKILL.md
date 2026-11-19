---
name: writing-tests
description: Writes and verifies tests in this repository, test-first (red, then green) for new code and as coverage for existing code, deriving scenarios from the spec and the approved plan and, where the spec is silent, from analyzing the code itself (branches, errors, limits, inputs, side effects). Follows AAA without comments, one Act, no logic in tests, behavior-named tests, and checks them with coverage (and mutation testing where configured). Use when writing or changing code under an approved plan, when the user asks for tests, test scenarios or coverage work, or when a bug needs a regression test. Not for planning a change (use planning-code-changes) or reviewing code.
---

# Writing tests

A test earns its place by catching a real break: a wrong branch, a missing check, a wrong value, a broken requirement. Tests here are also part of what the evaluators read, so they follow strict rules (`.claude/rules/tests.md`) and are proven to work, not just to run.

## References

| Open when you need to...                                   | Read                      |
| ---------------------------------------------------------- | ------------------------- |
| find the scenarios to test, from the spec or from the code | `references/scenarios.md` |
| write a test: structure, names, data, doubles, levels      | `references/writing.md`   |
| run the tests, coverage and mutation, and read the results | `references/verifying.md` |

## Ground rules

- **Never infer.** On any doubt about expected behavior, values or names: read the spec, the plan and the code first; if the answer is not there, ask the user. A guessed expected value turns a test into a lie that passes.
- **Every change to code starts from an approved plan** (`CLAUDE.md`). Tests for existing code too: show the scenario list as a short plan, or a full plan if it is large, and wait for approval before writing them.
- **Business behavior the spec does not define** is a question to the user, not a test with a guessed expectation.
- **A failing test on existing code may be a bug.** Never change the expected value to make it pass; stop and report it to the user.
- Ask at most 3 questions per message; talk to the user in their language; never run git commands that create commits or publish.
- Commands come from `CLAUDE.md` "Commands". If the command you need is not there, ask; never guess one, and never run tests with tools borrowed from outside this repository (a global binary, another project's install): a green run there proves nothing here.

## Mode A: test-first, under an approved plan

For each scenario in the plan's "Test plan", one at a time (one test, then the code for it, then the next):

1. **Red.** Write the test (`references/writing.md`). Before writing its body, name the production change that would make it fail.
2. **Verify red.** Run it. It must fail, and fail because the behavior is missing, not because of a typo or an import error. A test that passes now tests nothing new: fix the test.
3. **Green.** Write the minimal production code the plan describes to make it pass. No extra features, no parameters "for later".
4. **Verify green.** Run the test, then the project's whole suite. Every failure goes in the report by name, including ones you did not cause.
5. **Refactor** only with everything green, without adding behavior; the style guide applies.

No production code without a failing test first. If code was written before its test, say so to the user instead of hiding it; the user decides whether to delete it and redo it test-first.

## Mode B: cover existing code

1. Read the code to cover and the spec sections it implements.
2. Build the scenario list (`references/scenarios.md`): from the spec first, then from the code analysis. Mark the source of each scenario.
3. Show it as a short plan (or full plan if large) with the questions. Wait for approval.
4. Write each test (`references/writing.md`). A test written after the code passes at once, so prove it can fail another way: it must kill mutants in a mutation run where one is configured (`references/verifying.md`). Otherwise, list for each test the exact production change that would break it. Never edit production code to prove a test; a forgotten "temporary" break ships.
5. Verify (`references/verifying.md`).

## Hand over

Reply with:

1. **Tests:** files and test names, grouped by source (spec section, plan task, code analysis).
2. **Evidence:** the command output of the run and coverage (and mutation, if run), as printed, not summarized from memory.
3. **Gaps:** uncovered lines, surviving mutants with your reading of each, scenarios left out and why.
4. **Open questions,** if any.
5. **Bugs found:** failing tests on existing code, with the behavior seen and expected.
6. **Commit:** the exact files to stage and a Conventional Commits message (for example `test(api): ...`), ending with the `Co-Authored-By` trailer.
