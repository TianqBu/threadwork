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
