import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Writable } from "node:stream";
import { createRequire } from "node:module";

import { replay } from "../src/cli/replay.js";

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

class Buf extends Writable {
  buf = "";
  override _write(chunk: Buffer | string, _enc: string, cb: (err?: Error | null) => void): void {
    this.buf += chunk.toString();
    cb();
  }
}

function seedTask(taskId: string, traceCount = 1): void {
  const db = new _sqlite.DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS traces (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT, role TEXT, event_type TEXT, content TEXT, parent_event_id INTEGER, ts TEXT);
    CREATE TABLE IF NOT EXISTS episodes (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT, role TEXT, ts TEXT, content TEXT);
  `);
  for (let i = 0; i < traceCount; i++) {
    db.prepare(
      `INSERT INTO traces (task_id, role, event_type, content, ts) VALUES (?, 'r', 'tool_call', '', datetime('now'))`,
    ).run(taskId);
  }
  db.close();
}

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "threadwork-replay-"));
  dbPath = join(tmpRoot, "replay.sqlite");
});

afterEach(() => {
  if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true });
});

describe("threadwork replay", () => {
  it("renders an HTML file for an explicit task_id", async () => {
    seedTask("task-explicit", 2);
    const out = new Buf();
    const outFile = join(tmpRoot, "out.html");
    const events = await replay({
      taskId: "task-explicit",
      dbPath,
      outFile,
      out,
    });
    expect(events).toBe(2);
    expect(existsSync(outFile)).toBe(true);
    expect(out.buf).toMatch(/wrote/);
  });

  it("--last resolves to the most recent task_id", async () => {
    seedTask("old-task", 1);
    seedTask("new-task", 3);
    const out = new Buf();
    const outFile = join(tmpRoot, "last.html");
    const events = await replay({
      last: true,
      dbPath,
      outFile,
      out,
    });
    expect(events).toBe(3);
    expect(out.buf).toMatch(/--last resolved to task_id=new-task/);
  });

  it("--last on an empty db prints a friendly message and returns 0", async () => {
    // Create an empty schema-only db so the SQLite handle opens cleanly.
    const db = new _sqlite.DatabaseSync(dbPath);
    db.exec(`
      CREATE TABLE traces (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT, role TEXT, event_type TEXT, content TEXT, parent_event_id INTEGER, ts TEXT);
      CREATE TABLE episodes (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT, role TEXT, ts TEXT, content TEXT);
    `);
    db.close();

    const out = new Buf();
    const events = await replay({ last: true, dbPath, out });
    expect(events).toBe(0);
    expect(out.buf).toMatch(/no tasks found/);
  });

  it("rejects when neither task_id nor --last is provided", async () => {
    seedTask("dummy", 1);
    await expect(replay({ dbPath })).rejects.toThrow(/task_id.*--last/);
  });

  it("--json emits the replay dump on stdout instead of writing a file", async () => {
    seedTask("json-task", 1);
    const out = new Buf();
    const events = await replay({
      taskId: "json-task",
      dbPath,
      json: true,
      out,
    });
    expect(events).toBe(1);
    const dump = JSON.parse(out.buf);
    expect(dump.task_id).toBe("json-task");
    expect(dump.events).toHaveLength(1);
  });
});
