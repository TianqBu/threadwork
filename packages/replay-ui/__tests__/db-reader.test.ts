import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { findLastTaskId, readTask } from "../src/db-reader.js";

const _require = createRequire(import.meta.url);
const _sqlite = _require("node:sqlite") as {
  DatabaseSync: new (path: string) => {
    exec(sql: string): void;
    prepare(sql: string): { run(...p: unknown[]): unknown };
    close(): void;
  };
};

let tmpRoot: string;
let dbPath: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "threadwork-dbreader-"));
  dbPath = join(tmpRoot, "test.sqlite");
});

afterEach(() => {
  if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true });
});

function seed(rows: Array<{ task_id: string; kind: "trace" | "episode" }>): void {
  const db = new _sqlite.DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE traces (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT, role TEXT, event_type TEXT, content TEXT, parent_event_id INTEGER, ts TEXT);
    CREATE TABLE episodes (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT, role TEXT, ts TEXT, content TEXT);
  `);
  for (const r of rows) {
    if (r.kind === "trace") {
      db.prepare(
        `INSERT INTO traces (task_id, role, event_type, content, ts) VALUES (?, 'r', 't', '', datetime('now'))`,
      ).run(r.task_id);
    } else {
      db.prepare(
        `INSERT INTO episodes (task_id, role, ts, content) VALUES (?, 'r', datetime('now'), 'x')`,
      ).run(r.task_id);
    }
  }
  db.close();
}

describe("findLastTaskId", () => {
  it("returns null on an empty database", () => {
    seed([]);
    expect(findLastTaskId(dbPath)).toBeNull();
  });

  it("returns the task_id from the latest trace row", () => {
    seed([
      { task_id: "old", kind: "trace" },
      { task_id: "old", kind: "trace" },
      { task_id: "newest", kind: "trace" },
    ]);
    expect(findLastTaskId(dbPath)).toBe("newest");
  });

  it("falls back to episodes when traces is empty", () => {
    seed([{ task_id: "ep-only", kind: "episode" }]);
    expect(findLastTaskId(dbPath)).toBe("ep-only");
  });

  it("prefers traces over episodes when both exist", () => {
    seed([
      { task_id: "ep-task", kind: "episode" },
      { task_id: "trace-task", kind: "trace" },
    ]);
    expect(findLastTaskId(dbPath)).toBe("trace-task");
  });

  it("readTask returns the rows for a given task_id", () => {
    seed([
      { task_id: "t1", kind: "trace" },
      { task_id: "t2", kind: "trace" },
      { task_id: "t1", kind: "episode" },
    ]);
    const r = readTask({ dbPath, taskId: "t1" });
    expect(r.events).toHaveLength(1);
    expect(r.episodes).toHaveLength(1);
  });
});
