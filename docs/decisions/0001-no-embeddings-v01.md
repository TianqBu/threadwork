# ADR-0001 — No embeddings in v0.1; FTS5 only

**Status**: Accepted
**Date**: 2026-04-28
**Plan**: `.omc/plans/threadwork-mvp.md` &sect; W5

## Context

The Threadwork MCP server stores memory in three tables (`episodes`,
`facts`, `working_context`) and supports recall by content. The plan calls
out two recall strategies:

1. SQLite **FTS5** full-text index over `episodes.content`.
2. Vector **embeddings** over the same column, retrieved by cosine
   similarity.

W5's scope is to ship one of these for v0.1.

## Forces

- Solo dev with a 10h/week budget; eight weeks total.
- Install ergonomics matter: `npm install -g threadwork-cli` should work on
  macOS / Linux / Windows without C++ build tools or model downloads.
- Memory recall quality is necessary but not differentiating &mdash; the
  v0.1 wow point is the replay UI, not vector search.
- License hygiene: any embedding model dropped into the install path adds
  a transitive license to audit.

## Decision

**Ship FTS5 only in v0.1.** No embeddings, no vector store, no model
download.

## Why

- FTS5 is built into the SQLite that Node 22.5+ ships natively (via
  `node:sqlite`). No additional dependency, no native compile, no model
  weights, no runtime tokenizer. Install path stays one `npm i` command.
- FTS5 BM25 ranking is sufficient for "find episodes about X" within the
  memory model Threadwork actually uses (per-task, per-session). The
  recall corpus is small (1MB/task cap, &lt;100k episodes lifetime in any
  realistic single-user workflow).
- Embedding-based recall would force a second decision: which model. None
  of the obvious choices (sentence-transformers, OpenAI text-embedding-*,
  Voyage, Cohere) are zero-friction, zero-cost defaults.
- Replay UI is the W7 differentiator the launch pitch hangs on. Reducing
  W5/W6 scope buys time for W7 to be polished rather than rushed.

## Alternatives considered

| Option | Why rejected |
| :--- | :--- |
| Local embeddings via `@xenova/transformers` | Adds ~80 MB of model weights to first install; download path is a new failure mode. License is okay, but startup latency is bad. |
| Embeddings via Anthropic / OpenAI APIs at recall time | Adds a real-API call to a default-on path; conflicts with the "primarily mock LLM in dev" budget rule (R5 in the plan). |
| `better-sqlite3` + `sqlite-vec` extension | Native compile required; sqlite-vec is too new to bet on for v0.1. |
| Skip recall entirely; require user to query SQL | Defeats the "memory MCP" framing. Roles need a single MCP tool, not a SQL prompt. |

## Reopen criteria for v0.2

Reopen this decision if any of the following hold:

- A user reports recall quality is materially worse than expected on real
  workloads (BM25 misses obvious paraphrases).
- Anthropic ships first-party embeddings with usage in the Claude API tier
  the project already targets (i.e. the cost falls to zero for active
  users).
- A node-native embeddings runtime appears that does not require model
  download at install time.

Until then: FTS5 is the plan of record.
