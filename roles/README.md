**简体中文** | [English](#english)

# 默认角色

这四份 yaml 是 Threadwork 装上之后默认放进 `~/.threadwork/roles/`
的角色集。规则的 schema 在
[../docs/custom-role.md](../docs/custom-role.md)。

| 角色 | 干啥 | 啥时候用 |
|---|---|---|
| `researcher` | 调研外部信息、给每个论断加 URL 或 file:line 引用 | 任务需要从当前上下文之外抓新信息时 |
| `coder` | 按规格写代码：读 codebase、规划最小可行 diff、改文件、跑测试 | "加这个函数 / 修这个 bug / 重构这个文件" 这一类 |
| `reviewer` | 按 acceptance criteria 审查产出，挑逻辑漏洞、漏掉的 edge case、隐含假设 | coder/writer/researcher 出活之后过第二双眼睛 |
| `writer` | 把零散笔记整理成有结构的叙事 | researcher 已经把材料收齐，需要一份可读 artefact 时 |

每份 yaml 都包含：

- `name`：lowercase + hyphen
- `description`：召唤指南（一两句话）
- `system_prompt`：每个 sub-agent 实际看到的 prompt
- `tools_allowed`：白名单——loader 拒绝列出名单外的工具
- `budget.max_tokens` / `max_duration_sec`：硬上限，超出 fail-fast

要改其中任何一个角色，把对应 yaml 复制到 `./.threadwork/roles/`
（项目级覆盖全局），不要直接改 `~/.threadwork/roles/` 里的文件——
那样 `threadwork init` 之后会被覆盖。

---

## English

These four yamls are the default role set that lands in
`~/.threadwork/roles/` after install. Schema docs:
[../docs/custom-role.en.md](../docs/custom-role.en.md).

| Role | What it does | When to use |
|---|---|---|
| `researcher` | Investigates topics, cites every claim with a URL or file:line reference | When the task needs fresh info from outside the current context |
| `coder` | Implements code changes precisely as specified — reads, plans the smallest viable diff, edits, runs tests | "add this function / fix this bug / refactor this file" tasks |
| `reviewer` | Critiques output against acceptance criteria; surfaces logic defects, missing edge cases, unstated assumptions | After a coder / writer / researcher has produced output that needs a second pair of eyes |
| `writer` | Turns raw notes into polished narrative prose | After a researcher has gathered material and the task needs a readable artefact |

Each yaml contains:

- `name` — lowercase + hyphen
- `description` — one or two sentences on when to summon
- `system_prompt` — the prompt each sub-agent actually sees
- `tools_allowed` — whitelist; the loader rejects tools outside it
- `budget.max_tokens` / `max_duration_sec` — hard caps, fail-fast on
  exceedance

To customise any of these, copy the yaml into `./.threadwork/roles/`
(project-local; project overrides global). Do not edit the files in
`~/.threadwork/roles/` directly — they will be overwritten on the next
`threadwork init`.
