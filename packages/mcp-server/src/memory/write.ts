// Memory write tools: memory_write_episode, memory_write_fact,
// memory_set_working. Implemented as pure functions that take a DatabaseSync
// handle so they are testable without spawning the MCP transport.

import { createHash } from "node:crypto";
import type { DatabaseSync } from "../db/index.js";
import {
  PER_TASK_BYTE_CAP,
  SetWorkingInput,
  WriteEpisodeInput,
  WriteFactInput,
} from "./types.js";

export interface WriteEpisodeResult {
  id: number;
  deduped: boolean;
}

export function writeEpisode(db: DatabaseSync, raw: unknown): WriteEpisodeResult {
  const input = WriteEpisodeInput.parse(raw);
  const size = Buffer.byteLength(input.content, "utf8");
  if (size > PER_TASK_BYTE_CAP) {
    throw new Error(`episode content exceeds 1MB cap (${size} bytes)`);
  }

  const sumRow = db
    .prepare(`SELECT COALESCE(SUM(size), 0) AS total FROM episodes WHERE task_id = ?`)
    .get(input.task_id) as { total: number };
  if (sumRow.total + size > PER_TASK_BYTE_CAP) {
    throw new Error(
      `task ${input.task_id} would exceed 1MB cap (current ${sumRow.total}, adding ${size})`,
    );
  }

  const hash = createHash("sha256").update(input.content).digest("hex");

  const existing = db
    .prepare(`SELECT id FROM episodes WHERE task_id = ? AND content_hash = ?`)
    .get(input.task_id, hash) as { id: number } | undefined;
  if (existing) {
    return { id: existing.id, deduped: true };
  }

  const info = db
    .prepare(
      `INSERT INTO episodes (task_id, role, content, content_hash, size)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(input.task_id, input.role, input.content, hash, size);

  return { id: Number(info.lastInsertRowid), deduped: false };
}

export interface WriteFactResult {
  id: number;
}

export function writeFact(db: DatabaseSync, raw: unknown): WriteFactResult {
  const input = WriteFactInput.parse(raw);
  const sourceId = input.source_episode_id ?? null;
  const info = db
    .prepare(
      `INSERT INTO facts (key, value, confidence, source_episode_id)
       VALUES (?, ?, ?, ?)`,
    )
    .run(input.key, input.value, input.confidence, sourceId);
  return { id: Number(info.lastInsertRowid) };
}

export interface SetWorkingResult {
  session_id: string;
  key: string;
  expires_at: string | null;
}

export function setWorking(db: DatabaseSync, raw: unknown): SetWorkingResult {
  const input = SetWorkingInput.parse(raw);
  const expiresAt = input.ttl_sec
    ? new Date(Date.now() + input.ttl_sec * 1000).toISOString()
    : null;
  db.prepare(
    `INSERT INTO working_context (session_id, key, value, expires_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(session_id, key) DO UPDATE SET
       value = excluded.value,
       expires_at = excluded.expires_at,
       ts = datetime('now')`,
  ).run(input.session_id, input.key, input.value, expiresAt);
  return { session_id: input.session_id, key: input.key, expires_at: expiresAt };
}
