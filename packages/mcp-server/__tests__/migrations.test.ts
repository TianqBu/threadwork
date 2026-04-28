import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { openDb, type DatabaseSync } from "../src/db/index.js";
import {
  runMigrations,
  getCurrentVersion,
  LATEST_VERSION,
  MIGRATIONS,
} from "../src/db/migrations.js";

let tmpRoot: string;
let dbPath: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "threadwork-mig-"));
  dbPath = join(tmpRoot, "mig.sqlite");
});

afterEach(() => {
  if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true });
});

describe("schema migrations", () => {
  it("openDb runs all migrations and stamps user_version=LATEST", () => {
    const db = openDb({ path: dbPath });
    expect(getCurrentVersion(db)).toBe(LATEST_VERSION);
    expect(LATEST_VERSION).toBeGreaterThanOrEqual(1);
    db.close();
  });

  it("creates the v1 tables: episodes, facts, working_context, traces, episodes_fts", () => {
    const db = openDb({ path: dbPath });
    const rows = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type IN ('table','virtual') ORDER BY name`,
      )
      .all() as Array<{ name: string }>;
    const names = rows.map((r) => r.name);
    expect(names).toContain("episodes");
    expect(names).toContain("facts");
    expect(names).toContain("working_context");
    expect(names).toContain("traces");
    expect(names).toContain("episodes_fts");
    db.close();
  });

  it("re-running migrations on an already-stamped DB is a no-op", () => {
    const db = openDb({ path: dbPath });
    expect(getCurrentVersion(db)).toBe(LATEST_VERSION);

    const second = runMigrations(db);
    expect(second.applied).toEqual([]);
    expect(second.from).toBe(LATEST_VERSION);
    expect(second.to).toBe(LATEST_VERSION);
    db.close();
  });

  it("steps a fresh DB up from version 0 through every migration in order", () => {
    const db = openDb({ path: dbPath, skipMigrations: true });
    expect(getCurrentVersion(db)).toBe(0);

    const r = runMigrations(db);
    expect(r.from).toBe(0);
    expect(r.to).toBe(LATEST_VERSION);
    expect(r.applied).toEqual(MIGRATIONS.map((m) => m.version));
    db.close();
  });

  it("MIGRATIONS array versions are unique and strictly increasing", () => {
    const versions = MIGRATIONS.map((m) => m.version);
    for (let i = 1; i < versions.length; i++) {
      expect(versions[i]).toBeGreaterThan(versions[i - 1]!);
    }
    expect(new Set(versions).size).toBe(versions.length);
  });

  it("simulating a legacy DB (tables present, user_version=0) is upgraded idempotently", () => {
    // First open with skipMigrations to get a fresh empty DB.
    let db: DatabaseSync = openDb({ path: dbPath, skipMigrations: true });
    // Manually run v1 migration without stamping the version, simulating
    // a database created by the pre-migration code path.
    MIGRATIONS[0]!.up(db);
    expect(getCurrentVersion(db)).toBe(0);
    db.close();

    // Now reopen without skipMigrations: it should succeed (idempotent)
    // and stamp the version to LATEST.
    db = openDb({ path: dbPath });
    expect(getCurrentVersion(db)).toBe(LATEST_VERSION);
    // Tables still present and queryable.
    const r = db.prepare(`SELECT count(*) c FROM episodes`).get() as { c: number };
    expect(r.c).toBe(0);
    db.close();
  });
});
