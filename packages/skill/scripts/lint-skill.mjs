#!/usr/bin/env node
// Minimal SKILL.md linter for CI: confirms required frontmatter fields exist.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const skillPath = resolve(here, "..", "SKILL.md");
const text = readFileSync(skillPath, "utf8");

const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
if (!fmMatch) {
  console.error(`SKILL.md is missing frontmatter at ${skillPath}`);
  process.exit(1);
}
const fm = fmMatch[1];
for (const required of ["name:", "description:"]) {
  if (!fm.includes(required)) {
    console.error(`SKILL.md frontmatter missing ${required}`);
    process.exit(1);
  }
}
console.log("OK: SKILL.md frontmatter has name and description.");
