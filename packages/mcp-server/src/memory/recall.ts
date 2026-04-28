// Memory recall tools: memory_recall_episodes, memory_recall_facts,
// memory_get_working. FTS5-ranked when free-text matching, key-equality
// otherwise. All three are pure functions over a DatabaseSync so the W6
// integration tests can drive them without an MCP transport.

import { z } from "zod";
import type { DatabaseSync } from "../db/index.js";

export const RecallEpisodesInput = z
  .object({
    query: z.string().min(1).max(512),
    task_id: z.string().min(1).max(128).optional(),
    k: z.number().int().positive().max(50).default(5),
  })
  .strict();
export type RecallEpisodesInput = z.infer<typeof RecallEpisodesInput>;

export const RecallFactsInput = z
  .object({
    key: z.string().min(1).max(256),
    limit: z.number().int().positive().max(50).default(10),
  })
  .strict();
export type RecallFactsInput = z.infer<typeof RecallFactsInput>;

export const GetWorkingInput = z
  .object({
    session_id: z.string().min(1).max(128),
    key: z.string().min(1).max(256),
  })
  .strict();
export type GetWorkingInput = z.infer<typeof GetWorkingInput>;

export interface RecalledEpisode {
  id: number;
  task_id: string;
  role: string;
  ts: string;
  content: string;
  rank: number;
}

export function recallEpisodes(db: DatabaseSync, raw: unknown): RecalledEpisode[] {
  const input = RecallEpisodesInput.parse(raw);
  const sql = input.task_id
    ? `SELECT episodes.id, episodes.task_id, episodes.role, episodes.ts,
              episodes.content, bm25(episodes_fts) AS rank
         FROM episodes_fts
         JOIN episodes ON episodes.id = episodes_fts.rowid
         WHERE episodes_fts MATCH ? AND episodes.task_id = ?
         ORDER BY rank
         LIMIT ?`
    : `SELECT episodes.id, episodes.task_id, episodes.role, episodes.ts,
              episodes.content, bm25(episodes_fts) AS rank
         FROM episodes_fts
         JOIN episodes ON episodes.id = episodes_fts.rowid
         WHERE episodes_fts MATCH ?
         ORDER BY rank
         LIMIT ?`;
  const params = input.task_id
    ? [input.query, input.task_id, input.k]
    : [input.query, input.k];
  return db.prepare(sql).all(...params) as RecalledEpisode[];
}

export interface RecalledFact {
  id: number;
  key: string;
  value: string;
  confidence: number;
  source_episode_id: number | null;
  ts: string;
}

export function recallFacts(db: DatabaseSync, raw: unknown): RecalledFact[] {
  const input = RecallFactsInput.parse(raw);
  return db
    .prepare(
      `SELECT id, key, value, confidence, source_episode_id, ts
         FROM facts
         WHERE key = ?
         ORDER BY confidence DESC, id DESC
         LIMIT ?`,
    )
    .all(input.key, input.limit) as RecalledFact[];
}

export interface WorkingContextEntry {
  session_id: string;
  key: string;
  value: string;
  expires_at: string | null;
  ts: string;
}

export function getWorking(db: DatabaseSync, raw: unknown): WorkingContextEntry | null {
  const input = GetWorkingInput.parse(raw);
  const row = db
    .prepare(
      `SELECT session_id, key, value, expires_at, ts
         FROM working_context
         WHERE session_id = ? AND key = ?`,
    )
    .get(input.session_id, input.key) as WorkingContextEntry | undefined;
  if (!row) return null;
  if (row.expires_at && Date.parse(row.expires_at) < Date.now()) return null;
  return row;
}
