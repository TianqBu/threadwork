# Threadwork

CLI-native multi-agent collaboration for Claude Code.

> **Status: pre-release.** README hero, demo GIF, and quickstart land in W8.
> See `.omc/plans/threadwork-mvp.md` for the full plan.

## What it is

Threadwork is an npm package that adds three things to a Claude Code session:

1. **Role yamls you can hot-swap** without restarting Claude Code.
2. **Persistent memory** as an MCP server (SQLite + FTS5).
3. **Step-level trace recording** plus a static HTML replay UI.

## Quickstart (placeholder &mdash; finalised in W8)

```bash
npm install -g threadwork
threadwork init
# restart Claude Code, then in a session:
# /threadwork research-then-write "compare A and B"
threadwork replay <task_id>
```

## License

MIT &mdash; see `LICENSE`.
