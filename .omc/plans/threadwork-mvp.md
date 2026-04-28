# Threadwork MVP — Solo Dev 开发计划 (v2)

**Created**: 2026-04-28
**Revised**: 2026-04-28 (post-critic review)
**Owner**: Solo dev (~10h/week × 8 dev weeks + W0 prep ≤ 3h = 83h budget)
**Target launch**: 2026-06-30 (W9)
**License**: MIT

**v2 changelog**:
- 新增 W0：3h 上游 prior-art 验证（避免直接押 W1 spike）
- W6 砍 memory consolidation；让出 ~5h 给 W7 让 replay UI 真做成 wow 点
- AC10 改为 bench/demo-task.yaml 自动断言（解决"标准任务未定义"问题）
- 风险表替换 R5（consolidation cost）→ Anthropic API dev token budget；新增 R13/R14
- Stop conditions 表加 W0、删 W6 consolidation 行
- 新增第 10 节：Dev meta budget（开发期 token、weekly buffer、alpha tester、`~/.claude.json` UX）

---

## 1. Requirements Summary

**Project**: `threadwork` — npm 包，给 Claude Code 用户提供 CLI-native 多 Agent 协作工具：角色热插拔 yaml + 持久记忆（SQLite + FTS5）+ step-level trace + 静态 HTML replay UI。

**One-line pitch (EN)**: *ruflo for people who hate ruflo's hardcoded roles, and deer-flow with a debugger.*

**Core delta vs prior art**:
- ruflo: 16 roles hardcoded → Threadwork: 1 yaml file = 1 role, hot-reload
- deer-flow: Python server-only → Threadwork: npm 包，原生跑在 Claude Code
- both lack step-level replay → Threadwork: built-in trace + 静态 HTML replay UI

**Tech stack**: TypeScript / pnpm workspaces / `@modelcontextprotocol/sdk` / `better-sqlite3` (FTS5) / `zod` / `chokidar` / `vitest`.

**Out of scope for v0.1**: Web 仪表盘、embeddings/向量检索、**memory consolidation**、telemetry、付费层、多用户、RBAC、Codex/Cursor/Aider 兼容。

---

## 2. Architecture (one screen)

```
~/.claude.json         (MCP server registration)
       │
       ▼
┌──────────────────────────────────────────┐
│  threadwork CLI / MCP Server (stdio)     │
│  ┌────────────────────────────────────┐  │
│  │ Role Loader (yaml + hot-reload)    │  │
│  │ Memory Store (SQLite + FTS5 only)  │  │  ← 无 consolidation
│  │ Trace Recorder (SQLite append)     │  │
│  │ Replay UI Generator (static HTML)  │  │  ← v0.1 wow 点
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
       ▲                 ▲
       │ MCP             │ MCP
┌──────┴──────────┐      │
│ Claude Code     │      │
│ ┌─────────────┐ │      │
│ │ Threadwork  │ │      │
│ │ Skill (.md) │─┼──────┘
│ └─────────────┘ │
└─────────────────┘
```

**Repo layout**:
```
threadwork/
├── packages/
│   ├── cli/               # `threadwork` CLI binary
│   ├── mcp-server/        # MCP stdio server
│   ├── skill/             # Claude Code Skill bundle
│   └── replay-ui/         # static HTML generator
├── roles/                 # 4 default role yamls
├── bench/                 # demo-task.yaml + cost harness
├── docs/
├── .github/workflows/
└── pnpm-workspace.yaml
```

---

## 3. Per-Week Plan

> 每周 ≤10h（W0 ≤3h）。**Verification = run `pnpm test` + check the listed acceptance bullets**。

### Week 0 — Prior-art validation (≤3h, this week, before any setup)

**Goal**: 用最小代价验证 W1 承重墙赌注。失败立即退场，沉没成本最低。

| # | Task | Hours | Verification |
|---|---|---|---|
| 0.1 | 调研 Anthropic Skill spec + Claude Code Agent tool 公开文档与 release notes（2026 Q1-Q2 最新形态、稳定性、breaking changes 节奏） | 1 | 写 `docs/decisions/0000-prior-art.md`，记录 spec URL + 版本 + 关键 API 签名 |
| 0.2 | 找 ≥3 个 prior-art repo 用 Claude Code Skill / Agent tool 控制 sub-agent 行为的实证（ruflo / deer-flow / awesome-claude-code 起步），列出它们各自怎么传 system prompt 给 sub-agent | 1 | prior-art 表写入同一 ADR，每个 repo 给 file:line 引用 |
| 0.3 | 不写任何 threadwork 代码，纯手写最小 `.skill.md` + 一段读 `spike-role.yaml` 的 shell/node 脚本，让 1 个 sub-agent 行为被 yaml 驱动（researcher → 跑 web search；writer → 不跑 web search） | 1 | 同一 prompt 在两个 yaml 下产生可观察分叉 |

