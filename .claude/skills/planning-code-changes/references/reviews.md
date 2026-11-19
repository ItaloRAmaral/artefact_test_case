# Reviews

## Contents

- When to run the reviewer
- How to dispatch it
- How to handle findings

## When to run the reviewer

Self-review always runs. The `plan-reviewer` agent also runs when **at least one** of these applies, because a gap there is expensive and hard to see from inside the conversation:

1. **It is a roadmap** for several parts ("the back end", "the front end", "the whole test").
2. **It touches the domain, a use case, a port or the repository, or the router**: the CRUD behavior, its errors and the dependency rule.
3. **It touches input validation or error handling**: the task schema, limits, what reaches the client.
4. **It defines or changes the tRPC contract** the UI consumes: procedure names, input and output shapes, error codes, pagination cursor.
5. **It touches SSR and hydration**: the list prefetch, the query client on the server, infinite scroll.

Otherwise, self-review is enough. Tell the user which criterion applied (or that none did) in the hand-over; do not ask each time.

## How to dispatch it

One pass: do not send the plan back for a second review after fixing it; a second loop doubles the time without a measured gain.

Prompt: "Review the plan at `<path>`. It implements this request: `<the user's words>`. Spec sections and context docs: `<paths and headings>`."

Give it the request in full: it has not seen the conversation, and that is why it is useful.

## How to handle findings

1. **Verify before accepting.** For each finding, open the spec, document or code it cites and check that it is true for this plan. Reviewers can be wrong; agreeing without checking just moves the error.
2. **Accept** what is confirmed: fix the plan.
3. **Reject** what is not, with one line saying why.
4. **Ask the user** about anything in "Assumptions to confirm with the user", and about findings you cannot settle from the spec or code.
5. Record every finding in the plan's "Review" table: the source (self-review or `plan-reviewer`), accepted or not, and why.
