// Step-level trace recorder. Provides:
//   1. recordTrace(db, ...) — direct insert for the MCP `trace_record` tool.
//   2. withAutoTrace(fn, ctx) — HOF that records a trace event for every
//      call to the wrapped function. Used to auto-instrument memory_*
//      tools so role authors do not need to call trace_record by hand.

import { z } from "zod";
import type { DatabaseSync } from "./db/index.js";

export const RecordTraceInput = z
  .object({
    task_id: z.string().min(1).max(128),
    role: z.string().min(1).max(64),
    event_type: z.string().min(1).max(64),
    content: z.string().default(""),
    parent_event_id: z.number().int().positive().nullable().optional(),
    episode_id: z.number().int().positive().nullable().optional(),
  })
  .strict();
export type RecordTraceInput = z.infer<typeof RecordTraceInput>;

export interface RecordTraceResult {
  id: number;
}

export function recordTrace(db: DatabaseSync, raw: unknown): RecordTraceResult {
  const input = RecordTraceInput.parse(raw);
  const info = db
    .prepare(
      `INSERT INTO traces (task_id, role, event_type, content, parent_event_id, episode_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.task_id,
      input.role,
      input.event_type,
      input.content,
      input.parent_event_id ?? null,
      input.episode_id ?? null,
    );
  return { id: Number(info.lastInsertRowid) };
}

export interface AutoTraceContext {
  db: DatabaseSync;
  task_id: string;
  role: string;
  event_type: string;
}

/**
 * Wrap a memory function so every successful call records a trace event.
 * The wrapped function's return value is unchanged. Errors propagate; no
 * trace is recorded on error so failures do not pollute the timeline.
 *
 * If the wrapped function returns an object with a numeric `id` field
 * (e.g. writeEpisode -> { id: number }), that id is recorded on the
 * trace as `episode_id`, so the replay UI can link a trace event to its
 * source episode without role-side bookkeeping.
 */
export function withAutoTrace<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  ctx: AutoTraceContext,
): (...args: TArgs) => TReturn {
  return (...args: TArgs): TReturn => {
    const result = fn(...args);
    recordTrace(ctx.db, {
      task_id: ctx.task_id,
      role: ctx.role,
      event_type: ctx.event_type,
      content: summariseArgs(args),
      episode_id: extractEpisodeId(result),
    });
    return result;
  };
}

function extractEpisodeId(result: unknown): number | null {
  if (result && typeof result === "object" && "id" in result) {
    const id = (result as { id: unknown }).id;
    if (typeof id === "number" && Number.isInteger(id) && id > 0) return id;
  }
  return null;
}

function summariseArgs(args: unknown[]): string {
  try {
    return JSON.stringify(args[args.length - 1] ?? null).slice(0, 1024);
  } catch {
    return "<unserialisable>";
  }
}
