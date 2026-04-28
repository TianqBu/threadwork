// `threadwork roles create <name>` — scaffold a new role yaml from a template.
// Validates the produced yaml against the schema before writing to disk.

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseRole } from "../role/schema.js";

const TEMPLATE = (name: string) => `name: ${name}
description: Describe in one or two sentences when to invoke this role and when not to.
system_prompt: |
  You are ${name}. Your job is to ...

  Operating rules
  ---------------
  1. ...
  2. ...

  Output format
  -------------
  - ...
tools_allowed:
  - Read
  - memory_recall_episodes
  - trace_record
budget:
  max_tokens: 30000
  max_duration_sec: 240
`;

export interface RolesCreateOptions {
  name: string;
  projectDir?: string;
  force?: boolean;
  out?: NodeJS.WritableStream;
}

export async function rolesCreate(opts: RolesCreateOptions): Promise<string> {
  const out = opts.out ?? process.stdout;

  if (!/^[a-z0-9][a-z0-9-]*$/.test(opts.name)) {
    throw new Error(`invalid role name: ${opts.name}. Use lowercase letters, digits, and hyphens.`);
  }

  const dir = opts.projectDir ?? resolve(".threadwork", "roles");
  const path = join(dir, `${opts.name}.yaml`);
  if (existsSync(path) && !opts.force) {
    throw new Error(`role yaml already exists: ${path} (pass force: true to overwrite)`);
  }

  const text = TEMPLATE(opts.name);

  // Validate the template parses against the schema before writing.
  const { parse: parseYaml } = await import("yaml");
  const parsed = parseYaml(text);
  parseRole(parsed);

  mkdirSync(dir, { recursive: true });
  writeFileSync(path, text, "utf8");

  out.write(`created ${path}\n`);
  return path;
}
