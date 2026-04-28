// Reads a Threadwork SQLite database and returns trace events and episodes
// for a given task_id. Kept minimal so it can be reused by the JSON dump
// (W6) and the polished HTML viewer (W7).

import { createRequire } from "node:module";
import type { TraceEvent, EpisodeRow } from "./types.js";

const _require = createRequire(import.meta.url);

const _sqlite = _require("node:sqlite") as {
  DatabaseSync: new (path: string) => SqliteDb;
};

interface SqliteStmt {
  all(...params: unknown[]): unknown[];
}

interface SqliteDb {
  prepare(sql: string): SqliteStmt;
  close(): void;
}

export interface ReadTaskOptions {
  dbPath: string;
  taskId: string;
}

export interface ReadTaskResult {
  events: TraceEvent[];
  episodes: EpisodeRow[];
}

export function readTask(opts: ReadTaskOptions): ReadTaskResult {
  const db = new _sqlite.DatabaseSync(opts.dbPath);
  try {
    const events = db
      .prepare(
        `SELECT id, task_id, role, event_type, content, parent_event_id, ts
           FROM traces
           WHERE task_id = ?
           ORDER BY id`,
      )
      .all(opts.taskId) as TraceEvent[];
    const episodes = db
      .prepare(
        `SELECT id, task_id, role, ts, content
           FROM episodes
           WHERE task_id = ?
           ORDER BY id`,
      )
      .all(opts.taskId) as EpisodeRow[];
    return { events, episodes };
  } finally {
    db.close();
  }
}

/**
 * Return the task_id of the most recently active task, judged by max(traces.id)
 * with a fallback to max(episodes.id) for tasks that have only memory writes
 * (no explicit trace events). Returns null if the database has no rows.
 */
export function findLastTaskId(dbPath: string): string | null {
  const db = new _sqlite.DatabaseSync(dbPath);
  try {
    const fromTraces = db
      .prepare(
        `SELECT task_id FROM traces ORDER BY id DESC LIMIT 1`,
      )
      .all() as Array<{ task_id: string }>;
    if (fromTraces.length > 0) return fromTraces[0]!.task_id;
    const fromEpisodes = db
      .prepare(
        `SELECT task_id FROM episodes ORDER BY id DESC LIMIT 1`,
      )
      .all() as Array<{ task_id: string }>;
    if (fromEpisodes.length > 0) return fromEpisodes[0]!.task_id;
    return null;
  } finally {
    db.close();
  }
}
