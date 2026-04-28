// Renders a normalised ReplayDump JSON document from raw trace+episode rows.
// The W7 HTML generator will consume the same dump shape, so this is the
// single source of truth for replay payloads.

import type { ReplayDump, TraceEvent, EpisodeRow } from "./types.js";

export interface DumpAsJsonOptions {
  taskId: string;
  events: TraceEvent[];
  episodes: EpisodeRow[];
  generatedAt?: string;
}

export function dumpAsJson(opts: DumpAsJsonOptions): ReplayDump {
  const generatedAt = opts.generatedAt ?? new Date().toISOString();
  const roleSet = new Set<string>();
  for (const e of opts.events) roleSet.add(e.role);
  for (const e of opts.episodes) roleSet.add(e.role);
  return {
    task_id: opts.taskId,
    generated_at: generatedAt,
    roles: [...roleSet].sort(),
    totals: { events: opts.events.length, episodes: opts.episodes.length },
    events: opts.events,
    episodes: opts.episodes,
  };
}
