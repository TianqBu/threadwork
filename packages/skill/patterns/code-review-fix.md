# code-review-fix

`coder` produces a change; `reviewer` evaluates. If the verdict is not
`APPROVED`, the reviewer's notes feed back into a second `coder` iteration.
Bounded at three iterations by default.

## When to use

- A single-file bug fix or short feature addition.
- Reviewer feedback is genuinely actionable, not "more cowbell".
- The change does not need a human in the loop for irreversible decisions
  (deployments, deletions, key rotations).

## Steps

For iteration `i = 1..maxIterations`:

1. **coder** receives the original task (iteration 1) or the original task
   plus the prior code plus the reviewer's notes (iteration > 1). Output:
   updated code + change rationale.
2. **reviewer** receives the original task and the latest code. Output:
   verdict (`APPROVED` / `REVISE` / `REJECT`) + cited issues.
3. If verdict starts with `APPROVED`, exit with the latest code as the
   final artefact.

## Worked example

```
/threadwork code-review-fix "Fix the null deref in src/auth/login.ts
when the cookie is missing"
```

Expected transcript shape (success case):

```
[coder.implement i=1]   diff #1
[reviewer.review  i=1]  REVISE missing test for the cookie-missing path
[coder.implement i=2]   diff #2 (adds the test)
[reviewer.review  i=2]  APPROVED
final: diff #2
```

## Stop conditions

- Iteration cap reached without `APPROVED` &rarr; return the last code with
  the open reviewer issues annotated. The user must decide whether to
  ship, escalate, or restart with a different role.
- Reviewer's verdict tokens drift (e.g. emits "looks good!" instead of
  `APPROVED`) &rarr; the role yaml's system_prompt is leaking; tighten it
  and re-run.
- Coder cannot make progress on the same issue across two iterations &rarr;
  abort and escalate to a human, do not let the loop spin.
