#!/usr/bin/env node
// Copy schema.sql alongside the compiled db/index.js so the published bin
// can find it via the same relative resolve. tsc does not copy non-.ts
// files, so we shuttle them in a post-build step.

import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const src = resolve(repoRoot, "packages/mcp-server/src/db/schema.sql");
const dst = resolve(repoRoot, "packages/mcp-server/dist/db/schema.sql");

if (!existsSync(src)) {
  console.error(`copy-schema: source missing at ${src}`);
  process.exit(1);
}
mkdirSync(dirname(dst), { recursive: true });
copyFileSync(src, dst);
console.log(`copy-schema: ${src} -> ${dst}`);
