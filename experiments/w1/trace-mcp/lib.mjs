// W1 spike: shared trace-recording library.
// Used both by the MCP server (trace-mcp/server.mjs) and the deterministic
// smoke test (trace-mcp/smoke.mjs). Keeping the recording logic outside the
// MCP transport layer is what lets the smoke test produce >=4 rows without
// needing to spawn the server as a subprocess.

import { DatabaseSync } from "node:sqlite";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS traces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  role TEXT NOT NULL,
  event_type TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_event_id INTEGER,
  ts TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS traces_task_idx ON traces(task_id);
`;

export function openDb(path) {
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}

export function recordTrace(db, { task_id, role, event_type, content, parent_event_id }) {
  if (!task_id || !role || !event_type) {
    throw new Error("task_id, role, and event_type are required");
  }
  const stmt = db.prepare(
    `INSERT INTO traces (task_id, role, event_type, content, parent_event_id)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const info = stmt.run(
    String(task_id),
    String(role),
    String(event_type),
    String(content ?? ""),
    parent_event_id ?? null,
  );
  return { id: Number(info.lastInsertRowid) };
}

export function countRows(db) {
  return db.prepare(`SELECT count(*) AS c FROM traces`).get().c;
}