**Hard stop condition (W0)**:
- 0.1 找不到稳定的 Skill / Agent tool spec → 退场（项目假设破产）
- 0.3 完全做不出 yaml-driven 行为分叉 → 退场（W1 spike 已知必失败）
- 0.3 行为分叉只出现在某一类 prompt 上 → 限定项目仅支持 declarative role 编排，不做动态决策类 sub-agent

W0 通过才进 W1。

---

### Week 1 — Spike: 内嵌验证 (10h)

| # | Task | Hours | Verification |
|---|---|---|---|
| 1.1 | 基于 W0 结果，构建最小 MCP echo server (`@modelcontextprotocol/sdk` stdio); register in `~/.claude.json`; call from a Claude Code session | 3 | tool 出现在 session, 返回 echo |
| 1.2 | 写最小 skill 在 Claude Code 内 spawn 2 个 sub-agents 并行，prompts 从 `spike-role.yaml` 加载（继承 W0 的成功路径） | 4 | 2 sub-agents 行为按 yaml 分叉 |
| 1.3 | sub-agents 调 `trace_record` MCP tool；events 落到 `spike-traces.sqlite` | 2 | sqlite3 query 返回 ≥4 events |
| 1.4 | 写 `SPIKE_RESULTS.md` go/no-go | 1 | 文档 commit |

**Hard stop condition (W1)**: W0 通过但 W1 失败（说明 Claude Code 内嵌环境有额外约束）→ 退化为 standalone CLI orchestrator + MCP，放弃 Skill 入口。

---

### Week 2 — Repo skeleton + license guardrails (10h)

| # | Task | Hours | Verification |
|---|---|---|---|
| 2.1 | 处理 W1 残留；spike code lifted into proper packages | 3 | git diff 干净 |
| 2.2 | pnpm workspaces, tsconfig, eslint, prettier, vitest; 4 个 package 骨架 | 3 | `pnpm i && pnpm build` 绿 |
| 2.3 | License audit: `license-checker --onlyAllow "MIT;Apache-2.0;BSD-3-Clause;ISC;BSD-2-Clause"` + `LICENSE_AUDIT.md` | 2 | 通过；audit 文档 commit |
| 2.4 | GitHub Actions CI: lint + test + build + license-check on Mac/Linux/Windows matrix | 2 | draft branch 绿 |

**Hard stop condition (W2)**: 关键 dep 需 AGPL/SSPL 且无 MIT 替代 → 替换 dep 或砍掉相关功能。

**Naming check (W2 day 1, 30min)**: `npm view threadwork` + GitHub + `threadwork.dev/.so`。备选：`bastion-agent`, `orchard-agents`, `weave-agents`。

---

### Week 3 — Agent runtime + role loader (10h)

| # | Task | Hours | Verification |
|---|---|---|---|
| 3.1 | Role yaml schema + zod: `name`, `description`, `system_prompt`, `tools_allowed[]`, `budget.max_tokens`, `budget.max_duration_sec` | 3 | 单测含 happy + 4 invalid yaml |
| 3.2 | Role loader: scan `~/.threadwork/roles/*.yaml` (global) + `./.threadwork/roles/*.yaml` (project, override); chokidar hot-reload | 3 | 保存 → loader 在 500ms 内 emit change |
| 3.3 | Skill markdown 包装 Agent tool + role prompts | 2 | smoke 测试产生分叉输出 |
| 3.4 | CLI `threadwork roles list` | 2 | 输出匹配 yaml 文件数 |

---

### Week 4 — 4 default roles + orchestration patterns (10h)

| # | Task | Hours | Verification |
|---|---|---|---|
| 4.1 | 4 role yamls: `researcher`, `coder`, `reviewer`, `writer` | 4 | 每角色过 3-prompt smoke benchmark |
| 4.2 | 编排模式：`research-then-write`（顺序）、`parallel-review`（3 reviewer 投票）、`code-review-fix`（最多 3 轮循环） | 3 | 每模式 1 个 E2E 测试 |
| 4.3 | CLI `threadwork roles {list,show,create <name>}`；`create` 从 template scaffold | 2 | scaffold 产物被 loader 接受 |
| 4.4 | 集成测试：mock LLM 跑 `research-then-write`，断言 role 切换 | 1 | 测试绿 |

