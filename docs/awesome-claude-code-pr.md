# Awesome-Claude-Code PR draft

Target repo: `hesreallyhim/awesome-claude-code`
Target list section: **Skills / Tools** (whichever the maintainer routes it to)

## Suggested entry

```markdown
- [threadwork](https://github.com/REPLACE_OWNER/threadwork) — CLI-native
  multi-agent collaboration for Claude Code. Hot-pluggable role yamls,
  persistent memory MCP (SQLite + FTS5), and step-level trace replay
  rendered as a single static HTML file. Pitch: *ruflo for people who do
  not want hardcoded roles, plus a debugger.* MIT.
```

## PR title

```
Add threadwork: yaml roles + memory MCP + step-level replay
```

## PR body

```markdown
## What

Adds `threadwork` to the list. It is an npm-published CLI plus MCP
server that gives Claude Code three things:

- **Hot-pluggable role yamls** — drop a yaml into
  `~/.threadwork/roles/`; sub-500-ms reload, no Claude Code restart.
- **Persistent memory** — SQLite + FTS5, content-hash dedup, 1 MB per
  task cap. No embeddings, no consolidation — v0.1 stays small on
  purpose.
- **Step-level replay** — every memory call is auto-traced; `threadwork
  replay <task_id>` produces a static HTML file with per-role swim
  lanes and click-to-detail. No framework, no server.

## Why it might fit the list

Most existing entries are either single skills or whole frameworks. Threadwork is a thin layer that adds three production-grade primitives without forcing a framework on the user. The replay UI in particular is something I have not seen anywhere else in the Claude Code ecosystem.

## Status

v0.1.0, MIT, in closed alpha as of <date>. CI green on
macOS/Linux/Windows × Node 20/22. License-checker gate enforces MIT/
Apache-2.0/BSD-3/BSD-2/ISC only on direct + transitive deps.
```

## Reviewer-facing checklist

Maintainers usually look for:

- [ ] License is permissive (MIT)
- [ ] Repo has a working README with quickstart
- [ ] Project is non-trivially distinct from existing entries (compare
      against ruflo, deer-flow, paperclip)
- [ ] Last commit is recent
- [ ] `npm install -g <pkg>` actually works on a clean machine
- [ ] Repo has at least a smoke CI run

Tick at PR time, with evidence. Do not open the PR with empty boxes.

## Timeline

- T-7 days from launch: open PR.
- T-3 days: nudge if no review.
- T-launch day: even if not merged, the PR URL is fine to link from the
  HN post.
