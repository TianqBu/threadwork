#!/usr/bin/env node
// Build bench/demo.gif from bench/demo.cast.
//
// Why this script exists: the closed alpha covers macOS/Linux/Windows, and
// the macOS/Linux path uses `agg` (asciinema's gif renderer). Windows does
// not have a stable agg build, so the W8 acceptance criterion explicitly
// allows a "pre-rendered fallback if agg unavailable on Windows". This
// script picks the right path automatically.
//
// Usage:
//   node bench/build-gif.mjs            # build from cast
//   node bench/build-gif.mjs --check    # exit non-zero if demo.gif > 2 MB

import { execSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const cast = resolve(root, "bench/demo.cast");
const gif = resolve(root, "bench/demo.gif");
const MAX_BYTES = 2 * 1024 * 1024;

if (process.argv.includes("--check")) {
  if (!existsSync(gif)) {
    console.error(`bench/demo.gif missing`);
    process.exit(1);
  }
  const size = statSync(gif).size;
  if (size > MAX_BYTES) {
    console.error(`bench/demo.gif is ${size} bytes (> ${MAX_BYTES})`);
    process.exit(1);
  }
  console.log(`bench/demo.gif ok (${size} bytes)`);
  process.exit(0);
}

function has(cmd) {
  try {
    execSync(`${process.platform === "win32" ? "where" : "command -v"} ${cmd}`, {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

if (!existsSync(cast)) {
  console.error(`bench/demo.cast missing — record it first with asciinema rec`);
  process.exit(1);
}

if (has("agg")) {
  execSync(`agg --speed 1.5 --theme monokai "${cast}" "${gif}"`, {
    stdio: "inherit",
  });
  const size = statSync(gif).size;
  if (size > MAX_BYTES) {
    console.error(`agg output is ${size} bytes; tighten the cast or speed up`);
    process.exit(1);
  }
  console.log(`built ${gif} (${size} bytes)`);
  process.exit(0);
}

console.error(
  `agg not on PATH. On macOS/Linux: cargo install --git https://github.com/asciinema/agg.\n` +
    `On Windows: keep the committed pre-rendered fallback at ${gif}.`,
);
process.exit(2);