---

### Week 5 — Memory MCP: schema + write/recall + bench fixture (10h)

| # | Task | Hours | Verification |
|---|---|---|---|
| 5.1 | SQLite schema: `episodes(id, task_id, role, ts, content, content_fts)`, `facts(id, key, value, confidence, source_episode_id)`, `working_context(session_id, key, value, expires_at)` + FTS5 virtual table | 3 | migration apply 干净；FTS5 query 返回 |
| 5.2 | MCP write tools: `memory_write_episode`, `memory_write_fact`, `memory_set_working` — zod + dedup（content hash）+ 1MB/task 上限 | 3 | 单测覆盖 validation/dedup/cap |
| 5.3 | **决策：v0.1 不做 embeddings，只用 FTS5。** 写 `docs/decisions/0001-no-embeddings-v01.md` | 1 | ADR commit |
| 5.4 | `bench/demo-task.yaml` 固化标准任务（input prompt 字数、目标 episode 数=25、role 序列、token 上限）；`pnpm bench:run` 跑 mock LLM；`pnpm bench:cost` 用最新 Anthropic 公开 pricing 自动投射真实 API cost | 3 | bench 跑出确定性结果；cost 投射写入 `bench/cost-report.json` |

---

### Week 6 — Memory recall + role integration + early replay scaffold (10h)

> v2 变更：**砍掉 consolidation**，让出 5h 给 replay UI 提前起步。

| # | Task | Hours | Verification |
|---|---|---|---|
| 6.1 | MCP recall tools: `memory_recall_episodes(query, k=5)` (FTS5 ranking)、`memory_recall_facts(key)`、`memory_get_working(session_id, key)` | 3 | recall 返回 ranked 结果 |
| 6.2 | 4 default roles 加 `memory_recall` 到 `tools_allowed`；system prompt 增加 memory-aware 指令 | 2 | E2E：writer recall researcher 早期 episode |
| 6.3 | Replay 数据层：定义 trace 树形结构 + JSON dump 格式 + `threadwork replay <task_id> --json` 出 raw JSON（替代 v0.2 fallback 路径） | 3 | 跑过 bench task 后 JSON 含 ≥10 trace events |
| 6.4 | 录第一版粗 demo asciinema（W8 精修，避免反复录制成本爆炸）；保存 `bench/demo.cast` | 2 | 文件 commit；可在终端 replay |

---

### Week 7 — Trace + 精致 replay UI + closed beta (10h)

> v2 变更：**replay UI 时间从 4h 提到 5h；新增 alpha tester recruitment**。

| # | Task | Hours | Verification |
|---|---|---|---|
| 7.1 | MCP `trace_record(task_id, role, event_type, content, parent_event_id?)` + 自动中间件（每个 memory_* 调用自动记 trace） | 2 | 10 memory calls → 10 trace events |
| 7.2 | Replay UI 渲染：单文件 HTML + embedded JSON + vanilla JS timeline（swim-lanes per role + click event detail panel）+ 三浏览器（Chrome/Firefox/Safari）人工 + DOM snapshot test | 5 | 三浏览器视觉一致；DOM snapshot pass |
| 7.3 | Closed beta：在 OMC / Claude Code Discord 拉 5-10 个熟人 alpha tester，分发 preview build + 反馈 issue template | 2 | Discord 频道 ≥5 人；≥3 人确认装机成功 |
| 7.4 | CLI `threadwork replay <task_id> --serve` 用 `open` 包打开浏览器 | 1 | 命令本地启动浏览器 |

**Hard stop condition (W7)**: 7.2 超 7h → 砍精致 UI，仅 ship JSON dump + 极简 HTML viewer，pitch 改为 "with persistent replay" 而非 "with a debugger"。

---

### Week 8 — README + demo 精修 + launch prep (10h)

| # | Task | Hours | Verification |
|---|---|---|---|
| 8.1 | README: hero GIF + 3-line quickstart + badges + "Why not ruflo / deer-flow" 对比表 + Discord 链接 | 3 | github.com 预览正确 |
| 8.2 | demo 精修：基于 W6.4 粗版重录 → asciinema → agg → gif；≤2MB, 30s loop, 无鼠标 | 2 | gif < 2MB |
| 8.3 | docs/: 安装（Mac/Linux/Win）、first-run、自定义 role、troubleshooting；**含 `~/.claude.json` 改写说明 + uninstall cleanup 步骤** | 2 | 新读者 60s 内完成 quickstart |
| 8.4 | 提 PR 到 awesome-claude-code（领先 launch 5-7 天拿反向链接）；Discord 占位 → 正式 server | 2 | PR 开；Discord 上线 |
| 8.5 | `npm publish --dry-run`；版本 `0.1.0`；3 个 HN title 草稿 → `LAUNCH.md` | 1 | dry-run 干净 |

