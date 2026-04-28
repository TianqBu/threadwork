---
name: threadwork-spike
description: W0 spike — load a yaml role file and prepare to delegate work to a sub-agent driven by that role's system prompt.
argument-hint: <role-yaml-path> <task>
---

# Threadwork W0 Spike

This is a minimal Claude Code Skill used to validate the W0 hypothesis: a yaml file on disk drives a sub-agent's behaviour through prompt assembly.

## What it does

When invoked with `<role-yaml-path> <task>`:

1. Reads the yaml at `$0`.
2. Extracts `system_prompt`, `tools_allowed`, `budget` from the yaml.
3. Asks the parent session to dispatch a sub-agent via the Task/Agent tool, passing the assembled `system_prompt` as part of the delegation message and `$1` as the user task.
4. After the sub-agent returns, calls `trace_record` (if the W1 trace MCP is registered) so the run is logged.

## Run

Inside a Claude Code session that has this directory on its skill path, type:

```
/threadwork-spike experiments/w0/spike-role.researcher.yaml "Find the latest spec version for MCP."
```

Then again with the writer yaml and observe the divergent behaviour (the researcher will fetch and cite; the writer will reshape the input into prose).

## Deterministic offline verification

For W0.3 acceptance the loader script `loader.mjs` shows yaml-driven divergence without invoking any LLM. From this directory:

```bash
node loader.mjs spike-role.researcher.yaml "Find the latest spec version for MCP."
node loader.mjs spike-role.writer.yaml    "Find the latest spec version for MCP."
```

The two outputs differ in `system_prompt`, `tools_allowed`, and `budget`. This is enough to clear the W0 stop-condition; the live LLM dispatch test belongs in W1.

## Limitations

- The skill body cannot itself call the Task/Agent tool (skills are inert prompts; the parent session decides when to delegate). In W1 we register an explicit MCP server that the skill instructs the parent to invoke.
- `argument-hint` lists positional args; in real use the parent session may need to be reminded of the path conventions if the user invokes ambiguously.
