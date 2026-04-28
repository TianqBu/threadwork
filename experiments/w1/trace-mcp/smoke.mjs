#!/usr/bin/env node
// W1 spike smoke test. Exercises lib.mjs directly (same code path the MCP
// server uses) and asserts the W1 acceptance bullet: >=4 rows in
// spike-traces.sqlite after a recorded run.
//
// Run: node trace-mcp/smoke.mjs
// Exit code 0 = pass, non-zero = fail.

import { unlinkSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { openDb, recordTrace, countRows } from "./lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dbPath = join(here, "spike-traces.sqlite");

if (existsSync(dbPath)) unlinkSync(dbPath);

const db = openDb(dbPath);

const taskId = "spike-001";

const events = [
  { role: "researcher", event_type: "tool_call", content: "WebSearch: latest MCP spec" },
  { role: "researcher", event_type: "tool_result", content: "spec version 2025-11-25" },
  { role: "writer", event_type: "tool_call", content: "memory_recall_episodes: query=mcp" },
  { role: "writer", event_type: "tool_result", content: "1 episode recalled" },
  { role: "writer", event_type: "draft", content: "MCP's current spec is dated 2025-11-25..." },
];

let parent = null;
for (const e of events) {
  const { id } = recordTrace(db, { task_id: taskId, parent_event_id: parent, ...e });
  parent = id;
}

const total = countRows(db);
const taskRows = db.prepare(`SELECT * FROM traces WHERE task_id = ? ORDER BY id`).all(taskId);

console.log(`spike-traces.sqlite: ${total} total rows; ${taskRows.length} rows for task ${taskId}`);

if (total < 4) {
  console.error(`FAIL: expected >=4 rows, got ${total}`);
  process.exit(1);
}

if (taskRows[0].parent_event_id !== null) {
  console.error("FAIL: first event should have null parent");
  process.exit(1);
}
for (let i = 1; i < taskRows.length; i++) {
  if (taskRows[i].parent_event_id !== taskRows[i - 1].id) {
    console.error(`FAIL: event ${taskRows[i].id} parent linkage broken`);
    process.exit(1);
  }
}

console.log("OK: W1 trace MCP smoke passed.");
