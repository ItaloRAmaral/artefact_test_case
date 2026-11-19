---
name: planning-code-changes
description: Plans every code or configuration change in this repository before it is written, from the user's request plus the spec that defines it, from a small local change (a short plan in the conversation) up to the whole full-stack app (a roadmap of sub-plans), producing a reviewed plan that covers both the code and its tests, with test-first tasks, interfaces between tasks (including the front-end/back-end contract), security, style-guide conformance and justified deviations. Use when the user asks to implement, build, make, create or change code (a feature, endpoint, page, component, module, setup), or asks for an implementation plan. Not for executing an approved plan, for prose docs, or for comment and formatting edits.
---

# Planning code changes

Write the plan an engineer needs to build the change without having seen this conversation: which files, which names and signatures, which values from the spec, which tests prove each task, which threats are handled, and which style principles are broken and why. Everything else the engineer can decide alone, so leave it out.

Every plan plans the tests as carefully as the code: which levels, which cases, which data, which targets. Code without planned tests is how untested edge cases and security holes ship.

The plan is where mistakes are cheapest. A gap found here costs a line; found in review it costs a rewrite. That is why this skill is thorough about coverage and security, and strict about never guessing.

## References

| Open when you need to... | Read |
| --- | --- |
| write a short plan, a full plan or a roadmap (structure, task format, sections) | `references/plan-template.md` |
| run the self-review before showing the plan | `references/self-review.md` |
| decide on the reviewer, dispatch it, handle findings | `references/reviews.md` |

## Ground rules

- **Never infer.** On any doubt about scope, value, name or behavior: read the spec (`docs/SPEC.md`), the code and the docs first. If the answer is not there, ask the user. A guessed value in a plan becomes a guessed value in code, and nobody notices.
- Ask at most 3 questions per message; talk to the user in their language.
- Plans are written in English, in `docs/plans/`.
- Follow `.claude/rules/code-style.md`. Its principles may be broken only with the five items of its "Breaking a principle" section, written in the plan. `CLAUDE.md` hard rules are never broken by a plan; if one is in the way, raise it as a question to the user.
- Never run git commands that create commits or publish; each task lists a suggested commit message for the user.
- This skill only plans. Do not write production code or tests while planning.

## Step 1: Understand and size the request

1. **Get the context.** A plan needs two inputs: the request (what to build) and what defines it (the spec section, a doc, an example). If the user sent only the request, search `docs/SPEC.md` and the docs for the likely definitions, show what you found and ask the user to confirm. Do not plan from the request alone: the definitions are where the values and limits come from.
2. Read the request, the spec sections it touches, `CLAUDE.md`, `.claude/rules/` and the existing code.
3. Size it:

| Size | Signal | What to produce |
| --- | --- | --- |
| no plan | only prose docs, comments or formatting, with no change in behavior | no plan; make the edit and say what changed |
| small | a small, local change, even one the user fully specified | a short plan in the conversation; the user approves it there |
| one deliverable | one feature, endpoint, page or component that ships working and tested on its own | a full plan in `docs/plans/` |
| several parts | parts that could each ship and be tested independently ("the API", "the front end", "the whole test") | a roadmap of sub-plans first; the user approves it; then one full plan per sub-plan, one at a time |

Even a change the user fully specified can leave gaps (an edge case, a caller it breaks, a test it breaks); the short plan exists to catch them. When in doubt between small and one deliverable, write the full plan.

## Step 2: Resolve doubts before writing

1. List every open point: requirements the spec leaves ambiguous, values not in the spec, names, limits, error codes, behavior on edge inputs, stack choices.
2. For each, search the spec, the code and the docs. Record where the answer was found.
3. Ask the user what is left, at most 3 per message, and wait. Record each answer in the plan's "Decisions with the user" section.

Do not start the plan while a decision rests on a guess.

## Step 3: Write the plan

Read `references/plan-template.md`. For a small change, write the short plan in the conversation. Otherwise, write `docs/plans/YYYY-MM-DD-<name>.md` with status "Proposed". The plan decides; it does not transcribe code.

## Step 4: Self-review

Read `references/self-review.md` and run every check. Fix what you find in the plan.

## Step 5: Independent review when the plan is important

Full plans only. Read `references/reviews.md`. If any of its criteria applies, tell the user which one and run `plan-reviewer`, one pass. Verify every finding against the spec and code before accepting it, update the plan, and record the results in the plan's "Review" table.

## Step 6: Hand over

For a short plan, the plan itself is the hand-over: end by asking the user to approve it.

For a full plan or roadmap, reply with:

1. **Plan:** the link, the goal in one sentence, and the number of tasks (or sub-plans, for a roadmap).
2. **Decisions with the user** and **questions still open**, if any.
3. **Deviations** from the style guide, one line each.
4. **Review:** self-review fixes, reviewer findings accepted and rejected, or why the reviewer did not run.
5. **Next step:** ask the user to review and approve the plan (status "Approved") before any code is written.
6. **Commit:** the plan files to stage and a Conventional Commits message with scope `docs`, ending with the `Co-Authored-By` trailer.
