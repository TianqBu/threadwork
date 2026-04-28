// replay-ui public entry. v0.1 ships the JSON dump path (W6) and the
// vanilla-JS HTML timeline (W7).

export const REPLAY_UI_VERSION = "0.1.0";

export { dumpAsJson, type DumpAsJsonOptions } from "./json-dump.js";
export { readTask, type ReadTaskOptions, type ReadTaskResult } from "./db-reader.js";
export { renderHtml, type RenderHtmlOptions } from "./html-render.js";
export { type TraceEvent, type EpisodeRow, type ReplayDump } from "./types.js";

export function rolesIn(events: { role: string }[]): string[] {
  return Array.from(new Set(events.map((e) => e.role))).sort();
}