---

## 4. Acceptance Criteria (MVP — end of W8)

| # | Criterion | How to verify |
|---|---|---|
| AC1 | `npm install -g threadwork` 在 macOS / Linux / Windows (含 WSL) 工作 | CI matrix 绿 + 三平台手测 |
| AC2 | `threadwork init` 创建 `~/.threadwork/{roles,db}` + 注册 MCP 到 `~/.claude.json` | 检查文件；`claude mcp list` 显示 `threadwork` |
| AC3 | Claude Code 内调 Threadwork skill spawn ≥2 sub-agents（distinct yaml roles），完成任务，返回聚合结果 | 录 asciinema + mock-LLM E2E 测试 |
| AC4 | `threadwork replay <task_id>` 浏览器打开 timeline，含 ≥2 role swim-lanes、≥10 trace events、memory writes/reads 可见 | 手测 + DOM snapshot |
| AC5 | `threadwork roles create my-role` scaffold 合法 yaml；loader <500ms 接收，无需重启 Claude Code | 计时集成测试 |
| AC6 | `pnpm license-check` 通过，仅 MIT/Apache-2.0/BSD-3/ISC/BSD-2 deps | CI gate 绿 |
| AC7 | README 含：hero GIF、3-line quickstart、"Why not X" 表、≥4 badges、Discord 链接、License 段 | 手测 + linkcheck |
| AC8 | CI 在 main 绿：lint + test + build + license-check + 跨平台 matrix；`cli` & `mcp-server` 行覆盖 ≥70% | GitHub Actions badge 绿 |
| AC9 | E2E smoke `pnpm test:e2e` 跑 `init → run (mock LLM) → replay` exit 0 | CI run |
| **AC10 (v2 改写)** | `bench/demo-task.yaml` 存在；`pnpm bench:run` 在 mock LLM 下 30s 内完成；`pnpm bench:cost` 投射真实 API cost ≤ $0.05（基于最新 Anthropic 公开 pricing），连续 3 次中位数为准 | `bench/cost-report.json` 内自动断言；CI gate |

---

## 5. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | W0/W1 spike 失败：yaml prompts 不能 steer Claude Code sub-agents | Medium | Critical | W0 提前验证；W1 二次硬停 |
| R2 | Anthropic ToS 限制隐藏 agent 循环 / wrapper | Low | Critical | W0 day 1 重读 dev ToS；保持 user-initiated + budget-capped + 无后台 spawn |
| R3 | 传染性 license 通过深层 dep 进来（AGPL/SSPL） | Medium | High | W2 license CI gate；pin 直接 deps |
| R4 | Solo dev burnout / scope creep | High | High | 硬 10h/week + W2 buffer；只砍不加；明确允许 1 周 skip（W10 launch） |
| **R5 (v2 替换)** | Anthropic dev API token budget 失控（W1/W3/W6/E2E 都烧真实 key） | Medium | Medium | W0 day 1 设月度上限 $80；CI 强制 mock LLM；真实 API 调用仅在手动 spike + W7 alpha；CLI 加 `--dry-run` 旗 |
| R6 | Replay UI ambition 超预算 | Medium | Low | W7 hard stop 7h；JSON fallback 已在 W6.3 内嵌 |
| R7 | "Just another wrapper" HN 评论 | High | Medium | "Why not X" 表 + replay UI（真差异化）+ HN title 突出 delta |
| R8 | 命名冲突 npm/GitHub/domain | Medium | Medium | W2 day 1 检查；备选 3 个 |
| R9 | Claude Code Agent tool spec 8 周内变 | **Medium** (v2 上调) | High | W0 调研稳定性；pin minimum Claude Code version；W8 留 2h buffer |
| R10 | Windows path / shell 兼容 | Medium | Medium | CI Win matrix from W2；`path.join`；`cross-env` |
| R11 | Claude Code MCP 注册 UX 摩擦大 → 装机掉率 | Medium | High | `threadwork init` 自动改 `~/.claude.json`（含 backup + dry-run flag + diff 显示 + 与已存 MCP 合并） |
| R12 | 首次 HN/Reddit 帖 24h <50★ | Medium | Medium | 预写 3 标题；失败转 newsletter |
| **R13 (v2 新增)** | `~/.claude.json` 写入损坏用户配置（最敏感文件） | Medium | Critical | W2 专项测试：Win 路径转义、与已有 MCP 合并、uninstall cleanup；init 默认 dry-run + 显式 confirm；自动 `.bak` |
| **R14 (v2 新增)** | demo GIF 反复录制成本爆炸（30s 无鼠标 ≤2MB 通常 5-10 次） | Medium | Low | W6.4 提前录粗版；W8 仅精修；保留 asciinema cast 文件支持快速 retake |

