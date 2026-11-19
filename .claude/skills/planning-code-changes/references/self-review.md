# Self-review

Run every check after the plan is written, with the request and the spec open, as if someone else wrote the plan. Fix each problem in the plan right away.

1. **Coverage.** Each requirement in the request and in the spec sections it touches (including implicit ones: a listed field, a sort order, an example response) maps to a task whose test proves it. Add a task for any requirement without one.
2. **Assumptions.** Every value, name, limit, error code and behavior traces to the spec, the existing code or a recorded answer from the user. Anything that traces to nothing becomes a question to the user, never a default you picked.
3. **Review focus.** For each input class or failure mode the request implies (empty, missing, duplicated, out of range, concurrent, malicious, limits, pagination, partial failure, network error), a task's test exercises it, or it is in "Review focus" with its test added to the owning task.
4. **Security.** Every applicable threat (strict input schemas and mass assignment, length limits and page-size cap, XSS in rendered task text, no internals in errors, server-only modules out of client bundles, secrets) has a row in "Security" with a task and test, or a reason it does not apply. No auth and no database: they are out of scope, not threats to plan.
5. **Hard rules and architecture.** Nothing breaks `CLAUDE.md` or the dependency rule of `.claude/rules/backend.md`; each back-end file sits in the folder that owns it; the "Do not repeat" table holds (no rule in the repository, entities in and out of repositories, codes not sentences). Anything that would break a hard rule is a question to the user, not a task.
6. **Style and deviations.** The design follows `.claude/rules/code-style.md`. Every principle the plan breaks is in "Style deviations" with all five items, and its criterion really applies. Nothing is added "for the future".
7. **Interfaces.** Names, signatures and types match across tasks: what task 3 produces is exactly what task 7 consumes. The UI uses the tRPC contract (procedure, input and output shapes, error codes, date format) exactly as the router defines it.
8. **Decisions and docs.** Each main decision the plan makes has an entry for `docs/DECISIONS.md` in the task that makes it; the README changes when how to run the app changes.
9. **Step scan.** Each step lets the implementer write exactly one reasonable thing. Remove lines that decide nothing; replace function bodies that the signature and tests already determine with the signature.
10. **Proportion.** If the plan is several times longer than the request and code blocks are most of it, it transcribes the program; cut bodies down to signatures, test names and assertions.
11. **Tests are planned, not implied.** "Test plan" maps every requirement, "Review focus" line and "Security" row to a named test at the right level, with its data and the targets in `CLAUDE.md`. Each task is test-first and follows AAA with no comments and no logic.
12. **Context.** The "Context" field lists the spec sections and docs that define the request; every value in the plan comes from them, from the code or from a recorded answer.

An empty "Review focus", "Security", "Test plan" or "Style deviations" section means you checked and found nothing, never that you skipped the check.
