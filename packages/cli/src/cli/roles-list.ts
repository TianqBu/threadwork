// `threadwork roles list` — print a table of discovered roles.

import { RoleLoader, type RoleEntry } from "../role/index.js";

export interface RolesListOptions {
  globalDir?: string;
  projectDir?: string;
  out?: NodeJS.WritableStream;
}

export async function rolesList(opts: RolesListOptions = {}): Promise<RoleEntry[]> {
  const out = opts.out ?? process.stdout;
  const loaderOpts: { globalDir?: string; projectDir?: string } = {};
  if (opts.globalDir !== undefined) loaderOpts.globalDir = opts.globalDir;
  if (opts.projectDir !== undefined) loaderOpts.projectDir = opts.projectDir;

  const loader = new RoleLoader(loaderOpts);
  await loader.start();
  const entries = loader.list();
  await loader.stop();

  if (entries.length === 0) {
    out.write("(no roles found; create one in ~/.threadwork/roles/)\n");
    return entries;
  }

  const rows = [
    ["NAME", "SOURCE", "TOOLS", "PATH"],
    ...entries.map((e) => [
      e.role.name,
      e.source,
      String(e.role.tools_allowed.length),
      e.path,
    ]),
  ];
  const widths = rows[0]!.map((_, col) =>
    Math.max(...rows.map((r) => (r[col] ?? "").length)),
  );
  for (const r of rows) {
    out.write(r.map((cell, i) => (cell ?? "").padEnd(widths[i]!)).join("  ") + "\n");
  }
  return entries;
}
