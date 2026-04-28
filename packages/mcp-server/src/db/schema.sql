-- Threadwork MCP server schema. v0.1: episodes + facts + working_context
-- with FTS5 over episode content. Traces table is included now even though
-- it is owned by W7, so a single migration covers all v0.1 tables.

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  role TEXT NOT NULL,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  size INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_episodes_task ON episodes(task_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_episodes_dedup ON episodes(task_id, content_hash);

CREATE VIRTUAL TABLE IF NOT EXISTS episodes_fts USING fts5(
  content,
  content='episodes',
  content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS episodes_ai AFTER INSERT ON episodes BEGIN
  INSERT INTO episodes_fts(rowid, content) VALUES (new.id, new.content);
END;

CREATE TRIGGER IF NOT EXISTS episodes_ad AFTER DELETE ON episodes BEGIN
  INSERT INTO episodes_fts(episodes_fts, rowid, content) VALUES('delete', old.id, old.content);
END;

CREATE TRIGGER IF NOT EXISTS episodes_au AFTER UPDATE ON episodes BEGIN
  INSERT INTO episodes_fts(episodes_fts, rowid, content) VALUES('delete', old.id, old.content);
  INSERT INTO episodes_fts(rowid, content) VALUES (new.id, new.content);
END;

CREATE TABLE IF NOT EXISTS facts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5,
  source_episode_id INTEGER,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_episode_id) REFERENCES episodes(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_facts_key ON facts(key);

CREATE TABLE IF NOT EXISTS working_context (
  session_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TEXT,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (session_id, key)
);

CREATE TABLE IF NOT EXISTS traces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  role TEXT NOT NULL,
  event_type TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  parent_event_id INTEGER,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_event_id) REFERENCES traces(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_traces_task ON traces(task_id);
