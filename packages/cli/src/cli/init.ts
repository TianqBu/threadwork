// `threadwork init` — register the Threadwork MCP server in ~/.claude.json
// and lay down ~/.threadwork/{roles,db}.
//
// The ~/.claude.json rewrite is the most sensitive operation in the tool;
// the contract is: backup before mutation, validate before write, atomic
// rename. A failure anywhere before the rename leaves the original file
// byte-identical.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

export interface InitOptions {
  claudeConfigPath?: string;
  threadworkHome?: string;
  rolesSource?: string;
  serverCommand?: string;
  serverArgs?: string[];
  dryRun?: boolean;
  now?: () => number;
  out?: NodeJS.WritableStream;
}

export interface InitResult {
  configPath: string;
  threadworkHome: string;
  backupPath: string | null;
  rolesCopied: number;
  changed: boolean;
  dryRun: boolean;
}

export function init(opts: InitOptions = {}): InitResult {
  const out = opts.out ?? process.stdout;
  const configPath = resolve(opts.claudeConfigPath ?? join(homedir(), ".claude.json"));
  const home = resolve(opts.threadworkHome ?? join(homedir(), ".threadwork"));
  const command = opts.serverCommand ?? "threadwork-mcp-server";
  const args = opts.serverArgs ?? [];
  const now = opts.now ?? Date.now;

  const existed = existsSync(configPath);
  let raw = "{}";
  if (existed) raw = readFileSync(configPath, "utf8");

  let parsed: Record<string, unknown>;
  try {
    parsed = (JSON.parse(raw) as Record<string, unknown>) ?? {};
  } catch (err) {
    throw new Error(
      `${configPath} is not valid JSON; refusing to rewrite. (${(err as Error).message})`,
    );
  }

  const existingServers = (parsed.mcpServers as Record<string, unknown> | undefined) ?? {};
  const merged = {
    ...parsed,
    mcpServers: {
      ...existingServers,
      threadwork: { command, args },
    },
  };

  // Validate by round-tripping through JSON. If this fails, no write.
  const serialised = JSON.stringify(merged, null, 2);
  JSON.parse(serialised);

  const beforeServer = JSON.stringify(existingServers["threadwork"] ?? null);
  const afterServer = JSON.stringify(merged.mcpServers["threadwork"]);
  const changed = beforeServer !== afterServer;

  let backupPath: string | null = null;
  if (!opts.dryRun) {
    if (existed) {
      backupPath = `${configPath}.bak.${now()}`;
      copyFileSync(configPath, backupPath);
    }
    const tmpPath = `${configPath}.new`;
    writeFileSync(tmpPath, serialised, "utf8");
    renameSync(tmpPath, configPath);
  }

  // Lay down ~/.threadwork/{roles,db}. Idempotent.
  const rolesDir = join(home, "roles");
  const dbDir = join(home, "db");
  if (!opts.dryRun) {
    mkdirSync(rolesDir, { recursive: true });
    mkdirSync(dbDir, { recursive: true });
  }

  // Copy bundled roles only if the user's roles dir is empty. Never
  // clobber an existing role yaml.
  let rolesCopied = 0;
  const src = opts.rolesSource ?? defaultRolesSource();
  if (src && existsSync(src)) {
    const existing = !opts.dryRun && existsSync(rolesDir) ? readdirSync(rolesDir) : [];
    if (existing.length === 0) {
      for (const name of readdirSync(src)) {
        if (!name.endsWith(".yaml")) continue;
        if (!opts.dryRun) {
          mkdirSync(rolesDir, { recursive: true });
          copyFileSync(join(src, name), join(rolesDir, name));
        }
        rolesCopied += 1;
      }
    }
  }

  if (opts.dryRun) {
    out.write(`[dry-run] would write ${configPath}\n`);
    out.write(`[dry-run] would create ${rolesDir} and ${dbDir}\n`);
    out.write(`[dry-run] would copy ${rolesCopied} default role(s)\n`);
  } else {
    out.write(`registered MCP server in ${configPath}\n`);
    if (backupPath) out.write(`backup: ${backupPath}\n`);
    out.write(`threadwork home: ${home}\n`);
    if (rolesCopied > 0) out.write(`copied ${rolesCopied} default role(s) into ${rolesDir}\n`);
  }

  return {
    configPath,
    threadworkHome: home,
    backupPath,
    rolesCopied,
    changed,
    dryRun: Boolean(opts.dryRun),
  };
}

function defaultRolesSource(): string | null {
  // When installed globally, /roles ships next to /dist in the tarball
  // (see packages/cli prepack). Resolve relative to this module.
  try {
    const here = dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1");
    const candidate = resolve(here, "..", "..", "roles");
    if (existsSync(candidate)) return candidate;
    const candidate2 = resolve(here, "..", "..", "..", "roles");
    if (existsSync(candidate2)) return candidate2;
  } catch {
    // ignore — best effort
  }
  return null;
}
