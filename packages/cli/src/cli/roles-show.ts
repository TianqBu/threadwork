// `threadwork roles show <name>` — print the full rendered role contract.

import { RoleLoader } from "../role/index.js";

export interface RolesShowOptions {
  name: string;
  globalDir?: string;
  projectDir?: string;
  out?: NodeJS.WritableStream;
}

export async function rolesShow(opts: RolesShowOptions): Promise<boolean> {
  const out = opts.out ?? process.stdout;
  const loaderOpts: { globalDir?: string; projectDir?: string } = {};
  if (opts.globalDir !== undefined) loaderOpts.globalDir = opts.globalDir;
  if (opts.projectDir !== undefined) loaderOpts.projectDir = opts.projectDir;

  const loader = new RoleLoader(loaderOpts);
  await loader.start();
  const entry = loader.get(opts.name);
  await loader.stop();

  if (!entry) {
    out.write(`role not found: ${opts.name}\n`);
    return false;
  }

  out.write(`# ${entry.role.name}  (source: ${entry.source})\n`);
  out.write(`# ${entry.path}\n\n`);
  out.write(`description: ${entry.role.description}\n\n`);
  out.write(`tools_allowed:\n`);
  for (const t of entry.role.tools_allowed) out.write(`  - ${t}\n`);
  out.write(`\nbudget:\n  max_tokens: ${entry.role.budget.max_tokens}\n  max_duration_sec: ${entry.role.budget.max_duration_sec}\n`);
  out.write(`\nsystem_prompt: |\n`);
  for (const line of entry.role.system_prompt.split("\n")) out.write(`  ${line}\n`);
  return true;
}
