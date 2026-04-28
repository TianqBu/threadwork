// Memory layer types shared across write/recall implementations.

import { z } from "zod";

export const WriteEpisodeInput = z
  .object({
    task_id: z.string().min(1).max(128),
    role: z.string().min(1).max(64),
    content: z.string().min(1),
  })
  .strict();
export type WriteEpisodeInput = z.infer<typeof WriteEpisodeInput>;

export const WriteFactInput = z
  .object({
    key: z.string().min(1).max(256),
    value: z.string().min(1),
    confidence: z.number().min(0).max(1).default(0.5),
    source_episode_id: z.number().int().positive().optional(),
  })
  .strict();
export type WriteFactInput = z.infer<typeof WriteFactInput>;

export const SetWorkingInput = z
  .object({
    session_id: z.string().min(1).max(128),
    key: z.string().min(1).max(256),
    value: z.string(),
    ttl_sec: z.number().int().positive().optional(),
  })
  .strict();
export type SetWorkingInput = z.infer<typeof SetWorkingInput>;

export interface EpisodeRow {
  id: number;
  task_id: string;
  role: string;
  ts: string;
  content: string;
  content_hash: string;
  size: number;
}

export interface FactRow {
  id: number;
  key: string;
  value: string;
  confidence: number;
  source_episode_id: number | null;
  ts: string;
}

export interface WorkingContextRow {
  session_id: string;
  key: string;
  value: string;
  expires_at: string | null;
  ts: string;
}

export const PER_TASK_BYTE_CAP = 1024 * 1024; // 1 MB
