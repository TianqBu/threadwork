#!/usr/bin/env node
// W0 spike loader — zero deps, parses a small yaml subset and prints the
// assembled prompt that would be handed to a sub-agent. Used in W0.3 to
// demonstrate that picking a different yaml drives observably different
// prompt assembly. No LLM call is made.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseSpikeYaml(text) {
  const out = {};
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    if (!raw || raw.trim().startsWith("#")) { i++; continue; }

    const topLevel = raw.match(/^([a-zA-Z_][\w-]*):\s*(.*)$/);
    if (topLevel) {
      const [, key, rest] = topLevel;

      if (rest === "|" || rest === ">-" || rest === "|-" || rest === ">") {
        const block = [];
        i++;
        let blockIndent = -1;
        while (i < lines.length) {
          const next = lines[i];
          if (next === "" || /^\s+/.test(next)) {
            if (blockIndent < 0 && next.length > 0) {
              blockIndent = next.match(/^(\s+)/)?.[1].length ?? 0;
            }
            block.push(blockIndent > 0 ? next.slice(blockIndent) : next);
            i++;
          } else {
            break;
          }
        }
        out[key] = block.join("\n").replace(/\n+$/, "");
        continue;
      }

      if (rest === "") {
        // Either a list (next line starts with `  -`) or a nested map
        const childLines = [];
        i++;
        while (i < lines.length && /^\s+/.test(lines[i])) {
          childLines.push(lines[i]);
          i++;
        }
        if (childLines.some(l => /^\s+-\s/.test(l))) {
          out[key] = childLines
            .filter(l => /^\s+-\s/.test(l))
            .map(l => l.replace(/^\s+-\s+/, "").trim());
        } else {
          const nested = {};
          for (const cl of childLines) {
            const m = cl.match(/^\s+([a-zA-Z_][\w-]*):\s*(.*)$/);
            if (m) nested[m[1]] = coerce(m[2]);
          }
          out[key] = nested;
        }
        continue;
      }

      out[key] = coerce(rest);
      i++;
      continue;
    }
    i++;
  }
  return out;
}

function coerce(v) {
  const trimmed = v.trim();
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed.replace(/^"(.*)"$/, "$1");
}

function assemblePrompt(role, task) {
  const lines = [];
  lines.push(`# Role: ${role.name}`);
  lines.push("");
  lines.push("## System prompt");
  lines.push(role.system_prompt ?? "(none)");
  lines.push("");
  lines.push("## Tools allowed");
  lines.push((role.tools_allowed ?? []).map(t => `- ${t}`).join("\n") || "(none)");
  lines.push("");
  lines.push("## Budget");
  const b = role.budget ?? {};
  lines.push(`- max_tokens: ${b.max_tokens ?? "unset"}`);
  lines.push(`- max_duration_sec: ${b.max_duration_sec ?? "unset"}`);
  lines.push("");
  lines.push("## User task");
  lines.push(task);
  return lines.join("\n");
}

function main() {
  const [, , yamlPath, ...taskParts] = process.argv;
  if (!yamlPath || taskParts.length === 0) {
    console.error("usage: node loader.mjs <role-yaml-path> <task...>");
    process.exit(2);
  }
  const text = readFileSync(resolve(yamlPath), "utf8");
  const role = parseSpikeYaml(text);
  const task = taskParts.join(" ");
  process.stdout.write(assemblePrompt(role, task) + "\n");
}

main();
