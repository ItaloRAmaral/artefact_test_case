# Verifying

## Contents

- Order of checks
- Coverage
- Mutation
- Reporting results

## Order of checks

1. **The new or changed tests**, alone: in Mode A, watch them fail first, then pass.
2. **The whole suite of the project.** A green file is not a green suite; every failure is reported by name, including ones you did not cause.
3. **Coverage** of the project (below).
4. **End to end** (`pnpm test:e2e`) when the change touches a flow it covers.
5. **Mutation** on the changed files, only if the user asks (not configured; below).

Take every command from `CLAUDE.md` "Commands". If one is missing, ask; do not guess flags.

## Coverage

- Target: at least 90% of lines and branches in `src/server/**` (`CLAUDE.md` "Tests"). The threshold lives in the Vitest configuration, not in this skill; the run's own output is the evidence.
- An uncovered branch is a scenario to add (`scenarios.md`), or code nothing needs (tell the user), never a reason to add an exclusion. Each exclusion carries its reason in the config.

## Mutation

Mutation testing changes the production code in small ways (a flipped condition, a removed call, a different constant) and reruns the tests. A mutant the tests do not notice ("survivor") marks behavior no test really checks. That is why it proves tests written after the code (Mode B), which never had a red step.

- **Where:** not configured in this project (decided with the user on 2026-11-19); run it only if the user asks.
- **Scope:** only the changed files, so feedback stays fast.
- **For each survivor:**
  1. read the mutant: which line, what changed;
  2. if a test should have caught it, add or fix that test, and run again;
  3. if no input could tell the mutant apart from the original (an equivalent mutant), do not hide it: list it for the user with your reasoning, and the user decides.
- Never weaken an assertion, delete a test or lower a threshold to raise a score.

## Reporting results

- Paste the numbers as the tools printed them. Reported numbers are verified by the output, not by memory.
- List survivors and uncovered lines with file and line, and what you did about each.
