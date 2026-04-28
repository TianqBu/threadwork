import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Writable } from "node:stream";
import { init } from "../src/cli/init.js";
import { uninstall } from "../src/cli/uninstall.js";

let tmpRoot: string;
let configPath: string;
let home: string;
let rolesSource: string;

class Buf extends Writable {
  buf = "";
  override _write(chunk: Buffer | string, _enc: string, cb: (err?: Error | null) => void): void {
    this.buf += chunk.toString();
    cb();
  }
}

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "threadwork-init-"));
  configPath = join(tmpRoot, ".claude.json");
  home = join(tmpRoot, ".threadwork");
  rolesSource = join(tmpRoot, "src-roles");
  mkdirSync(rolesSource, { recursive: true });
  writeFileSync(join(rolesSource, "researcher.yaml"), "name: researcher\n");
  writeFileSync(join(rolesSource, "writer.yaml"), "name: writer\n");
});

afterEach(() => {
  if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true });
});

describe("threadwork init", () => {
  it("creates a fresh ~/.claude.json with mcpServers.threadwork when none exists", () => {
    const out = new Buf();
    const r = init({ claudeConfigPath: configPath, threadworkHome: home, rolesSource, out });
    expect(r.changed).toBe(true);
    expect(r.backupPath).toBeNull();
    expect(existsSync(configPath)).toBe(true);
    const cfg = JSON.parse(readFileSync(configPath, "utf8"));
    expect(cfg.mcpServers.threadwork.command).toBe("threadwork-mcp-server");
    expect(existsSync(join(home, "roles"))).toBe(true);
    expect(existsSync(join(home, "db"))).toBe(true);
    expect(r.rolesCopied).toBe(2);
    expect(readdirSync(join(home, "roles")).sort()).toEqual(["researcher.yaml", "writer.yaml"]);
  });

  it("preserves sibling mcp servers and unrelated keys when merging", () => {
    writeFileSync(
      configPath,
      JSON.stringify(
        {
          mcpServers: { other: { command: "other-server" } },
          unrelated: { keep: "me" },
        },
        null,
        2,
      ),
    );
    const out = new Buf();
    init({
      claudeConfigPath: configPath,
      threadworkHome: home,
      rolesSource,
      now: () => 12345,
      out,
    });
    const cfg = JSON.parse(readFileSync(configPath, "utf8"));
    expect(cfg.mcpServers.other.command).toBe("other-server");
    expect(cfg.mcpServers.threadwork.command).toBe("threadwork-mcp-server");
    expect(cfg.unrelated).toEqual({ keep: "me" });
    expect(existsSync(`${configPath}.bak.12345`)).toBe(true);
  });

  it("backs up before overwriting an existing threadwork entry", () => {
    writeFileSync(
      configPath,
      JSON.stringify({ mcpServers: { threadwork: { command: "old-server" } } }, null, 2),
    );
    const out = new Buf();
    init({
      claudeConfigPath: configPath,
      threadworkHome: home,
      rolesSource,
      now: () => 99,
      out,
    });
    const backup = JSON.parse(readFileSync(`${configPath}.bak.99`, "utf8"));
    expect(backup.mcpServers.threadwork.command).toBe("old-server");
    const cfg = JSON.parse(readFileSync(configPath, "utf8"));
    expect(cfg.mcpServers.threadwork.command).toBe("threadwork-mcp-server");
  });

  it("--dry-run writes nothing", () => {
    writeFileSync(configPath, "{}");
    const out = new Buf();
    init({
      claudeConfigPath: configPath,
      threadworkHome: home,
      rolesSource,
      dryRun: true,
      out,
    });
    expect(readFileSync(configPath, "utf8")).toBe("{}");
    expect(existsSync(home)).toBe(false);
    expect(out.buf).toMatch(/dry-run/);
  });

  it("refuses to rewrite a corrupted ~/.claude.json", () => {
    writeFileSync(configPath, "{not valid json");
    const out = new Buf();
    expect(() =>
      init({ claudeConfigPath: configPath, threadworkHome: home, rolesSource, out }),
    ).toThrow(/not valid JSON/);
    expect(readFileSync(configPath, "utf8")).toBe("{not valid json");
  });

  it("does not clobber existing user roles", () => {
    mkdirSync(join(home, "roles"), { recursive: true });
    writeFileSync(join(home, "roles", "my-pm.yaml"), "name: my-pm\n");
    const out = new Buf();
    const r = init({ claudeConfigPath: configPath, threadworkHome: home, rolesSource, out });
    expect(r.rolesCopied).toBe(0);
    expect(readdirSync(join(home, "roles"))).toEqual(["my-pm.yaml"]);
  });
});

describe("threadwork uninstall", () => {
  it("removes mcpServers.threadwork while preserving siblings", () => {
    writeFileSync(
      configPath,
      JSON.stringify(
        {
          mcpServers: {
            threadwork: { command: "threadwork-mcp-server" },
            keepme: { command: "other" },
          },
        },
        null,
        2,
      ),
    );
    const out = new Buf();
    const r = uninstall({
      claudeConfigPath: configPath,
      threadworkHome: home,
      now: () => 55,
      out,
    });
    expect(r.removed).toBe(true);
    expect(r.backupPath).toBe(`${configPath}.bak.55`);
    const cfg = JSON.parse(readFileSync(configPath, "utf8"));
    expect("threadwork" in cfg.mcpServers).toBe(false);
    expect(cfg.mcpServers.keepme.command).toBe("other");
  });

  it("--purge wipes the threadwork home", () => {
    mkdirSync(join(home, "roles"), { recursive: true });
    writeFileSync(join(home, "roles", "x.yaml"), "name: x\n");
    writeFileSync(configPath, JSON.stringify({ mcpServers: {} }, null, 2));
    const out = new Buf();
    const r = uninstall({
      claudeConfigPath: configPath,
      threadworkHome: home,
      purge: true,
      out,
    });
    expect(r.purged).toBe(true);
    expect(existsSync(home)).toBe(false);
  });

  it("is a no-op when no entry exists", () => {
    writeFileSync(configPath, JSON.stringify({ mcpServers: {} }, null, 2));
    const out = new Buf();
    const r = uninstall({ claudeConfigPath: configPath, threadworkHome: home, out });
    expect(r.removed).toBe(false);
    expect(r.backupPath).toBeNull();
  });
});