---

## 6. Stop Conditions Summary (decision gates)

| Gate | Trigger | Action |
|---|---|---|
| **W0 end** | 找不到稳定 Skill spec / 完全做不出 yaml-driven 行为分叉 | **退场**（项目假设破产） |
| **W0 end** | 行为分叉仅在某类 prompt 出现 | 限定项目仅支持 declarative role 编排 |
| **W1 end** | W0 通过但 W1 内嵌环境有额外约束 | 退化 standalone CLI + MCP，放弃 Skill 入口 |
| **W2 end** | 关键 dep 需 AGPL 且无 MIT 替代 | 替换 dep 或砍功能 |
| **W2 day 1** | `threadwork` 名被占 | 切备选 |
| **W7 end** | 精致 replay UI 超 7h | 砍 UI，ship JSON dump + 极简 viewer，pitch 降级为 "with persistent replay" |
| **W8 end** | 任意 AC1-AC10 失败 | 修在 W9（launch 顺延）或诚实 ship + 文档说明缺口 |

> v2 变更：删除 W6 consolidation cost stop（consolidation 已砍）；新增 W0 两条。

---

## 7. Verification Plan

- **Per-week**: `pnpm test` + 当周 AC bullets + git commit 结果
- **Per stop gate**: `docs/decisions/` 写 mini-ADR
- **W0 末**：prior-art ADR + spike script demo（commit 到 `experiments/w0/`）
- **W7 末**：alpha tester ≥3 人确认装机成功
- **W8 末**：full E2E + 跨平台 smoke + fresh-reader README review（用 `oh-my-claudecode:critic`）
- **Pre-launch (W8 day 7)**：`npm publish --dry-run` + asciinema 重录 + 3 个 HN 标题

---

## 8. Out of Scope (explicit non-goals)

- ❌ Web 仪表盘 / 托管服务
- ❌ Embeddings / 向量检索（仅 FTS5）
- ❌ **Memory consolidation**（v2 砍掉，移到 v0.2）
- ❌ Multi-user / RBAC / org 账号
- ❌ Telemetry 上报
- ❌ 付费层 / licensing tier
- ❌ Codex / Cursor / Aider 兼容 — Claude Code only for v0.1
- ❌ Plugin marketplace / role registry server
- ❌ 可视化 role editor

W1 issues 里出现这些请求一律 `roadmap-v0.2`。

---

## 9. Post-MVP (W9 — launch week, context only)

- Day -1: awesome-claude-code PR merged
- Day 0 09:00 ET: HN Show + r/LocalLLaMA + X-EN thread
- Day 0 evening: 即刻 + 小红书 (CN, vertical GIF)
- W10: dev.to + 掘金 双语 blog
- W12: v0.2 plan based on alpha + launch feedback（candidates: consolidation 重启、embeddings、web UI、更多 roles）

详见 `LAUNCH.md`，不入 MVP AC。

---

## 10. Dev Meta Budget (v2 新增)

> 防止"工程外的事炸掉项目"。

| 项 | 预算 / 规则 |
|---|---|
| 月度 dev API token cost | ≤ $80（含 spike + alpha + demo 反复录）；超过即停手动调用，转 mock LLM |
| 每周时间分配 | 8h plan + 2h buffer；允许 ≤1 周 skip（launch 顺延 W10）；连续 2 周 skip 触发计划复审 |
| Alpha tester 渠道 | OMC + Claude Code Discord 熟人；W7 closed beta，目标 5-10 人；issue template 强制要求装机环境 + 复现步骤 |
| `~/.claude.json` 安全 | 默认 `.bak` 备份；`init --dry-run` 显示 diff；与现有 MCP entries 合并而非覆盖；`uninstall` 命令做 cleanup；W2 单测覆盖 3 种场景（空文件 / 已有 threadwork / 已有其他 MCP） |
| Demo 录制策略 | W6.4 录粗版本；W8 仅精修；保留 `bench/demo.cast` 支持快速重录；不依赖临时灵感 |
| Bus factor / 健康 | 每周日晚 30min 复盘：是否 burnout、是否需要 skip、是否要复审范围；连续 2 周红灯 → 公开 archive 或转交，不留 dead repo |
