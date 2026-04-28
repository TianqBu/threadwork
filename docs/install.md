# Install

Threadwork is an npm package plus an MCP server. Installing means: getting
the binary, then registering the MCP server in `~/.claude.json` so Claude
Code can talk to it.

## Requirements

- Node.js **>= 20.10** (the MCP server uses `node:sqlite`, which is stable
  in Node 22.5+ and shipped final in Node 24; on Node 20 it works behind a
  flag — Threadwork sets the flag for you).
- Claude Code (any recent version that supports user-level MCP servers).
- ~10 MB of disk for the global SQLite memory file.

## macOS / Linux

```bash
npm install -g threadwork-cli
threadwork --version           # sanity check
threadwork init                # registers MCP server, writes default roles
```

`threadwork init` writes:

- `~/.threadwork/roles/{researcher,coder,reviewer,writer}.yaml` (only if missing)
- `~/.threadwork/db/threadwork.sqlite` (created on first memory write)
- An entry in `~/.claude.json` under `mcpServers.threadwork`

It also takes a backup of `~/.claude.json` to `~/.claude.json.bak.<timestamp>`
before writing. If you want to see the proposed change without applying it:

```bash
threadwork init --dry-run
```

## Windows

PowerShell:

```powershell
npm install -g threadwork-cli
threadwork --version
threadwork init
```

A few Windows-specific notes:

- The MCP registration writes the binary path with forward slashes; if
  Claude Code is configured for a non-default profile, point `init` at it
  with `--claude-config <path>`.
- `threadwork init` writes UTF-8 without BOM. Some editors will add a BOM
  on save and break the JSON; if you hand-edit the file, make sure you save
  as UTF-8 (no BOM).
- If you have an existing `mcpServers` block, `init` merges into it — it
  does not overwrite siblings. Run with `--dry-run` first if you want to
  inspect the merge.

## Safe rewrite of `~/.claude.json`

`~/.claude.json` is the single most sensitive file Threadwork touches. The
`init` flow guarantees the following, in this order:

1. **Read.** Parse the existing file (or start from `{}` if it does not exist).
2. **Backup.** Write the original verbatim to `~/.claude.json.bak.<unix-ts>`.
   If the original parsed cleanly, the backup is a byte-identical copy.
3. **Merge.** Threadwork only touches the `mcpServers.threadwork` key. Every
   other key — including other MCP servers, project entries, and account
   settings — is preserved.
4. **Validate.** The merged document is JSON-stringified and parsed back
   before being written, so a malformed merge fails before any disk write.
5. **Write.** Atomic rename: write to `~/.claude.json.new`, fsync, rename.
   The original is replaced only if the new file lands successfully.

If anything in steps 1–4 fails, no write happens and the original file is
left untouched. The backup remains.

## Uninstall

```bash
threadwork uninstall           # removes mcpServers.threadwork entry; keeps memory db
threadwork uninstall --purge   # also deletes ~/.threadwork/{roles,db}
npm uninstall -g threadwork-cli
```

`uninstall` honours the same backup protocol as `init`. `--purge` deletes
your roles and memory; if you want to keep them but stop Claude Code from
talking to Threadwork, drop `--purge`.

## Verifying

```bash
claude mcp list                # should show "threadwork"
threadwork roles list          # should show 4 default roles
```

If `claude mcp list` does not show `threadwork`, see
[troubleshooting.md](./troubleshooting.md).
