---
name: threadwork-w1
description: W1 spike — fan a single user task out to two role-driven sub-agents in parallel and record their step traces.
argument-hint: <task>
---

# Threadwork W1 spike

This skill is the W1 acceptance for "skill spawns two sub-agents in parallel
with prompts loaded from spike-role.*.yaml". The skill body is the prompt
that drives the parent session's behaviour.

## Setup expected before invocation

- `experiments/w1/` `pnpm install` has been run.
- Both spike MCP servers are registered in `~/.claude.json`:
  - `threadwork-w1-echo` &rarr; `experiments/w1/echo-mcp/server.mjs`
  - `threadwork-w1-trace` &rarr; `experiments/w1/trace-mcp/server.mjs`
- The role yamls from W0 exist at `experiments/w0/spike-role.{researcher,writer}.yaml`.

## What this skill instructs the parent session to do

When invoked with `<task>`:

1. Read the assembled prompts for both roles by running:
   - `node experiments/w0/loader.mjs experiments/w0/spike-role.researcher.yaml "$ARGUMENTS"`
   - `node experiments/w0/loader.mjs experiments/w0/spike-role.writer.yaml "$ARGUMENTS"`
2. Dispatch two sub-agents in parallel via the Task / Agent tool. The
   delegation message for each sub-agent must include the corresponding
   assembled prompt verbatim as the role contract.
3. Each sub-agent must call the `threadwork-w1-trace` MCP server's
   `trace_record` tool at least once with `role` set to its yaml-defined name
   and `task_id` set to a stable identifier shared across both sub-agents.
4. After both sub-agents return, the parent session calls `trace_record` once
   more with `event_type = "complete"` and a short summary of the outputs.
5. Confirm by querying `spike-traces.sqlite`: rows for the chosen `task_id`
   should be &gt;= 3 (one per sub-agent + completion event).

## Acceptance for the live test

- Both sub-agent outputs are present and stylistically distinct (researcher
  cites; writer renders prose).
- `sqlite3 experiments/w1/trace-mcp/spike-traces.sqlite "select role, event_type from traces where task_id = '...';"`
  returns &gt;= 3 rows with at least one `role = researcher` and one
  `role = writer`.

## Notes

- The deterministic part of the W1 acceptance (\>=4 rows in the smoke run) is
  already covered by `pnpm run smoke` from `experiments/w1/`, which exercises
  `lib.mjs` directly.
- The live sub-agent dispatch test must be run inside a Claude Code session
  by a human; the assistant cannot register MCP servers in someone else's
  `~/.claude.json` without their consent.
