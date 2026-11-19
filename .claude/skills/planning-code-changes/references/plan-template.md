# Plan template

## Contents

- What a plan contains, and what it leaves out
- Short plan (in the conversation)
- Detailed plan template
- Task format
- Roadmap template

## What a plan contains, and what it leaves out

A step is done when the implementer can write exactly one reasonable thing from it: unambiguous, not complete.

| Kind of step | Carries |
| --- | --- |
| test | the test name (the behavior, in English) and its assertions, with the exact values from the spec |
| code | the exact signature (name, parameters, return type), the file, and the values the spec pins; a body only for an algorithm the signature and tests do not determine |
| verification | the command and the output that means it passed; take commands from `CLAUDE.md` "Commands", and if a command is not there, ask |
| reference to another task | point to that task's "Interfaces" block; do not repeat its code |

Two failures to avoid: a plan longer than the code it describes has written the code instead; a line that decides nothing ("TBD", "handle edge cases", "add appropriate validation", "write tests for the above", a type no task defines) is a gap.

Tasks: a task is the smallest unit with its own test cycle that a reviewer could approve or reject on its own. Fold setup, configuration and docs into the task whose deliverable needs them. Each task ends with something testable. The last task also sets the plan status to "Done" in its header (and the roadmap status, in the last sub-plan of a roadmap).

Files: one clear responsibility per file; files that change together live together. In existing code, follow the established pattern.

## Short plan (in the conversation)

For a small, local change. No file; the user approves it in the conversation. If writing it shows the domain, a use case, the repository, the router, validation, the tRPC contract or SSR is involved, or the change is not local, stop and write a full plan instead.

````markdown
**Short plan: <the change>**

1. **What changes:** <one or two sentences, with the exact value and its source (spec or request)>
2. **Files:** <list>
3. **What can break:** <edge cases, affected callers, security effect; "nothing" only after searching the code>
4. **Tests:** <test to create or adjust; existing tests that must keep passing>
5. **Questions:** <doubts the spec and code did not answer; empty if none>

Shall I proceed?
````

## Detailed plan template

````markdown
# Plan: <name of the change>

| Field | Value |
| --- | --- |
| Status | Proposed · Approved · Done |
| Date | YYYY-MM-DD |
| Request | <the user's words> |
| Context | <spec sections and docs that define the request, sent or confirmed by the user> |
| Roadmap | <link to the roadmap, if this is a sub-plan> |

**Goal:** <one sentence on what this delivers>

**Architecture:** <two or three sentences on the approach and where the code will live>

## Global constraints

<One line per constraint that applies to every task, with the exact value copied from its source: limits, units, error codes, versions, `CLAUDE.md` rules that matter here.>

## Decisions with the user

| Question | Answer | Date |
| --- | --- | --- |

## Review focus

<Inputs and failures the request implies but no happy-path test exercises: empty, missing, duplicated, out of range, concurrent, malicious, limits, pagination, partial failures, network errors. One line each, with the behavior a reasonable person would expect, most likely first. Each line gets a test in the task that owns the code. An empty list means "checked and found none", never "skipped".>

## Security

| Threat | How this plan handles it | Task and test |
| --- | --- | --- |

<One row per applicable threat (strict input schemas and mass assignment, length limits and page-size cap, XSS in rendered task text, no internals in errors, server-only modules out of client bundles, secrets). If a threat does not apply, say why instead of omitting it.>

## Test plan

| Requirement or review-focus line | Level | Test name | Task |
| --- | --- | --- | --- |

- **Levels used and why:** <which levels from `CLAUDE.md` this plan uses (unit, component, end to end) and why the others do not apply>
- **Test data:** <factories and fixed values; each test creates its own data; nothing random without a seed>
- **Edge and security cases:** <each "Review focus" and "Security" line with the test that proves it>
- **Targets:** <coverage and mutation targets from `CLAUDE.md`>
- **How to run:** <commands from `CLAUDE.md` "Commands"; if missing, ask>

## Style deviations

| Principle broken | Criterion and evidence | Alternative rejected | Review trigger | Impact on tests |
| --- | --- | --- | --- | --- |

<Empty when there is no deviation. Never includes a `CLAUDE.md` hard rule: those are questions to the user.>

---

## Task 1: <component>

(format in "Task format")

---

## Review

| # | Finding | Source | Accepted? | Reason |
| --- | --- | --- | --- | --- |

<Source: self-review or plan-reviewer. A rejected finding stays recorded with its reason.>
````

## Task format

````markdown
## Task N: <component>

**Files:**
- Create: `exact/path/file.ts`
- Modify: `exact/path/existing.ts`
- Test: `exact/path/file.spec.ts`

**Interfaces:**
- Consumes: <what it uses from earlier tasks, with exact signatures>
- Produces: <what later tasks use: names, parameters and return types; for a tRPC procedure, its name, input and output shapes, and error codes>

- [ ] **Step 1: write the failing test**

```ts
it('rejects updating a task that does not exist', async () => {
  const caller = makeCaller();

  const promise = caller.task.update({ id: 'missing-id', title: 'Write the README' });

  await expect(promise).rejects.toMatchObject({ code: 'NOT_FOUND' });
});
```

- [ ] **Step 2: run it and watch it fail**

Command: <from `CLAUDE.md` "Commands"> · Expected: FAIL because `task.update` does not exist

- [ ] **Step 3: implement `UpdateTask.execute(input: UpdateTaskInput): Promise<Task>` in `exact/path/update-task.ts`, throwing `TaskNotFoundError` (`TASK_NOT_FOUND`) when `TaskRepository.findById` returns `null`; the `task.update` procedure calls it, and the error translation maps `TASK_NOT_FOUND` to `NOT_FOUND`**

<One line on the approach, only when the signature and the test leave a choice.>

- [ ] **Step 4: run it and watch it pass**

Command: <...> · Expected: PASS

**Suggested commit:** `feat(<scope>): <...>` · files: <list>
````

Expected errors are errors with a `code`, asserted by `code` with the Act on its own line (see `.claude/rules/tests.md`).

## Roadmap template

Use when the request covers several parts that can each ship and be tested on their own.

````markdown
# Roadmap: <name>

| Field | Value |
| --- | --- |
| Status | Proposed · Approved · Done |
| Date | YYYY-MM-DD |
| Request | <...> |
| Context | <spec sections and docs that define the request> |

**Goal:** <one sentence>

## Decisions with the user

| Question | Answer | Date |
| --- | --- | --- |

## Sub-plans

| # | Sub-plan | Testable deliverable | Tests that prove it | Depends on | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | <name> | <what works> | <levels and main cases> | — | To plan |

## Test strategy for the whole

<How the sub-plans prove themselves together: the Playwright flows across front end and back end, and the coverage target.>

## Interfaces between sub-plans

<The contracts one sub-plan delivers to another: tRPC procedures with input and output shapes, error codes, the shared task schema. Decided here so each sub-plan can be detailed alone.>

## Risks and pending decisions

<Open decisions that block a sub-plan, with the sub-plan affected.>
````

Each sub-plan is then written with the detailed template, one at a time, after the roadmap is approved.
