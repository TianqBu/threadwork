import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDb, type DatabaseSync } from "../src/db/index.js";
import {
  writeEpisode,
  writeFact,
  setWorking,
  recallEpisodes,
  recallFacts,
  getWorking,
} from "../src/memory/index.js";

let tmpRoot: string;
let db: DatabaseSync;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "threadwork-mr-"));
  db = openDb({ path: join(tmpRoot, "mr.sqlite") });
});

afterEach(() => {
  db.close();
  if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true });
});

describe("recallEpisodes", () => {
  beforeEach(() => {
    writeEpisode(db, { task_id: "t1", role: "researcher", content: "the MCP spec is dated 2025-11-25" });
    writeEpisode(db, { task_id: "t1", role: "writer", content: "draft about MCP introduction" });
    writeEpisode(db, { task_id: "t1", role: "reviewer", content: "looks good ship it" });
    writeEpisode(db, { task_id: "t2", role: "researcher", content: "OpenAI Assistants API uses threads" });
  });

  it("returns FTS5-ranked rows matching the query", () => {
    const rows = recallEpisodes(db, { query: "MCP" });
    const contents = rows.map((r) => r.content);
    expect(contents.some((c) => c.includes("MCP spec"))).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("scopes results to task_id when provided", () => {
    const rows = recallEpisodes(db, { query: "API OR MCP", task_id: "t2" });
    expect(rows.every((r) => r.task_id === "t2")).toBe(true);
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it("respects k limit", () => {
    const rows = recallEpisodes(db, { query: "MCP OR draft OR ship", k: 2 });
    expect(rows.length).toBeLessThanOrEqual(2);
  });

  it("rejects empty query", () => {
    expect(() => recallEpisodes(db, { query: "" })).toThrow();
  });
});

describe("recallFacts", () => {
  it("returns matching key, sorted by confidence desc", () => {
    writeFact(db, { key: "mcp.spec", value: "v1", confidence: 0.4 });
    writeFact(db, { key: "mcp.spec", value: "v2", confidence: 0.9 });
    writeFact(db, { key: "other", value: "ignored" });
    const rows = recallFacts(db, { key: "mcp.spec" });
    expect(rows).toHaveLength(2);
    expect(rows[0]?.confidence).toBe(0.9);
    expect(rows[1]?.confidence).toBe(0.4);
  });

  it("returns empty array for unknown key", () => {
    expect(recallFacts(db, { key: "nope" })).toEqual([]);
  });
});

describe("getWorking", () => {
  it("returns the value when present and unexpired", () => {
    setWorking(db, { session_id: "s1", key: "topic", value: "MCP" });
    const r = getWorking(db, { session_id: "s1", key: "topic" });
    expect(r?.value).toBe("MCP");
  });

  it("returns null for missing key", () => {
    expect(getWorking(db, { session_id: "s1", key: "nope" })).toBeNull();
  });

  it("returns null when expired", async () => {
    setWorking(db, { session_id: "s1", key: "ephemeral", value: "x", ttl_sec: 1 });
    await new Promise((r) => setTimeout(r, 1100));
    expect(getWorking(db, { session_id: "s1", key: "ephemeral" })).toBeNull();
  });
});

describe("integration: writer recalls researcher episode", () => {
  it("retrieves the researcher's prior content via FTS5", () => {
    writeEpisode(db, {
      task_id: "task-x",
      role: "researcher",
      content: "Anthropic ships Skill spec at code.claude.com/docs/en/skills",
    });
    // Simulate the writer step calling recallEpisodes with the bench task id.
    const recalled = recallEpisodes(db, {
      query: "Skill spec",
      task_id: "task-x",
    });
    expect(recalled).toHaveLength(1);
    expect(recalled[0]?.role).toBe("researcher");
    expect(recalled[0]?.content).toContain("Skill spec");
  });
});
