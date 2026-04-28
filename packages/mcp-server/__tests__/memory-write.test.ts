import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDb, type DatabaseSync } from "../src/db/index.js";
import {
  writeEpisode,
  writeFact,
  setWorking,
  PER_TASK_BYTE_CAP,
} from "../src/memory/index.js";

let tmpRoot: string;
let dbPath: string;
let db: DatabaseSync;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "threadwork-mw-"));
  dbPath = join(tmpRoot, "mw.sqlite");
  db = openDb({ path: dbPath });
});

afterEach(() => {
  db.close();
  if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true });
});

describe("writeEpisode", () => {
  it("inserts a row and returns id + deduped=false on first write", () => {
    const r = writeEpisode(db, { task_id: "t1", role: "researcher", content: "hello" });
    expect(r.deduped).toBe(false);
    expect(r.id).toBeGreaterThan(0);
    const row = db.prepare(`SELECT * FROM episodes WHERE id = ?`).get(r.id);
    expect(row).toBeTruthy();
  });

  it("dedups identical content within the same task", () => {
    const a = writeEpisode(db, { task_id: "t1", role: "r", content: "same" });
    const b = writeEpisode(db, { task_id: "t1", role: "r", content: "same" });
    expect(b.id).toBe(a.id);
    expect(b.deduped).toBe(true);
    const count = db.prepare(`SELECT count(*) c FROM episodes`).get() as { c: number };
    expect(count.c).toBe(1);
  });

  it("does not dedup identical content across different tasks", () => {
    const a = writeEpisode(db, { task_id: "t1", role: "r", content: "same" });
    const b = writeEpisode(db, { task_id: "t2", role: "r", content: "same" });
    expect(b.id).not.toBe(a.id);
    expect(b.deduped).toBe(false);
  });

  it("rejects content exceeding the 1MB per-episode cap", () => {
    const big = "x".repeat(PER_TASK_BYTE_CAP + 1);
    expect(() => writeEpisode(db, { task_id: "t1", role: "r", content: big })).toThrow(/cap/);
  });

  it("rejects writes that would exceed the per-task cumulative cap", () => {
    const quarter = Math.floor(PER_TASK_BYTE_CAP / 4);
    writeEpisode(db, { task_id: "t1", role: "r", content: "a".repeat(quarter) });
    writeEpisode(db, { task_id: "t1", role: "r", content: "b".repeat(quarter) });
    writeEpisode(db, { task_id: "t1", role: "r", content: "c".repeat(quarter) });
    // Cumulative used: ~3/4 MB. Adding ~1/2 MB pushes us over.
    expect(() =>
      writeEpisode(db, { task_id: "t1", role: "r", content: "d".repeat(quarter * 2) }),
    ).toThrow(/cap/);
  });

  it("validates required fields", () => {
    expect(() => writeEpisode(db, { task_id: "", role: "r", content: "x" })).toThrow();
    expect(() => writeEpisode(db, { task_id: "t", role: "", content: "x" })).toThrow();
    expect(() => writeEpisode(db, { task_id: "t", role: "r", content: "" })).toThrow();
  });

  it("FTS5 trigger indexes content for full-text search", () => {
    writeEpisode(db, { task_id: "t1", role: "r", content: "the quick brown fox" });
    writeEpisode(db, { task_id: "t1", role: "r", content: "lazy dog sleeps" });
    const rows = db
      .prepare(`SELECT rowid FROM episodes_fts WHERE episodes_fts MATCH ?`)
      .all("fox") as Array<{ rowid: number }>;
    expect(rows).toHaveLength(1);
  });
});

describe("writeFact", () => {
  it("inserts a fact with default confidence", () => {
    const ep = writeEpisode(db, { task_id: "t1", role: "r", content: "MCP spec is dated 2025-11-25" });
    const f = writeFact(db, { key: "mcp.spec.version", value: "2025-11-25", source_episode_id: ep.id });
    const row = db.prepare(`SELECT * FROM facts WHERE id = ?`).get(f.id) as {
      id: number;
      confidence: number;
      source_episode_id: number;
    };
    expect(row.confidence).toBe(0.5);
    expect(row.source_episode_id).toBe(ep.id);
  });

  it("rejects confidence outside [0,1]", () => {
    expect(() => writeFact(db, { key: "k", value: "v", confidence: 1.5 })).toThrow();
    expect(() => writeFact(db, { key: "k", value: "v", confidence: -0.1 })).toThrow();
  });
});

describe("setWorking", () => {
  it("upserts a session-scoped value", () => {
    const a = setWorking(db, { session_id: "s1", key: "topic", value: "first" });
    const b = setWorking(db, { session_id: "s1", key: "topic", value: "second" });
    expect(a.expires_at).toBeNull();
    expect(b.expires_at).toBeNull();
    const row = db
      .prepare(`SELECT value FROM working_context WHERE session_id = ? AND key = ?`)
      .get("s1", "topic") as { value: string };
    expect(row.value).toBe("second");
  });

  it("computes expires_at from ttl_sec", () => {
    const before = Date.now();
    const r = setWorking(db, { session_id: "s1", key: "k", value: "v", ttl_sec: 60 });
    expect(r.expires_at).not.toBeNull();
    const ts = Date.parse(r.expires_at!);
    expect(ts).toBeGreaterThan(before);
    expect(ts).toBeLessThan(before + 60_000 + 1000);
  });
});
