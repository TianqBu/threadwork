<p align="center"><img alt="threadwork" src="./docs/assets/logo.svg" width="96"></p>

# Threadwork

[English](./README.en.md) | **简体中文**

> 给 Claude Code 的多 Agent 协作工具：角色 yaml 热插拔 + 持久记忆 + step-level replay。
> *CLI-native multi-agent collaboration for Claude Code.*

[![CI](https://img.shields.io/github/actions/workflow/status/TianqBu/threadwork/ci.yml?branch=main&label=ci)](./.github/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![npm version](https://img.shields.io/npm/v/threadwork-cli?label=npm)](https://www.npmjs.com/package/threadwork-cli)
[![Node](https://img.shields.io/badge/node-%3E%3D22.5-blue)](./package.json)

## 快速上手

```bash
npm install -g threadwork-cli
threadwork init                # 自动注册 MCP 到 ~/.claude.json（带备份 + 原子重命名）
threadwork roles list          # 看一眼默认的四个角色
```

然后在 Claude Code 里直接调用 `threadwork` 技能；任务跑完后用
`threadwork replay <task_id>` 看 step-level 时间线（`--serve` 直接打开浏览器）。

## Demo

asciinema 脚本在 [bench/demo.cast](./bench/demo.cast)。本地用
`node bench/build-gif.mjs` 渲染成 GIF（需要 PATH 上有
[`agg`](https://github.com/asciinema/agg)），渲染产物 `bench/demo.gif`
已 commit，CI 卡死 ≤2 MB。

## 为什么不用 X

| 需求 | ruflo | deer-flow | Threadwork |
|---|---|---|---|
| 不 fork 就能自定义角色 | 否 — 16 个角色硬编码 | 部分 — 改代码 | 是 — 一个 yaml 一个角色 |
| 不重启就能改角色 | 否 | 否 | 是 — chokidar 监听，<500 ms |
| 原生跑在 Claude Code 里 | 否 — 独立 Python server | 否 — 独立 Python server | 是 — npm + MCP，无独立守护 |
| 任务级 replay | 否 | 否 | 是 — 单文件静态 HTML viewer |
| 跨 session 持久记忆 | 否 | 部分 — 向量库 | 是 — SQLite + FTS5，内容哈希去重 |
| 没有 vendor 锁 | 是 | 是 | 是 |

定位：*ruflo 但角色不硬编码；deer-flow 但带个 debugger。*

## 三块东西

可独立使用，也可组合：

1. **可热插拔的角色 yaml。** 把 yaml 丢进 `~/.threadwork/roles/`
   或 `./.threadwork/roles/`（项目级覆盖全局），loader 实时拾取，
   不用重启 Claude Code。
2. **持久记忆 MCP server。** SQLite + FTS5 覆盖 episodes / facts /
   working context；recall 用 bm25 排序。无 embedding，无 consolidation；
   v0.1 故意保持小。
3. **Step-level trace replay。** 每个 memory 调用都自动记 trace。
   `threadwork replay <task_id>` 渲染单文件 HTML，分角色 swim-lane +
   点击查看详情面板。无前端框架，无服务端。

## 状态

预发布，闭源 alpha 阶段。详见
[docs/internal/alpha-beta.md](./docs/internal/alpha-beta.md)（闭源 beta
计划与反馈渠道）。MIT 许可证。

## 文档

- [docs/install.md](./docs/install.md) — 安装、MCP 注册、卸载
- [docs/first-run.md](./docs/first-run.md) — 60 秒跑通第一个 orchestration
- [docs/custom-role.md](./docs/custom-role.md) — 怎么写并分享一个 role yaml
- [docs/troubleshooting.md](./docs/troubleshooting.md) — 跑挂了去看哪儿
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 贡献指南（alpha 阶段先收 issue）
- [SECURITY.md](./SECURITY.md) — 安全报告流程
- [CHANGELOG.md](./CHANGELOG.md) — 版本变更记录

## License

MIT — 见 [LICENSE](./LICENSE)。
