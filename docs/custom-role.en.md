**English** | [简体中文](./custom-role.md)

# Custom roles

A role is a yaml file. The schema is intentionally narrow.

## Scaffold one

```bash
threadwork roles create my-pm
```

This writes `./.threadwork/roles/my-pm.yaml` (project-local; overrides any
global role with the same name) using a template. The file is validated
before write — bad yaml never lands on disk.

## Schema

```yaml
name: my-pm                    # required, [a-z][a-z0-9-]*
description: |
  Short one-line description of what this role does.
system_prompt: |               # required, >= 1 character
  You are a product manager. When asked about a feature, first list the
  open questions you would need answered before starting work, ranked by
  how much they would change the design.
tools_allowed:                 # required, string[]
  - memory_recall_episodes
  - memory_write_episode
budget:
  max_tokens: 4000             # required, positive int
  max_duration_sec: 60         # required, positive int
```

The full schema lives at `packages/cli/src/role/schema.ts` (zod). Anything
outside the listed keys is rejected with the offending key in the error.

## Where Threadwork looks

In order, with later sources overriding earlier ones:

1. `~/.threadwork/roles/*.yaml` — global, lives across projects.
2. `./.threadwork/roles/*.yaml` — project, takes precedence on name collision.

`threadwork roles list` shows which file each role came from.

## Hot-reload

The loader watches both directories with `chokidar`. On Linux/macOS this
is event-driven; on Windows it falls back to polling. Either way, edits
land in under 500 ms (verified in `role-loader.test.ts`).

While the loader is running, you can:

- Add a new yaml — it appears in `roles list` on next read.
- Edit an existing yaml — next sub-agent spawn uses the new content.
- Delete a yaml — it disappears from the registry.

You do not need to restart Claude Code for any of these.

## Tools the role can call

Threadwork's MCP server exposes a small set of tools. A role can request a
subset via `tools_allowed`:

- `memory_write_episode(task_id, role, content)` — append a fact-shaped
  blob to the episode log.
- `memory_write_fact(key, value, confidence, source_episode_id)` — append
  a structured fact.
- `memory_set_working(session_id, key, value, ttl_sec)` — short-lived
  scratch context.
- `memory_recall_episodes(query, k=5, task_id?)` — bm25 over episodes.
- `memory_recall_facts(key)` — exact-key fact lookup, sorted by confidence.
- `memory_get_working(session_id, key)` — read scratch context (TTL aware).
- `trace_record` — usually you do not call this directly; the auto-trace
  middleware records one row per memory call.

If a role lists a tool not in this set, the loader rejects the file with
an explicit error.

## Sharing a role

Just commit the yaml. There is no registry, no plugin manifest, nothing
to publish. Drop the file in your repo's `.threadwork/roles/` and your
collaborators get the same role on `git pull`.
