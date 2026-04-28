// SQLite schema migration runner. Uses `PRAGMA user_version` as the version
// counter. Each migration runs at most once per database; the v1 migration is
// idempotent (CREATE ... IF NOT EXISTS) so it is safe to re-run on databases
// that were created by the pre-migration code path.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { DatabaseSync } from "./index.js";

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA_V1_PATH = resolve(here, "schema.sql");

export interface Migration {
  version: number;
  description: string;
  up: (db: DatabaseSync) => void;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: "v0.1 base: episodes + facts + working_context + traces + FTS5 over episodes",
    up: (db) => {
      const schema = readFileSync(SCHEMA_V1_PATH, "utf8");
      db.exec(schema);
    },
  },
  // Future migrations append here. Each must:
  //  1. Pick the next integer version
  //  2. Be idempotent (use IF NOT EXISTS / IF EXISTS where possible)
  //  3. NOT mutate or remove earlier migrations — old DBs need them to step up
];

export function getCurrentVersion(db: DatabaseSync): number {
  const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
  return row.user_version;
}

export interface MigrationResult {
  from: number;
  to: number;
  applied: number[];
}

export function runMigrations(db: DatabaseSync): MigrationResult {
  const from = getCurrentVersion(db);
  const applied: number[] = [];

  for (const m of MIGRATIONS) {
    if (m.version <= from) continue;
    m.up(db);
    // PRAGMA user_version does not accept a bound parameter; the version
    // values are static integers from the migrations array, so direct
    // interpolation is safe (no user-controlled input).
    db.exec(`PRAGMA user_version = ${m.version}`);
    applied.push(m.version);
  }

  return { from, to: getCurrentVersion(db), applied };
}

export const LATEST_VERSION = MIGRATIONS.reduce((max, m) => Math.max(max, m.version), 0);
