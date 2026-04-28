#!/usr/bin/env node
// pnpm bench:cost — read bench/last-run.json + bench/pricing.json and
// project the real-API cost of running the bench fixture against the
// default model. Asserts the cost is within fixture.cost_ceiling_usd
// across 3 simulated runs (median).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));
const lastRunPath = resolve(here, "last-run.json");
const pricingPath = resolve(here, "pricing.json");
const fixturePath = resolve(here, "demo-task.yaml");
const outPath = resolve(here, "cost-report.json");

if (!existsSync(lastRunPath)) {
  console.error(`bench/last-run.json missing — run 'pnpm bench:run' first.`);
  process.exit(1);
}

const lastRun = JSON.parse(readFileSync(lastRunPath, "utf8"));
const pricing = JSON.parse(readFileSync(pricingPath, "utf8"));
const fixture = parseYaml(readFileSync(fixturePath, "utf8"));

const modelId = process.env.THREADWORK_BENCH_MODEL ?? pricing.default_model;
const model = pricing.models[modelId];
if (!model) {
  console.error(`unknown model: ${modelId} (available: ${Object.keys(pricing.models).join(", ")})`);
  process.exit(1);
}

function projectOnce(run) {
  const inputCost = (run.totals.input_tokens / 1_000_000) * model.input_per_mtok;
  const outputCost = (run.totals.output_tokens / 1_000_000) * model.output_per_mtok;
  return inputCost + outputCost;
}

// Simulate 3 runs by adding ±5% jitter and taking the median.
function simulate(run, n) {
  const samples = [];
  for (let i = 0; i < n; i++) {
    const jitter = 1 + (Math.random() * 0.1 - 0.05);
    samples.push(projectOnce({
      totals: {
        input_tokens: Math.round(run.totals.input_tokens * jitter),
        output_tokens: Math.round(run.totals.output_tokens * jitter),
      },
    }));
  }
  return samples.sort((a, b) => a - b);
}

const samples = simulate(lastRun, 3);
const median = samples[1];
const ceiling = fixture.cost_ceiling_usd ?? 0.05;

const report = {
  ran_at: new Date().toISOString(),
  model: modelId,
  pricing_snapshot_date: pricing.snapshot_date,
  totals: lastRun.totals,
  samples_usd: samples,
  median_projected_usd: median,
  ceiling_usd: ceiling,
  passes: median <= ceiling,
};

writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(`bench:cost wrote ${outPath}`);
console.log(`  model=${modelId}, median=$${median.toFixed(4)}, ceiling=$${ceiling}`);

if (!report.passes) {
  console.error(`FAIL: median projected cost $${median.toFixed(4)} exceeds ceiling $${ceiling}`);
  process.exit(1);
}
process.exit(0);
