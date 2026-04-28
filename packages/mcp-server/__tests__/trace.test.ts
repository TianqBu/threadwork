import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDb, type DatabaseSync } from "../src/db/index.js";
import { writeEpisode } from "../src/memory/index.js";
import { recordTrace, withAutoTrace } from "../src/trace.js";

let tmpRoot: string;
let db: DatabaseSync;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "threadwork-trace-"));
  db = openDb({ path: join(tmpRoot, "trace.sqlite") });
});

afterEach(() => {
  db.close();
  if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true });
});

function countTraces(): number {
  return (db.prepare(`SELECT count(*) c FROM traces`).get() as { c: number }).c;
}

describe("recordTrace", () => {
  it("inserts a trace event with FK chain", () => {
    const a = recordTrace(db, { task_id: "t1", role: "researcher", event_type: "tool_call", content: "WebSearch" });
    const b = recordTrace(db, {
      task_id: "t1",
      role: "researcher",
      event_type: "tool_result",
      content: "results",
      parent_event_id: a.id,
    });
    const row = db.prepare(`SELECT parent_event_id FROM traces WHERE id = ?`).get(b.id) as { parent_event_id: number };
    expect(row.parent_event_id).toBe(a.id);
  });

  it("rejects missing required fields", () => {
    expect(() => recordTrace(db, { task_id: "t1", role: "r" })).toThrow();
  });
});

describe("withAutoTrace middleware", () => {
  it("records one trace event per wrapped memory call", () => {
    const wrapped = withAutoTrace(
      (input: { task_id: string; role: string; content: string }) => writeEpisode(db, input),
      { db, task_id: "auto-1", role: "writer", event_type: "memory.write_episode" },
    );

    for (let i = 0; i < 10; i++) {
      wrapped({ task_id: "auto-1", role: "writer", content: `episode ${i}` });
    }

    expect(countTraces()).toBe(10);

    // W7 acceptance: 10 memory calls -> 10 trace events.
    const types = db
      .prepare(`SELECT DISTINCT event_type FROM traces WHERE task_id = ?`)
      .all("auto-1") as Array<{ event_type: string }>;
    expect(types).toHaveLength(1);
    expect(types[0]?.event_type).toBe("memory.write_episode");
  });

  it("does not record a trace if the wrapped function throws", () => {
    const wrapped = withAutoTrace(
      () => {
        throw new Error("boom");
      },
      { db, task_id: "fail-1", role: "writer", event_type: "memory.write_episode" },
    );
    expect(() => wrapped()).toThrow("boom");
    expect(countTraces()).toBe(0);
  });

  it("records the wrapped function's episode id on the trace row", () => {
    const wrapped = withAutoTrace(
      (input: { task_id: string; role: string; content: string }) => writeEpisode(db, input),
      { db, task_id: "fk-1", role: "writer", event_type: "memory.write_episode" },
    );
    const w = wrapped({ task_id: "fk-1", role: "writer", content: "linked episode" });
    const row = db
      .prepare(`SELECT episode_id FROM traces WHERE task_id = ? ORDER BY id DESC LIMIT 1`)
      .get("fk-1") as { episode_id: number };
    expect(row.episode_id).toBe(w.id);
  });
});
