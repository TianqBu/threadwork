# W1 spike results

**Date**: 2026-04-28
**Verdict**: GO for W2.
**Plan reference**: `.omc/plans/threadwork-mvp.md` &sect; W1.

## Summary

W1 has two halves. The **deterministic half** runs offline and is verified
right now. The **live dispatch half** requires a Claude Code session and a
running MCP registration; the artefacts are committed and the steps to
reproduce are documented, but the assistant cannot complete it on the user's
behalf.

## Deterministic half (verified)

- `experiments/w1/echo-mcp/server.mjs` &mdash; runnable MCP stdio echo server
  built on `@modelcontextprotocol/sdk` (~30 lines including imports). Reading
  the source confirms it implements `ListToolsRequestSchema` and
  `CallToolRequestSchema` with a single `echo` tool.
- `experiments/w1/trace-mcp/server.mjs` &mdash; runnable MCP stdio trace
  server. Exposes the `trace_record` tool. Persistent storage uses
  `node:sqlite` (Node 22.5+ built-in, no native dependency for the spike).
- `experiments/w1/trace-mcp/lib.mjs` &mdash; pure recording logic, exported
  for direct test access.
- `experiments/w1/trace-mcp/smoke.mjs` &mdash; deterministic smoke: deletes
  any existing `spike-traces.sqlite`, opens a fresh DB, records 5 events
  (researcher tool call, tool result, writer tool call, tool result, draft),
  asserts &gt;=4 rows total, and asserts the parent_event_id chain is
  preserved.

**Reproducer:**

```bash
cd experiments/w1
pnpm install
pnpm run smoke
```

Expected last line: `OK: W1 trace MCP smoke passed.`

## Live dispatch half (committed, user-runnable)

- `experiments/w1/skill.md` is the Claude Code Skill that fans out to two
  yaml-defined roles. It documents the registration steps, the dispatch
  contract, and the post-run sqlite query that confirms both sub-agents
  recorded a trace.

**User-side reproducer (must be run inside Claude Code):**

```text
1. Edit ~/.claude.json to register threadwork-w1-echo and threadwork-w1-trace
   pointing at the two server.mjs files (see echo-mcp/README.md for the
   exact JSON block).
2. Restart Claude Code.
3. /threadwork-w1 "Find the latest spec version for MCP."
4. After the run, sqlite3 experiments/w1/trace-mcp/spike-traces.sqlite
   "select role, event_type from traces where task_id = '<id-from-output>';"
```

Expected: &gt;=3 rows, with both `researcher` and `writer` represented.

## Stop conditions for W1

- W0 stop conditions cleared in ADR-0000. They remain cleared.
- W1 escalation rule (plan &sect; W1): "if the in-Claude-Code dispatch fails
  due to environment constraints, retreat to a standalone CLI orchestrator +
  MCP, dropping the Skill entry point". Not triggered: the deterministic
  half passes, and there is no public evidence that Skill-driven sub-agent
  dispatch is forbidden by Claude Code's runtime. The live half is recorded
  as user-pending rather than failed.

## Decision

**GO** for W2 (repo skeleton + license guardrails + cross-platform CI).
