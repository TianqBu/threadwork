[English](./first-run.en.md) | **简体中文**

# 第一次跑起来

目标：60 秒内跑通一个 orchestration pattern——会 spawn 两个角色、写
一次记忆、产出一个浏览器能打开的 replay。

## 0. 准备

你已经跑过 `threadwork init`，`claude mcp list` 列出了 `threadwork`。

## 1. 进 Claude Code session

在你正在工作的目录下直接 `claude`。Threadwork skill 会自动加载，
因为 MCP server 已经全局注册了。

## 2. 触发 research-then-write 模式

在 session 里让 Claude 用 Threadwork skill：

```
Use the threadwork skill to research current React state-management
options and then have the writer role draft a one-paragraph recommendation.
```

发生了什么：

1. 加载 `researcher` 角色 yaml，把它的 system prompt 套到第一个
   sub-agent 上。
2. 那个 sub-agent 把调研发现以一条或多条 episode 写进记忆。
3. 加载 `writer` 角色 yaml；writer sub-agent 通过
   `memory_recall_episodes` 召回那些 episode，产出推荐结论。
4. 每一步都自动写一行进 `traces` 表。

## 3. 找你的 `task_id`

orchestration 跑完时 Claude 会打印 `task_id`。它也是 trace 表里最
新一行：

```bash
threadwork replay --last       # 便捷写法：用最新 task_id
```

或者你看到了 session 里的 id：

```bash
threadwork replay <task_id>
```

HTML viewer 落到 `./.threadwork/replay/<task_id>.html`。加 `--serve`
直接在默认浏览器打开。

## 4. Replay 里能看到啥

- 每个角色一行（一条 swim lane）：researcher 在上，writer 在下。
- 每一步一个块：memory 写、memory 召回、角色切换。
- 点任意块会展开详情面板——完整 prompt、完整 episode 文本、召回时
  的 bm25 分数。

这是 v0.1 的 wow-point。如果 agent 输出哪儿不对劲，replay 会告诉你
是哪一步搞砸的。

## 5. 改一个角色，再跑一次

编辑 `~/.threadwork/roles/writer.yaml`。watcher 500 ms 内就会拾起
变化——不用重启 Claude Code。重新跑同一个 prompt，diff 一下两次的
replay。

## 下一步

- [custom-role.md](./custom-role.md)——从零写一个自己的角色
- [troubleshooting.md](./troubleshooting.md)——出问题去看哪儿
