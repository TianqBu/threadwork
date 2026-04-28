// Threadwork MCP server: registers memory_* and trace_* tools backed by the
// SQLite + FTS5 store. Every memory_* call emits a corresponding trace row
// so the replay UI can reconstruct the timeline. Trace recording errors are
// swallowed (logged to stderr) — trace is an audit side-channel and must not
// fail a successful memory write.

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DatabaseSync } from "./db/index.js";
import {
  writeEpisode,
  writeFact,
  setWorking,
  recallEpisodes,
  recallFacts,
  getWorking,
} from "./memory/index.js";
import { recordTrace } from "./trace.js";

export const MCP_SERVER_NAME = "threadwork-mcp-server";
export const MCP_SERVER_VERSION = "0.1.0";

export interface CreateServerOptions {
  db: DatabaseSync;
}

export function createMcpServer(opts: CreateServerOptions): McpServer {
  const { db } = opts;
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  });

  server.registerTool(
    "memory_write_episode",
    {
      title: "Write episode",
      description:
        "Append an episode (long-term memory row) for a task. Content is hashed and deduped per task; per-task total is capped at 1MB.",
      inputSchema: {
        task_id: z.string().min(1).max(128),
        role: z.string().min(1).max(64),
        content: z.string().min(1),
      },
    },
    async (args) => {
      const result = writeEpisode(db, args);
      safeRecordTrace(db, {
        task_id: args.task_id,
        role: args.role,
        event_type: "memory_write_episode",
        content: JSON.stringify({ deduped: result.deduped, size: args.content.length }),
        episode_id: result.id,
      });
      return jsonResult(result);
    },
  );

  server.registerTool(
    "memory_write_fact",
    {
      title: "Write fact",
      description:
        "Record a key/value fact with optional confidence (0–1) and source episode reference.",
      inputSchema: {
        key: z.string().min(1).max(256),
        value: z.string().min(1),
        confidence: z.number().min(0).max(1).optional(),
        source_episode_id: z.number().int().positive().optional(),
        // Optional context for the auto-trace row.
        task_id: z.string().min(1).max(128).optional(),
        role: z.string().min(1).max(64).optional(),
      },
    },
    async (args) => {
      const { task_id, role, ...factInput } = args;
      const factPayload = factInput.confidence === undefined
        ? { key: factInput.key, value: factInput.value, source_episode_id: factInput.source_episode_id }
        : factInput;
      const result = writeFact(db, factPayload);
      if (task_id && role) {
        safeRecordTrace(db, {
          task_id,
          role,
          event_type: "memory_write_fact",
          content: JSON.stringify({ key: args.key }),
        });
      }
      return jsonResult(result);
    },
  );

  server.registerTool(
    "memory_set_working",
    {
      title: "Set working-memory entry",
      description:
        "Upsert a session-scoped working-memory key. Optional ttl_sec sets an expiry timestamp.",
      inputSchema: {
        session_id: z.string().min(1).max(128),
        key: z.string().min(1).max(256),
        value: z.string(),
        ttl_sec: z.number().int().positive().optional(),
        task_id: z.string().min(1).max(128).optional(),
        role: z.string().min(1).max(64).optional(),
      },
    },
    async (args) => {
      const { task_id, role, ...workingInput } = args;
      const result = setWorking(db, workingInput);
      if (task_id && role) {
        safeRecordTrace(db, {
          task_id,
          role,
          event_type: "memory_set_working",
          content: JSON.stringify({ session_id: args.session_id, key: args.key }),
        });
      }
      return jsonResult(result);
    },
  );

  server.registerTool(
    "memory_recall_episodes",
    {
      title: "Recall episodes",
      description:
        "Search episodes via FTS5 (bm25 ranking). Optional task_id scopes the search; k caps results (default 5, max 50).",
      inputSchema: {
        query: z.string().min(1).max(512),
        task_id: z.string().min(1).max(128).optional(),
        k: z.number().int().positive().max(50).optional(),
      },
    },
    async (args) => {
      const result = recallEpisodes(db, args);
      return jsonResult(result);
    },
  );

  server.registerTool(
    "memory_recall_facts",
    {
      title: "Recall facts",
      description: "Return facts for an exact key, ordered by confidence desc.",
      inputSchema: {
        key: z.string().min(1).max(256),
        limit: z.number().int().positive().max(50).optional(),
      },
    },
    async (args) => {
      const result = recallFacts(db, args);
      return jsonResult(result);
    },
  );

  server.registerTool(
    "memory_get_working",
    {
      title: "Get working-memory entry",
      description:
        "Read a session-scoped working-memory entry. Returns null if missing or expired.",
      inputSchema: {
        session_id: z.string().min(1).max(128),
        key: z.string().min(1).max(256),
      },
    },
    async (args) => {
      const result = getWorking(db, args);
      return jsonResult(result);
    },
  );

  server.registerTool(
    "trace_record",
    {
      title: "Record trace event",
      description:
        "Record a step-level trace event. Memory_* tools auto-trace; call this directly only for custom event types.",
      inputSchema: {
        task_id: z.string().min(1).max(128),
        role: z.string().min(1).max(64),
        event_type: z.string().min(1).max(64),
        content: z.string().optional(),
        parent_event_id: z.number().int().positive().optional(),
        episode_id: z.number().int().positive().optional(),
      },
    },
    async (args) => {
      const result = recordTrace(db, args);
      return jsonResult(result);
    },
  );

  return server;
}

function jsonResult(value: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

interface TraceArgs {
  task_id: string;
  role: string;
  event_type: string;
  content?: string;
  episode_id?: number;
}

function safeRecordTrace(db: DatabaseSync, args: TraceArgs): void {
  try {
    const payload: Record<string, unknown> = {
      task_id: args.task_id,
      role: args.role,
      event_type: args.event_type,
    };
    if (args.content !== undefined) payload.content = args.content.slice(0, 1024);
    if (args.episode_id !== undefined) payload.episode_id = args.episode_id;
    recordTrace(db, payload);
  } catch (err) {
    // trace is audit-only; never fail the primary operation.
    process.stderr.write(
      `[threadwork] trace recording failed: ${err instanceof Error ? err.message : String(err)}\n`,
    );
  }
}
