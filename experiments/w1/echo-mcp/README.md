# W1 echo MCP server

A 30-line MCP stdio server with one tool, `echo`. Used to verify that a
Claude Code session can reach a freshly registered MCP server during a Skill
invocation.

## Run

From `experiments/w1/`:

```bash
pnpm install   # or npm install
node echo-mcp/server.mjs   # blocks on stdio, will not print to stdout
```

## Register in Claude Code

Edit `~/.claude.json` and add the following under `mcpServers`:

```json
{
  "mcpServers": {
    "threadwork-w1-echo": {
      "command": "node",
      "args": ["D:/2026project/threadwork/experiments/w1/echo-mcp/server.mjs"]
    }
  }
}
```

Restart Claude Code, then in a session run:

```
What MCP servers are registered? Use the threadwork-w1-echo server's echo tool with text="hello".
```

The session should report back `hello`. That single round-trip is the W1
acceptance for the echo branch.

## Cleanup

Remove the `threadwork-w1-echo` block from `~/.claude.json` and restart Claude
Code. The W2 `threadwork init` command will automate this with backup + dry-run.
