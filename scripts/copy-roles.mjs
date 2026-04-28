#!/usr/bin/env node
// Copy ../../roles/*.yaml into packages/cli/roles/ before npm pack/publish.
// The cli package.json `files` array references `roles`, but the canonical
// source lives at the repo root so all packages can read the same set in
// dev. Running this script as `prepack` keeps the tarball self-contained
// without forcing a dual source of truth.

import { mkdirSync, readdirSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const src = resolve(repoRoot, "roles");
const dest = resolve(repoRoot, "packages/cli/roles");

if (!existsSync(src)) {
  console.error(`copy-roles: source ${src} missing`);
  process.exit(1);
}

if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true });
}
mkdirSync(dest, { recursive: true });

let count = 0;
for (const name of readdirSync(src)) {
  if (!name.endsWith(".yaml")) continue;
  copyFileSync(resolve(src, name), resolve(dest, name));
  count += 1;
}
console.log(`copy-roles: ${count} yaml -> ${dest}`);
