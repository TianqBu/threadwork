#!/usr/bin/env node
// pnpm bench:run — execute the canonical bench fixture against a mock LLM
// and write bench/last-run.json. Deterministic; does not call any real API.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(here, "demo-task.yaml");
const outPath = resolve(here, "last-run.json");

const fixture = parseYaml(readFileSync(fixturePath, "utf8"));

// Mock LLM: produces a fixed number of "episodes" per role. Token counts
// are deterministic functions of the role and iteration so the cost
// projection is reproducible.
function mockRoleStep(role, iteration, ceilings) {
  const baseIn = (ceilings.max_input_tokens ?? 4000) * 0.6;
  const baseOut = (ceilings.max_output_tokens ?? 4000) * 0.5;
  return {
    role,
    iteration,
    input_tokens: Math.round(baseIn + iteration * 50),
    output_tokens: Math.round(baseOut + iteration * 80),
    episodes_emitted: 0, // populated below
  };
}

const roleIterCounter = new Map();
const stepResults = [];

for (const seq of fixture.role_sequence) {
  const role = seq.role;
  const iter = (roleIterCounter.get(role) ?? 0) + 1;
  roleIterCounter.set(role, iter);
  const ceilings = fixture.token_ceilings?.[role] ?? {};
  const step = mockRoleStep(role, iter, ceilings);
  step.episodes_emitted = seq.expected_episode_count;
  stepResults.push(step);
}

const totalEpisodes = stepResults.reduce((s, r) => s + r.episodes_emitted, 0);
const totalInput = stepResults.reduce((s, r) => s + r.input_tokens, 0);
const totalOutput = stepResults.reduce((s, r) => s + r.output_tokens, 0);

const out = {
  fixture: fixturePath,
  ran_at: new Date().toISOString(),
  fixture_name: fixture.name,
  pattern: fixture.pattern,
  steps: stepResults,
  totals: {
    episodes: totalEpisodes,
    input_tokens: totalInput,
    output_tokens: totalOutput,
  },
};

writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`bench:run wrote ${outPath}`);
console.log(`  episodes: ${totalEpisodes}, input_tokens: ${totalInput}, output_tokens: ${totalOutput}`);

const target = fixture.target_episode_count;
const slack = (fixture.target_episode_slack_pct ?? 10) / 100;
if (target) {
  const lo = Math.floor(target * (1 - slack));
  const hi = Math.ceil(target * (1 + slack));
  if (totalEpisodes < lo || totalEpisodes > hi) {
    console.error(`FAIL: episode total ${totalEpisodes} outside target ${lo}..${hi}`);
    process.exit(1);
  }
}

process.exit(0);
