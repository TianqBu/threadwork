# parallel-review

Three reviewers examine the same artefact in parallel. Threadwork
majority-votes on the first token of each verdict.

## When to use

- An artefact (PR, plan, ADR, blog draft) is ready and needs more than one
  set of eyes.
- The cost of a missed defect is real (it will ship, or be hard to undo).
- The reviewers can be the same role (`reviewer` × 3) or distinct
  (`reviewer`, `security-reviewer`, `architect`).

## Steps

Three sub-agent dispatches in parallel, each receives the same artefact.
Each returns a verdict starting with `APPROVED`, `REVISE`, or `REJECT`.

## Verdict aggregation

- Two or more `APPROVED` &rarr; final verdict `APPROVED`.
- Two or more `REJECT` &rarr; final verdict `REJECT`.
- All three different &rarr; default to `REVISE`.

## Worked example

```
/threadwork parallel-review "Review the diff in PR #42 against the
acceptance criteria in .omc/plans/threadwork-mvp.md"
```

Expected transcript shape:

```
[reviewer.review-1]  "APPROVED no issues found"
[reviewer.review-2]  "REVISE handle null in line 17"
[reviewer.review-3]  "APPROVED clean"
final verdict: APPROVED  (2-1)
```

## Stop conditions

- If two reviewers return identical verbatim verdicts, suspect a stuck
  prompt and abort &mdash; the reviewers are not actually independent.
- If reviewer outputs do not start with `APPROVED` / `REVISE` / `REJECT`,
  the role yaml is misconfigured; fix the system_prompt and re-run.
