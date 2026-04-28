---
name: threadwork
description: Run a Threadwork orchestration pattern (research-then-write, parallel-review, code-review-fix) over your yaml-defined roles. Use when the user asks to chain multiple roles, review work across reviewers, or iterate on code with a feedback loop.
argument-hint: <pattern> <task>
---

# Threadwork

Threadwork dispatches work across yaml-defined roles, records step-level
traces to SQLite, and lets you replay the run as a static HTML timeline.

## Patterns

This skill supports three orchestration patterns. Pick the one that matches
the task; the parent session is responsible for invoking the corresponding
sub-agents and recording trace events.

### research-then-write

Sequential pipeline. The `researcher` role gathers cited facts; the
`writer` role turns those notes into prose. Use when the task is "produce
a written artefact about X" and X needs investigation first.

See [`patterns/research-then-write.md`](./patterns/research-then-write.md).

### parallel-review

Three reviewers (`reviewer` × 3 by default) examine the same artefact in
parallel and emit verdicts. Threadwork majority-votes on the first token
of each verdict (`APPROVED` / `REVISE` / `REJECT`). Use when a piece of
work needs more than one set of eyes and the cost of a missed defect is
real.

See [`patterns/parallel-review.md`](./patterns/parallel-review.md).

### code-review-fix

`coder` produces a change; `reviewer` evaluates. If the verdict is not
`APPROVED`, the reviewer's notes feed back into a second `coder`
iteration. The loop bounds at three iterations by default. Use for
single-file bug fixes or short feature additions where reviewer feedback
is genuinely actionable.

See [`patterns/code-review-fix.md`](./patterns/code-review-fix.md).

## Pre-conditions

Before invoking the skill the parent session should:

1. Have `threadwork-cli` installed and on `PATH`.
2. Have the Threadwork MCP server registered in `~/.claude.json` (run
   `threadwork init` once; details land in W7).
3. Have at least the four default roles installed: `researcher`, `coder`,
   `reviewer`, `writer`. `threadwork roles list` should show them.

## Invocation contract

`/threadwork <pattern> <task>`

- `<pattern>` &mdash; one of `research-then-write`, `parallel-review`,
  `code-review-fix`.
- `<task>` &mdash; a free-form description of what to produce.

The skill body instructs the parent session to:

1. Generate a stable `task_id` (e.g. ULID).
2. For each step in the chosen pattern, dispatch a sub-agent via the
   Task / Agent tool with `system_prompt` set to the relevant role yaml's
   `system_prompt` and `prompt` set to the step's input message.
3. After each step, call the Threadwork MCP server's `trace_record` tool
   with the `task_id`, the step's `role`, an `event_type`, and the output.
4. Once the pattern completes, return the final artefact and emit a
   `complete` trace event.

Roles are loaded from `./.threadwork/roles/*.yaml` (project) overriding
`~/.threadwork/roles/*.yaml` (global). Hot-reloads are picked up by the
running CLI without restarting Claude Code.
