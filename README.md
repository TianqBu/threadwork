<!-- logo: placeholder until docs/assets/logo.svg lands in W8.5 -->
<p align="center"><img alt="threadwork logo" src="./docs/assets/logo.svg" width="96" onerror="this.style.display='none'"></p>

# Threadwork

> CLI-native multi-agent collaboration for Claude Code.
> 给 Claude Code 用户的多 Agent 协作工具：角色 yaml 热插拔 + 持久记忆 + step-level replay。

[![CI](https://img.shields.io/github/actions/workflow/status/REPLACE_OWNER/threadwork/ci.yml?branch=main&label=ci)](./.github/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![npm version](https://img.shields.io/npm/v/threadwork-cli?label=npm)](https://www.npmjs.com/package/threadwork-cli)
[![Node](https://img.shields.io/badge/node-%3E%3D20.10-blue)](./package.json)
[![Discord](https://img.shields.io/badge/discord-join-5865F2)](https://discord.gg/REPLACE_INVITE)

## Quickstart

```bash
npm install -g threadwork-cli
threadwork init                # registers MCP server in ~/.claude.json (with backup)
threadwork roles list          # see the four bundled roles
```

Then in a Claude Code session, the `threadwork` skill becomes available;
trigger one of the orchestration patterns and inspect what happened with
`threadwork replay <task_id>` (or `--serve` to open it in your browser).

## Demo

A scripted asciinema cast lives at [bench/demo.cast](./bench/demo.cast).
Render it to a gif with `node bench/build-gif.mjs` (needs
[`agg`](https://github.com/asciinema/agg) on PATH); the rendered hero
gif is committed at `bench/demo.gif` and gated to ≤2 MB by CI. The cast
is intentionally slim — the goal is to show you the shape of the tool
in 30 seconds, not to be impressive.

## Why not X

| Need | ruflo | deer-flow | Threadwork |
|---|---|---|---|
| Define your own role without forking | no — 16 roles hardcoded | partial — code-side | yes — one yaml file = one role |
| Hot-reload roles without restart | no | no | yes — chokidar watcher, sub-500 ms |
| Runs natively inside Claude Code | no — separate Python server | no — separate Python server | yes — npm + MCP, no separate daemon |
| Step-level replay for any past task | no | no | yes — single-file static HTML viewer |
| Persistent memory across sessions | no | partial — vector store | yes — SQLite + FTS5, content-hash dedup |
| Free of vendor lock | yes | yes | yes |

The framing: *ruflo for people who do not want hardcoded roles, plus a
debugger so you can actually see what your agents did.*

## What it is

Three pieces you can use independently or together:

1. **Role yamls you can hot-swap.** Drop a yaml into `~/.threadwork/roles/`
   or `./.threadwork/roles/` (project overrides global). The loader picks it
   up while Claude Code is still running.
2. **Persistent memory MCP server.** SQLite + FTS5 over episodes, facts, and
   working context. Recall is bm25-ranked. No embeddings, no consolidation —
   v0.1 stays small on purpose.
3. **Step-level trace replay.** Every memory call is auto-traced. `threadwork
   replay <task_id>` produces a single static HTML file with per-role
   swim-lanes and a click-to-detail panel. No framework, no server.

## Status

Pre-release, in closed alpha. See [docs/alpha-beta.md](./docs/alpha-beta.md)
for the closed beta plan and feedback channels. Licensed under MIT.

## Docs

- [docs/install.md](./docs/install.md) — install, MCP registration, uninstall
- [docs/first-run.md](./docs/first-run.md) — your first orchestration in 60 s
- [docs/custom-role.md](./docs/custom-role.md) — write and publish a role yaml
- [docs/troubleshooting.md](./docs/troubleshooting.md) — what to check when it breaks

## License

MIT — see [LICENSE](./LICENSE).
