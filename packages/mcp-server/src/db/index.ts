// Database open + migration runner. Uses Node 22.5+'s built-in `node:sqlite`
// via createRequire to avoid native deps. createRequire is required (not a
// preference) because vitest/vite's ESM module-resolution layer currently
// fails on the `node:sqlite` specifier even when it is listed in
// server.deps.external. Loading via Node's CJS require sidesteps the vite
// resolver entirely while preserving full runtime behaviour.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

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

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(here, "schema.sql");

export interface OpenDbOptions {
  path: string;
  schemaPath?: string;
}

export function openDb(opts: OpenDbOptions): DatabaseSync {
  const db = new _sqlite.DatabaseSync(opts.path);
  const schema = readFileSync(opts.schemaPath ?? SCHEMA_PATH, "utf8");
  db.exec(schema);
  return db;
}
