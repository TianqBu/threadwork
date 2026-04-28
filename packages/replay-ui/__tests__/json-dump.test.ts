import { describe, expect, it } from "vitest";
import { dumpAsJson } from "../src/json-dump.js";
import type { TraceEvent, EpisodeRow } from "../src/types.js";

function makeBenchRunFixture(): { events: TraceEvent[]; episodes: EpisodeRow[] } {
  // 12 events, 5 episodes for task "bench-001" — stand-in for a real
  // bench-task run. Mirrors what the W6 SQLite would contain after
  // running pnpm bench:run + pnpm bench:trace (W6 follow-up).
  const events: TraceEvent[] = [];
  for (let i = 1; i <= 12; i++) {
    events.push({
      id: i,
      task_id: "bench-001",
      role: i <= 4 ? "researcher" : i <= 8 ? "writer" : "reviewer",
      event_type: i % 3 === 0 ? "tool_result" : "tool_call",
      content: `step ${i}`,
      parent_event_id: i === 1 ? null : i - 1,
      ts: `2026-04-28T01:00:${i.toString().padStart(2, "0")}Z`,
    });
  }
  const episodes: EpisodeRow[] = [];
  for (let i = 1; i <= 5; i++) {
    episodes.push({
      id: i,
      task_id: "bench-001",
      role: i <= 2 ? "researcher" : i <= 4 ? "writer" : "reviewer",
      ts: `2026-04-28T01:01:${i.toString().padStart(2, "0")}Z`,
      content: `episode ${i} content`,
    });
  }
  return { events, episodes };
}

describe("dumpAsJson", () => {
  it("emits a normalised document with totals and roles", () => {
    const { events, episodes } = makeBenchRunFixture();
    const dump = dumpAsJson({
      taskId: "bench-001",
      events,
      episodes,
      generatedAt: "2026-04-28T01:00:00Z",
    });
    expect(dump.task_id).toBe("bench-001");
    expect(dump.totals.events).toBe(12);
    expect(dump.totals.episodes).toBe(5);
    expect(dump.roles).toEqual(["researcher", "reviewer", "writer"]);
    expect(dump.generated_at).toBe("2026-04-28T01:00:00Z");
  });

  it("includes >=10 trace events for a bench-task run", () => {
    // W6 acceptance bullet: smoke test asserts >=10 trace events appear in
    // the output for a bench-task run.
    const { events, episodes } = makeBenchRunFixture();
    const dump = dumpAsJson({ taskId: "bench-001", events, episodes });
    expect(dump.events.length).toBeGreaterThanOrEqual(10);
  });

  it("preserves trace event order via id", () => {
    const { events, episodes } = makeBenchRunFixture();
    const dump = dumpAsJson({ taskId: "bench-001", events, episodes });
    const ids = dump.events.map((e) => e.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });

  it("emits an empty dump for a task with no rows", () => {
    const dump = dumpAsJson({ taskId: "ghost", events: [], episodes: [] });
    expect(dump.totals).toEqual({ events: 0, episodes: 0 });
    expect(dump.events).toEqual([]);
    expect(dump.roles).toEqual([]);
  });
});
