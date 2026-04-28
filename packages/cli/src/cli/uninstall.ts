// `threadwork uninstall` — reverses init: removes mcpServers.threadwork
// from ~/.claude.json. With --purge, also deletes ~/.threadwork. Honours
// the same backup + atomic-rename protocol as init.

import {
  copyFileSync,
  existsSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export interface UninstallOptions {
  claudeConfigPath?: string;
  threadworkHome?: string;
  purge?: boolean;
  now?: () => number;
  out?: NodeJS.WritableStream;
}

export interface UninstallResult {
  configPath: string;
  threadworkHome: string;
  backupPath: string | null;
  removed: boolean;
  purged: boolean;
}

export function uninstall(opts: UninstallOptions = {}): UninstallResult {
  const out = opts.out ?? process.stdout;
  const configPath = resolve(opts.claudeConfigPath ?? join(homedir(), ".claude.json"));
  const home = resolve(opts.threadworkHome ?? join(homedir(), ".threadwork"));
  const now = opts.now ?? Date.now;

  let removed = false;
  let backupPath: string | null = null;

  if (existsSync(configPath)) {
    const raw = readFileSync(configPath, "utf8");
    let parsed: Record<string, unknown>;
    try {
      parsed = (JSON.parse(raw) as Record<string, unknown>) ?? {};
    } catch (err) {
      throw new Error(
        `${configPath} is not valid JSON; refusing to rewrite. (${(err as Error).message})`,
      );
    }

    const servers = (parsed.mcpServers as Record<string, unknown> | undefined) ?? {};
    if ("threadwork" in servers) {
      const next: Record<string, unknown> = { ...servers };
      delete next["threadwork"];
      const merged = { ...parsed, mcpServers: next };
      const serialised = JSON.stringify(merged, null, 2);
      JSON.parse(serialised);

      backupPath = `${configPath}.bak.${now()}`;
      copyFileSync(configPath, backupPath);
      const tmpPath = `${configPath}.new`;
      writeFileSync(tmpPath, serialised, "utf8");
      renameSync(tmpPath, configPath);
      removed = true;
    }
  }

  let purged = false;
  if (opts.purge && existsSync(home)) {
    rmSync(home, { recursive: true, force: true });
    purged = true;
  }

  if (removed) {
    out.write(`removed mcpServers.threadwork from ${configPath}\n`);
    if (backupPath) out.write(`backup: ${backupPath}\n`);
  } else {
    out.write(`no mcpServers.threadwork entry found in ${configPath}\n`);
  }
  if (purged) out.write(`removed ${home}\n`);
  else if (opts.purge) out.write(`${home} did not exist\n`);

  return { configPath, threadworkHome: home, backupPath, removed, purged };
}
