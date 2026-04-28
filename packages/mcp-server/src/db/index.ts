// Database open + migration runner. Uses Node 22.5+'s built-in `node:sqlite`
// via createRequire to avoid native deps. createRequire is required (not a
// preference) because vitest/vite's ESM module-resolution layer currently
// fails on the `node:sqlite` specifier even when it is listed in
// server.deps.external. Loading via Node's CJS require sidesteps the vite
// resolver entirely while preserving full runtime behaviour.

import { createRequire } from "node:module";
import { runMigrations } from "./migrations.js";

const _require = createRequire(import.meta.url);

const _sqlite = _require("node:sqlite") as {
  DatabaseSync: new (path: string) => DatabaseSync;
};

export interface SqliteRunInfo {
  lastInsertRowid: number | bigint;
  changes: number | bigint;
}

export interface SqliteStmt {
  run(...params: unknown[]): SqliteRunInfo;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

export interface DatabaseSync {
  exec(sql: string): void;
  prepare(sql: string): SqliteStmt;
  close(): void;
}

export interface OpenDbOptions {
  path: string;
  /** Skip migration runner (for tests that want a raw, empty database). */
  skipMigrations?: boolean;
}

export function openDb(opts: OpenDbOptions): DatabaseSync {
  const db = new _sqlite.DatabaseSync(opts.path);
  if (!opts.skipMigrations) {
    runMigrations(db);
  }
  return db;
}
