# First run

Goal: in 60 seconds, run an orchestration pattern that spawns two roles,
writes to memory, and produces a replay you can open in a browser.

## 0. Prerequisites

You ran `threadwork init`. `claude mcp list` shows `threadwork`.

## 1. Open a Claude Code session

Just `claude` from a directory you are working in. The Threadwork skill is
loaded automatically because the MCP server is registered globally.

## 2. Trigger the research-then-write pattern

In the session, ask Claude to use the Threadwork skill:

```
Use the threadwork skill to research current React state-management
options and then have the writer role draft a one-paragraph recommendation.
```

What happens:

1. The `researcher` role yaml is loaded and its system prompt is applied
   to the first sub-agent.
2. That sub-agent writes its findings to memory as one or more episodes.
3. The `writer` role yaml is loaded; the writer sub-agent recalls those
   episodes via `memory_recall_episodes` and produces the recommendation.
4. Every step writes a row to the `traces` table, automatically.

## 3. Find your `task_id`

Claude prints the `task_id` when the orchestration finishes. It is also
the most recent row in the trace table:

```bash
threadwork replay --last       # convenience: picks the most recent task_id
```

Or, if you saw the id in the session:

```bash
threadwork replay <task_id>
```

The HTML viewer lands at `./.threadwork/replay/<task_id>.html`. Add
`--serve` to open it in your default browser.

## 4. What the replay shows you

- One row per role (a "swim lane"): researcher on top, writer below.
- One block per step: memory writes, recalls, and the role transition.
- Clicking any block opens a detail panel with the full content (the
  prompt, the episode text, the bm25 score on a recall).

This is the wow-point of v0.1. If something looks wrong in the agent's
output, the replay tells you which step produced it.

## 5. Tweak a role and run again

Edit `~/.threadwork/roles/writer.yaml`. The watcher picks up the change in
under 500 ms — no Claude Code restart needed. Re-run the same prompt and
diff the two replays.

## Next

- [custom-role.md](./custom-role.md) — write your own role from scratch
- [troubleshooting.md](./troubleshooting.md) — what to do when something is off
