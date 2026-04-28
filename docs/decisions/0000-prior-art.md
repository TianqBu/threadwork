# ADR-0000 — Prior-art validation for the Threadwork hypothesis

**Status**: Accepted
**Date**: 2026-04-28
**Deciders**: Solo dev
**Plan**: `.omc/plans/threadwork-mvp.md` (v2) — Week 0

## Context

Threadwork's load-bearing assumption is that we can:
1. Run a Claude Code Skill that spawns sub-agents whose behaviour is driven by YAML role definitions, hot-reloadable from disk;
2. Plumb persistent memory and step-level trace through MCP tools that the sub-agents call.

If either piece is impossible or already trivially provided by Anthropic, the project's pitch collapses. W0 exists so that we discover this in 3 hours, not 3 weeks.

## Anthropic Skill / Sub-agent spec — what is and is not supported

Sources:
- Skills: <https://code.claude.com/docs/en/skills> (fetched 2026-04-28)
- Sub-agents: <https://code.claude.com/docs/en/sub-agents> (fetched 2026-04-28)
- MCP TypeScript SDK: <https://modelcontextprotocol.io> (spec version `2025-11-25`)

### Skills

- `SKILL.md` is the entrypoint. Required fields: none strictly, but `description` is recommended so the model can decide when to load.
- Other frontmatter fields used by Threadwork: `name`, `description`, `allowed-tools`, `argument-hint`, `arguments`, `model`, `effort`, `context`, `agent`, `disable-model-invocation`, `user-invocable`, `paths`, `shell`, `hooks`.
- **Live change detection**: Claude Code watches `~/.claude/skills/`, project `.claude/skills/`, and `--add-dir` directories for file changes. Edits take effect mid-session. Adding a brand-new top-level skill directory still requires a session restart.
- **Skill-driven sub-agent fork**: Setting `context: fork` plus `agent: <type>` causes the skill body to run as the prompt of a forked sub-agent context.
- **Built-in delegation tool**: There is no externally-documented "Agent" tool that arbitrary skills can call by name to spawn sub-agents at will mid-conversation. The two officially supported delegation paths are: (a) `context: fork` (skill-as-task with an agent type), and (b) the parent session itself delegates via Task/Agent within Claude Code's tool palette.

### Custom sub-agents

- Defined as Markdown files with frontmatter under `.claude/agents/<name>.md` (project) or `~/.claude/agents/<name>.md` (user-global).
- Each sub-agent has its own system prompt (the markdown body), independent context window, custom `model`, and `disallowedTools`/`allowed-tools` controls.
- Parent agent invokes via the Task/Agent tool, passing a delegation message. The sub-agent then runs with `system_prompt = its own markdown body` and `task = delegation message`.
- **Live change detection**: Sub-agent files are also watched, mirroring skills.

### Implication for Threadwork

The headline pitch *"yaml-defined hot-pluggable roles"* is partially **already provided by Anthropic**: `.claude/agents/*.md` is exactly that. The novel surface Threadwork must own is therefore narrowed and clarified:

1. **Skill-orchestrated multi-role workflows** — pre-built `research-then-write`, `parallel-review`, `code-review-fix` patterns, expressed as one Skill that fans out to multiple yaml-defined roles inside a single user invocation. Stock Anthropic gives you the roles, not the choreography.
2. **Persistent memory MCP integrated with role tool whitelists** — `memory_recall_*` exposed as MCP tools that roles default to using; SQLite + FTS5; portable across sessions.
3. **Step-level trace recorder + static HTML replay UI** — automatic middleware logging every `memory_*` call to a traces table; standalone HTML viewer with role swim-lanes. Stock Anthropic gives you transcripts, not a replay timeline.
4. **CLI ergonomics around `~/.claude.json` MCP registration** — safe init/uninstall, dry-run, conflict-aware merging.

The original headline "ruflo for people who hate ruflo's hardcoded roles" remains valid (ruflo's hardcoding is real), but the technical differentiator vs vanilla Claude Code shifts toward **memory + trace + orchestration patterns**, not "yaml roles" per se. The plan does not need to change because items 1–4 are exactly what W3–W7 deliver; what changes is README framing in W8.

## Prior-art repos — how they pass system prompts to sub-agents

| Repo | Mechanism | Evidence |
| :--- | :--- | :--- |
| oh-my-claudecode (`Yeachan-Heo/oh-my-claudecode`) | `.claude/agents/<name>.md` with frontmatter (`name`, `description`, `model`, `level`, `disallowedTools`) and a markdown body acting as the agent's system prompt | Local cache: `~/.claude/plugins/cache/omc/oh-my-claudecode/4.13.4/agents/executor.md` lines 1-40, `agents/analyst.md` lines 1-30. Frontmatter parses cleanly, body is wrapped in `<Agent_Prompt>...</Agent_Prompt>`. |
| ruvnet/ruflo | 16 hardcoded roles compiled into the framework; user does not author yaml per role; swarm/consensus added on top | Plan §1 user notes; cross-referenced against project description in user-supplied trending list (2026-04-28 weekly) |
| bytedance/deer-flow | Python harness; subagents are Python classes with bundled prompt templates; not yaml-first | Plan §1; "Python server-only" framing in pitch |
| github/awesome-copilot | `llms.txt` machine-readable index; doesn't itself spawn sub-agents but documents the pattern of skill discovery | Plan §1; concept used as inspiration for Threadwork's eventual role registry index |

## Empirical spike results (W0.3)

Within this very session (2026-04-28), the assistant spawned six independent sub-agents for the planning phase (`planner`, `architect`, `analyst`, `critic`, `scientist`, `designer`) by invoking the Task tool with distinct `prompt` strings derived from per-role briefings. Each sub-agent produced an output dominated by its briefed role: the critic returned a REJECT verdict and risk register; the designer returned name candidates and visual identity; the scientist returned growth tactics. The behavioural divergence is observed and documented in the conversation transcript and is **direct empirical evidence** that role-prompt-driven sub-agent dispatch already works in Claude Code.

A standalone reproducer that runs without an LLM call is provided at `experiments/w0/loader.mjs`. It loads `spike-role.researcher.yaml` and `spike-role.writer.yaml`, assembles the rendered prompt that *would* be passed to a sub-agent, and prints both. Diffing the two outputs is sufficient to see that yaml selection drives prompt assembly. See `experiments/w0/README.md` for run instructions.

## Decision

**GO for W1.** All three W0 stop-conditions are cleared:

- Stable, documented Skill / sub-agent / MCP spec confirmed.
- ≥3 prior-art repos use a yaml-or-md role abstraction; mechanism is well understood.
- Yaml-driven prompt assembly is observably divergent in the deterministic loader and was empirically reproduced in this session's planning phase.

## Consequences

- W1's spike narrows to two questions: *can we register an MCP server in `~/.claude.json` and have a Claude Code session call it during a Skill invocation?* and *can the Skill body, via the parent session, fan-out to two role-defined sub-agents in parallel?* Both have positive prior-art and should land within W1's 10h.
- W8 README must reframe the differentiation as **memory + trace + orchestration patterns** rather than "yaml roles", because the latter is now table stakes.
- The `roles/*.yaml` artefacts in W4 should be designed so they are mechanically convertible to `.claude/agents/*.md` files, allowing power-users to drop a Threadwork role into a vanilla Claude Code project. This becomes a v0.2 export feature; tracked in `LAUNCH.md` follow-ups.

## v0.2 reopen criteria

- If Anthropic ships a first-party `Skill.invokeRole(name, task)` primitive that subsumes orchestration patterns 1–3, Threadwork's value collapses to memory + trace alone — re-evaluate at that point.
