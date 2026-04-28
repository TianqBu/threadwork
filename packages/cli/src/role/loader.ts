// Threadwork role loader. Watches global (~/.threadwork/roles/) and project
// (./.threadwork/roles/) directories for yaml files, validates them, and
// emits change events. Project-scope roles override same-named global roles.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { homedir } from "node:os";
import { EventEmitter } from "node:events";
import { FSWatcher, watch as chokidarWatch } from "chokidar";
import { parse as parseYaml } from "yaml";
import { parseRole, type RoleYaml } from "./schema.js";

export type RoleSource = "global" | "project";

export interface RoleEntry {
  role: RoleYaml;
  source: RoleSource;
  path: string;
}

export interface LoaderOptions {
  globalDir?: string;
  projectDir?: string;
}

export interface LoaderEvents {
  ready: [Map<string, RoleEntry>];
  change: [{ name: string; entry: RoleEntry | undefined; reason: "added" | "updated" | "removed" }];
  error: [Error];
}

export class RoleLoader extends EventEmitter {
  private readonly globalDir: string;
  private readonly projectDir: string;
  private readonly entries = new Map<string, RoleEntry>();
  private watcher: FSWatcher | undefined;

  constructor(opts: LoaderOptions = {}) {
    super();
    this.globalDir = opts.globalDir ?? join(homedir(), ".threadwork", "roles");
    this.projectDir = opts.projectDir ?? resolve(".threadwork", "roles");
  }

  /**
   * Scan both directories once, populate the in-memory map, then start a
   * chokidar watcher. The `ready` event fires after the initial scan.
   */
  async start(): Promise<void> {
    this.scanDir(this.globalDir, "global");
    this.scanDir(this.projectDir, "project");
    this.emit("ready", new Map(this.entries));

    const paths = [this.globalDir, this.projectDir].filter((p) => existsSync(p));
    if (paths.length === 0) return;

    const watcher = chokidarWatch(paths, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 25 },
      usePolling: process.platform === "win32",
      interval: 50,
    });
    this.watcher = watcher;

    watcher.on("add", (p: string) => this.handleFile(p, "added"));
    watcher.on("change", (p: string) => this.handleFile(p, "updated"));
    watcher.on("unlink", (p: string) => this.handleFile(p, "removed"));
    watcher.on("error", (err: unknown) => this.emit("error", err as Error));

    await new Promise<void>((resolve) => {
      watcher.once("ready", () => resolve());
    });
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }
  }

  list(): RoleEntry[] {
    return [...this.entries.values()].sort((a, b) => a.role.name.localeCompare(b.role.name));
  }

  get(name: string): RoleEntry | undefined {
    return this.entries.get(name);
  }

  private scanDir(dir: string, source: RoleSource): void {
    if (!existsSync(dir)) return;
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch (err) {
      this.emit("error", err as Error);
      return;
    }
    for (const name of names) {
      if (!name.endsWith(".yaml") && !name.endsWith(".yml")) continue;
      const p = join(dir, name);
      try {
        const st = statSync(p);
        if (!st.isFile()) continue;
        this.loadFile(p, source);
      } catch (err) {
        this.emit("error", err as Error);
      }
    }
  }

  private loadFile(path: string, source: RoleSource): RoleEntry | undefined {
    let raw: unknown;
    try {
      const text = readFileSync(path, "utf8");
      raw = parseYaml(text);
    } catch (err) {
      this.emit("error", new Error(`failed to read ${path}: ${(err as Error).message}`));
      return undefined;
    }
    let role: RoleYaml;
    try {
      role = parseRole(raw);
    } catch (err) {
      this.emit("error", new Error(`invalid role yaml at ${path}: ${(err as Error).message}`));
      return undefined;
    }

    const existing = this.entries.get(role.name);
    if (existing && existing.source === "project" && source === "global") {
      // Project always wins; skip global update for the same name.
      return existing;
    }

    const entry: RoleEntry = { role, source, path };
    this.entries.set(role.name, entry);
    return entry;
  }

  private handleFile(path: string, reason: "added" | "updated" | "removed"): void {
    const source: RoleSource = path.startsWith(this.projectDir) ? "project" : "global";

    if (reason === "removed") {
      const fileName = basename(path).replace(/\.(yaml|yml)$/i, "");
      const existing = this.entries.get(fileName);
      if (existing && existing.path === path) {
        this.entries.delete(fileName);
        this.emit("change", { name: fileName, entry: undefined, reason });
        // If a global role is now visible because the project shadow was
        // removed, re-scan to surface it.
        if (source === "project") this.scanDir(this.globalDir, "global");
      }
      return;
    }

    const entry = this.loadFile(path, source);
    if (entry) {
      this.emit("change", { name: entry.role.name, entry, reason });
    }
  }
}
