// Replay UI generator entry. The full vanilla-JS swim-lane timeline lands in
// W7. For W2 the entry exports a stub used by the build / test gates.

export const REPLAY_UI_VERSION = "0.1.0";

export interface TraceEvent {
  id: number;
  task_id: string;
  role: string;
  event_type: string;
  content: string;
  parent_event_id: number | null;
  ts: string;
}

export function rolesIn(events: TraceEvent[]): string[] {
  return Array.from(new Set(events.map((e) => e.role))).sort();
}
