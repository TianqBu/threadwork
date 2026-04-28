# Changelog

**简体中文** | [English](#english)

本文件记录所有 user-visible 变化。格式遵循
[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循
[Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

闭源 alpha 中。变化按 W7 计划走 closed beta，反馈通过
`.github/ISSUE_TEMPLATE/alpha-feedback.md` 收。

## [0.1.0] - 2026-04-28

首个 MVP。9 周计划（W0-W8）按时完成。

### 新增

- **角色 yaml + 热加载。** `~/.threadwork/roles/` 与
  `./.threadwork/roles/` 双层加载，项目级覆盖全局。chokidar 监听，
  Linux/macOS 事件驱动，Windows polling 回退；500 ms 内拾起改动。
- **持久记忆 MCP server。** SQLite + FTS5 覆盖 episodes / facts /
  working context；recall 用 bm25 排序。content-hash 去重，1 MB
  per-task 上限。
- **Step-level trace replay。** 每次 memory 调用自动记 trace；
  `threadwork replay <task_id>` 渲染单文件静态 HTML，分角色 swim-lane
  + 点击展开详情；`--serve` 用 `open` 包打开默认浏览器。
- **`threadwork init` / `uninstall`。** ~/.claude.json 改写按
  read → backup → merge → validate → atomic rename 协议；任何中间
  失败都不会写盘。`--dry-run` 看 diff 不写盘。`uninstall --purge`
  连 ~/.threadwork 一起删。
- **4 个默认角色。** researcher / coder / reviewer / writer，每个
  yaml 都过 zod 校验，system_prompt >= 200 字符。
- **3 个 orchestration 模式。** research-then-write、parallel-review、
  code-review-fix。
- **Bench harness。** `bench/demo-task.yaml` + `pnpm bench:run` +
  `pnpm bench:cost`，30 秒内跑完，cost projection 在 $0.05 上限以下
  （3 次中位数 $0.0348）。
- **跨平台 CI。** Mac/Linux/Windows × Node 22/24 全绿。
- **License gate。** license-checker 仅放行
  MIT/Apache-2.0/BSD-3/BSD-2/ISC/CC0/CC-BY/0BSD/Unlicense。
- **双语 README + 4 篇 user docs。** 默认中文，可切换英文。

### 已知约束

- `node:sqlite` 是 Node 22.5+ experimental；`engines.node` pin
  `>=22.5.0`。
- `bench/demo.gif` 是 43 字节占位符；公开 launch 前需重录。
- 闭源 alpha 不接收 PR，详见 `CONTRIBUTING.md`。

---

## English

This file records all user-visible changes. Format based on [Keep a
Changelog](https://keepachangelog.com/en/1.1.0/); versioning per
[SemVer](https://semver.org/).

## [Unreleased]

Closed alpha. Changes follow the W7 plan; feedback collected via
`.github/ISSUE_TEMPLATE/alpha-feedback.md`.

## [0.1.0] - 2026-04-28

First MVP. The 9-week plan (W0-W8) shipped on schedule.

### Added

- **Role yamls with hot-reload** under both `~/.threadwork/roles/` and
  `./.threadwork/roles/` (project overrides global). chokidar watcher,
  event-driven on Linux/macOS, polling fallback on Windows; <500 ms.
- **Persistent memory MCP server.** SQLite + FTS5 over episodes /
  facts / working context; bm25-ranked recall. Content-hash dedup,
  1 MB per-task cap.
- **Step-level trace replay.** Every memory call auto-traced;
  `threadwork replay <task_id>` renders a single static HTML with
  per-role swim-lanes + click-to-detail; `--serve` opens via `open`.
- **`threadwork init` / `uninstall`.** ~/.claude.json rewrite follows
  read → backup → merge → validate → atomic-rename; any intermediate
  failure leaves the original file byte-identical. `--dry-run` shows
  the diff without writing. `uninstall --purge` also wipes
  ~/.threadwork.
- **Four default roles** — researcher / coder / reviewer / writer.
  Each yaml validates against the zod schema, system_prompt >=200
  chars.
- **Three orchestration patterns** — research-then-write,
  parallel-review, code-review-fix.
- **Bench harness.** `bench/demo-task.yaml` + `pnpm bench:run` +
  `pnpm bench:cost`; runs in <30s, cost projection under $0.05 ceiling
  (3-run median $0.0348).
- **Cross-platform CI.** Mac/Linux/Windows × Node 22/24 all green.
- **License gate.** license-checker only allows MIT/Apache-2.0/
  BSD-3/BSD-2/ISC/CC0/CC-BY/0BSD/Unlicense.
- **Bilingual README + 4 user docs.** Chinese-default with English
  toggle.

### Known constraints

- `node:sqlite` is experimental in Node 22.5+; `engines.node` pinned
  to `>=22.5.0`.
- `bench/demo.gif` is a 43-byte placeholder; needs re-recording before
  public launch.
- Closed alpha does not accept PRs (see `CONTRIBUTING.md`).
