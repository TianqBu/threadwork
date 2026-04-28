[English](./troubleshooting.en.md) | **简体中文**

# 故障排查

alpha 阶段实际坏过的几件事，以及应该去看哪。

## `claude mcp list` 没显示 `threadwork`

三种可能：

1. **`init` 没真把文件写下去。** 重跑 `threadwork init --dry-run`
   读一下它**会**提交什么 diff。看着合理就去掉 `--dry-run`。
2. **你用的不是默认 Claude Code profile。** `init` 默认写
   `~/.claude.json`；profile 在别处的话，传 `--claude-config <路径>`。
3. **合并后的 JSON 坏了。** 看
   `~/.claude.json.bak.<时间戳>`——是合并前的版本。Threadwork 写盘前
   会校验，所以这种情况理论上不会发生；要是真发生了，报 issue 时
   带上备份文件。

## Windows 上角色不热加载

Windows 文件 watcher 对编辑器风格的 "rename + replace" 保存不可靠。
Threadwork 在 `win32` 上用 `chokidar` 加 `usePolling: true`，应该能在
~500 ms 内拾起编辑。要是没拾起：

- 确认文件是在 `~/.threadwork/roles/` 或 `./.threadwork/roles/`，
  没在别的地方。
- 确认 yaml 能通过校验：`threadwork roles list` 应该能列出来。
- 关掉编辑器的原子保存（部分编辑器写到 temp 再 rename，会让
  polling 错乱）。

## `memory_recall_episodes` 啥都没召回

- writer 之前调了 `memory_write_episode` 吗？看 replay。
- FTS5 query 是空的？bm25 给不出零 token query 的排名。
- 用 `task_id` 限定了一个**没有 episode** 的任务？

`threadwork replay <task_id> --json` 会 dump 原始 episode/trace 行，
看一眼数据库里实际是什么。

## `pnpm bench:run` 投射的成本看起来不对

projector 读 `bench/pricing.json`。Anthropic 偶尔会更新 rate card；
更新这份快照再跑。门槛是**3 次跑的中位数**，不是单次——bench 脚本
对 token 加了抖动，模拟真实方差。

## `threadwork replay --serve` 没打开浏览器

`open` 包挑系统默认。在 WSL 上，默认可能是 Linux 侧浏览器，访问不到
那个文件路径。绕过：

```bash
threadwork replay <task_id>    # 写出 html
explorer.exe .threadwork/replay/<task_id>.html   # WSL → Windows 侧打开
```

## `threadwork init` 报无法写 `~/.claude.json`

检查文件权限（Windows: 确认你不是在管理员权限的 shell 里跑——管理员
shell 创建的文件可能只有 Administrator 能读）。

如果上次跑挂了留下了陈旧的 `~/.claude.json.new`，删了再重跑。

## 报 issue

用 `.github/ISSUE_TEMPLATE/alpha-feedback.md` 这个模板。它要求 repro
步骤和环境信息——这是为了让我们能去修；只写 "doesn't work" 的报告
会被关掉。
