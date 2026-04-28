#!/usr/bin/env node
// Threadwork MCP server stdio launcher.
// Reads THREADWORK_DB (defaults to ~/.threadwork/db/threadwork.sqlite),
// opens the database, registers all memory_* + trace_record tools, and
// connects to stdio so Claude Code (or any MCP client) can talk to it.

import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";

// Preflight: node:sqlite is required. It is built into Node 22.5+ but
// emits an experimental warning until it stabilises (Node 24 makes it
// stable). On 22.5–22.17 the user must launch with --experimental-sqlite;
// 22.18+ no longer needs the flag. Detect the missing-builtin case up
// front so the failure is a clear message instead of a stack trace.
try {
  createRequire(import.meta.url)("node:sqlite");
} catch (err) {
  if (err && err.code === "ERR_UNKNOWN_BUILTIN_MODULE") {
    process.stderr.write(
      "[threadwork] node:sqlite is not available in this Node runtime.\n" +
        `  detected: Node ${process.versions.node}\n` +
        "  required: Node 22.5 or newer (24+ recommended).\n" +
        "  on Node 22.5–22.17 launch with: node --experimental-sqlite\n" +
        "  see https://nodejs.org/api/sqlite.html\n",
    );
    process.exit(1);
  }
  throw err;
}

import { runStdioServer } from "../dist/index.js";

function resolveDbPath() {
  const raw = process.env.THREADWORK_DB ?? "~/.threadwork/db/threadwork.sqlite";
  const expanded = raw.startsWith("~") ? raw.replace(/^~/, homedir()) : raw;
  return resolve(expanded);
}

async function main() {
  const dbPath = resolveDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });

  const running = await runStdioServer({ dbPath });

  const shutdown = async (signal) => {
    process.stderr.write(`\n[threadwork] received ${signal}, shutting down\n`);
    try {
      await running.close();
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  process.stderr.write(`[threadwork] fatal: ${err?.stack ?? err}\n`);
  process.exit(1);
});
