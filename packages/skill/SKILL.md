---
name: threadwork
description: Run a Threadwork orchestration pattern over your yaml-defined roles. Use when the user asks for "research-then-write", "parallel-review", or "code-review-fix" workflows in Claude Code.
argument-hint: <pattern> <task>
---

# Threadwork

Threadwork dispatches work across yaml-defined roles, records step-level
traces to SQLite, and lets you replay the run as a static HTML timeline.

The full pattern catalogue ships in W4. For now this is a placeholder so the
W2 packaging gate has something to publish. The W4 update will define:

- `research-then-write` &mdash; sequential pipeline.
- `parallel-review` &mdash; three reviewers vote, majority wins.
- `code-review-fix` &mdash; reviewer-driven loop, max 3 iterations.

Each pattern picks roles from `~/.threadwork/roles/*.yaml` (or the project
override under `./.threadwork/roles/`) and instructs the parent session to
delegate via the Task / Agent tool.
