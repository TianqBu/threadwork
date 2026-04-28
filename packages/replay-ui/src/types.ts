// Shared types for the replay UI generator.

export interface TraceEvent {
  id: number;
  task_id: string;
  role: string;
  event_type: string;
  content: string;
  parent_event_id: number | null;
  ts: string;
}

export interface EpisodeRow {
  id: number;
  task_id: string;
  role: string;
  ts: string;
  content: string;
}

export interface ReplayDump {
  task_id: string;
  generated_at: string;
  roles: string[];
  totals: {
    events: number;
    episodes: number;
  };
  events: TraceEvent[];
  episodes: EpisodeRow[];
}
