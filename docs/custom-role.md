[English](./custom-role.en.md) | **简体中文**

# 自定义角色

一个角色就是一个 yaml 文件。schema 故意做得很窄。

## 用脚手架生成一个

```bash
threadwork roles create my-pm
```

这会写出 `./.threadwork/roles/my-pm.yaml`（项目级；和同名全局角色
冲突时它优先），用一个模板填好。文件**写盘前**会先校验——非法
yaml 永远不会落到磁盘上。

## Schema

```yaml
name: my-pm                    # 必填，正则 [a-z][a-z0-9-]*
description: |
  一两句话描述：什么时候该召唤这个角色，什么时候不该。
system_prompt: |               # 必填，至少 1 个字符
  You are a product manager. When asked about a feature, first list the
  open questions you would need answered before starting work, ranked by
  how much they would change the design.
tools_allowed:                 # 必填，string[]
  - memory_recall_episodes
  - memory_write_episode
budget:
  max_tokens: 4000             # 必填，正整数
  max_duration_sec: 60         # 必填，正整数
```

完整 schema 见 `packages/cli/src/role/schema.ts`（zod）。任何不在列出
的键之外的字段都会被拒绝，错误信息里会带上违规的 key。

## Threadwork 在哪找角色

按下面顺序加载，**后者覆盖前者**：

1. `~/.threadwork/roles/*.yaml`——全局，跨项目共享。
2. `./.threadwork/roles/*.yaml`——项目级，名字相同时优先。

`threadwork roles list` 会显示每个角色来自哪个文件。

## 热加载

loader 用 `chokidar` 监听两个目录。Linux/macOS 上是事件驱动；
Windows 上回退到 polling。哪种方式，编辑都在 500 ms 内被拾起
（`role-loader.test.ts` 验证过）。

loader 跑着的时候你可以：

- 加一个新 yaml——下一次读取时就会出现在 registry 里。
- 改一个已有的 yaml——下一次 spawn sub-agent 时就用新内容。
- 删一个 yaml——它会从 registry 消失。

任何一项都不需要重启 Claude Code。

## 角色能调哪些工具

Threadwork 的 MCP server 暴露一组很小的工具集。角色通过
`tools_allowed` 申请其中一部分：

- `memory_write_episode(task_id, role, content)`——往 episode 日志
  追加一条 fact-shaped 数据。
- `memory_write_fact(key, value, confidence, source_episode_id)`——
  追加一条结构化 fact。
- `memory_set_working(session_id, key, value, ttl_sec)`——短期 scratch
  上下文。
- `memory_recall_episodes(query, k=5, task_id?)`——episode 上的 bm25。
- `memory_recall_facts(key)`——按 key 精确查 fact，按 confidence 排序。
- `memory_get_working(session_id, key)`——读 scratch 上下文（识别 TTL）。
- `trace_record`——一般你不需要直接调；auto-trace 中间件会替每次
  memory 调用记一行 trace。

如果角色 `tools_allowed` 列出了不在这个集合里的工具，loader 会用一条
明确的错误拒绝这个文件。

## 分享一个角色

直接 commit 这个 yaml。没有 registry，没有插件 manifest，没有要
publish 的东西。把文件丢到你 repo 的 `.threadwork/roles/`，
`git pull` 之后协作者就拿到了同一个角色。
