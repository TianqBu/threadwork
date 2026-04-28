[English](./install.en.md) | **简体中文**

# 安装

Threadwork 是一个 npm 包加上一个 MCP server。"装好" 包含两步：拿到
binary，然后把 MCP server 注册进 `~/.claude.json` 让 Claude Code 能用。

## 系统要求

- Node.js **>= 22.5**（MCP server 用 `node:sqlite`：Node 22.5 起标
  experimental，Node 24.x 起 stable；Node 20 直接抛
  `ERR_UNKNOWN_BUILTIN_MODULE`）。已发布的 npm 包通过 `engines.node`
  强制这个版本。
- Claude Code（任何近期版本，支持用户级 MCP server 即可）。
- 全局 SQLite 记忆文件大约占 10 MB 磁盘空间。

## macOS / Linux

```bash
npm install -g threadwork-cli
threadwork --version           # 确认装好了
threadwork init                # 注册 MCP server，写入默认 role
```

`threadwork init` 干这些事：

- 写 `~/.threadwork/roles/{researcher,coder,reviewer,writer}.yaml`
  （仅当文件不存在时）
- 准备 `~/.threadwork/db/threadwork.sqlite`（首次写记忆时创建）
- 在 `~/.claude.json` 的 `mcpServers.threadwork` 下加一条记录

写盘前会把 `~/.claude.json` 备份到 `~/.claude.json.bak.<时间戳>`。想先
看会改什么再下手：

```bash
threadwork init --dry-run
```

## Windows

PowerShell：

```powershell
npm install -g threadwork-cli
threadwork --version
threadwork init
```

Windows 特别注意：

- MCP 注册写的是正斜杠路径；Claude Code 用了非默认 profile 的话，
  传 `--claude-config <路径>` 给 init。
- `threadwork init` 写入 UTF-8 无 BOM。某些编辑器保存时会偷加 BOM
  把 JSON 弄坏；手动改的话务必保存为 UTF-8 (no BOM)。
- 已经有 `mcpServers` 块时 init 会**合并**进去，不覆盖兄弟键。先
  `--dry-run` 看一眼合并结果再写盘。

## `~/.claude.json` 安全改写协议

`~/.claude.json` 是 Threadwork 触碰的最敏感文件。`init` 流程按这个
顺序保证安全：

1. **读取。** 解析现有文件（不存在时从 `{}` 起步）。
2. **备份。** 把原文件原样写到 `~/.claude.json.bak.<unix-时间戳>`。
   如果原文件能正常解析，备份是字节级副本。
3. **合并。** Threadwork 只动 `mcpServers.threadwork` 一个键。其他
   所有键——包括其他 MCP server、project 条目、账号设置——一律保留。
4. **校验。** 合并后的对象 JSON.stringify 再 parse 一次；任何失败
   就在写盘前抛错。
5. **写入。** 原子重命名：先写到 `~/.claude.json.new`，fsync，
   再 rename 覆盖。只有新文件落地成功，原文件才会被替换。

如果 1–4 任何一步失败，**不会发生写盘动作**，原文件原样保留。
备份文件留着。

## 卸载

```bash
threadwork uninstall           # 移除 mcpServers.threadwork 条目；保留记忆 db
threadwork uninstall --purge   # 同时删 ~/.threadwork/{roles,db}
npm uninstall -g threadwork-cli
```

`uninstall` 走和 `init` 一样的备份协议。`--purge` 会删掉你的角色和
记忆；只想让 Claude Code 不再调 Threadwork 但保留这些文件，就别加
`--purge`。

## 验证

```bash
claude mcp list                # 应该列出 "threadwork"
threadwork roles list          # 应该列出 4 个默认角色
```

`claude mcp list` 没显示 `threadwork`，看
[troubleshooting.md](./troubleshooting.md)。
