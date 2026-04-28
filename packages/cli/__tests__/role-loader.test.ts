import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RoleLoader } from "../src/role/loader.js";

const yamlText = (name: string, prompt: string) => `name: ${name}
description: a test role for the loader
system_prompt: |
  ${prompt}
tools_allowed:
  - Read
budget:
  max_tokens: 1000
  max_duration_sec: 60
`;

let tmpRoot: string;
let globalDir: string;
let projectDir: string;
let loader: RoleLoader;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "threadwork-loader-"));
  globalDir = join(tmpRoot, "global");
  projectDir = join(tmpRoot, "project");
  mkdirSync(globalDir, { recursive: true });
  mkdirSync(projectDir, { recursive: true });
});

afterEach(async () => {
  if (loader) await loader.stop();
  if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true });
});

describe("role loader", () => {
  it("scans both dirs and lists discovered roles sorted by name", async () => {
    writeFileSync(join(globalDir, "alpha.yaml"), yamlText("alpha", "alpha prompt"));
    writeFileSync(join(globalDir, "beta.yaml"), yamlText("beta", "beta prompt"));
    loader = new RoleLoader({ globalDir, projectDir });
    await loader.start();
    const list = loader.list();
    expect(list.map((e) => e.role.name)).toEqual(["alpha", "beta"]);
    expect(list.map((e) => e.source)).toEqual(["global", "global"]);
  });

  it("project overrides global for same name", async () => {
    writeFileSync(join(globalDir, "shared.yaml"), yamlText("shared", "global"));
    writeFileSync(join(projectDir, "shared.yaml"), yamlText("shared", "project"));
    loader = new RoleLoader({ globalDir, projectDir });
    await loader.start();
    const entry = loader.get("shared");
    expect(entry?.source).toBe("project");
    expect(entry?.role.system_prompt).toContain("project");
  });

  it("emits a change event within 500ms when a yaml is added", async () => {
    loader = new RoleLoader({ globalDir, projectDir });
    await loader.start();

    const start = Date.now();
    const event = await new Promise<{ name: string; reason: string; elapsedMs: number }>((resolve) => {
      loader.on("change", (e) => resolve({ name: e.name, reason: e.reason, elapsedMs: Date.now() - start }));
      writeFileSync(join(projectDir, "fresh.yaml"), yamlText("fresh", "fresh prompt"));
    });
    expect(event.name).toBe("fresh");
    expect(event.reason).toBe("added");
    expect(event.elapsedMs).toBeLessThan(500);
  });

  it("emits an error event for invalid yaml without crashing", async () => {
    writeFileSync(join(globalDir, "broken.yaml"), "name: 'BadCase'\ndescription: x\nsystem_prompt: y\nbudget:\n  max_tokens: 10\n  max_duration_sec: 10\n");
    loader = new RoleLoader({ globalDir, projectDir });

    const errs: Error[] = [];
    loader.on("error", (e) => errs.push(e));
    await loader.start();

    expect(errs.length).toBeGreaterThanOrEqual(1);
    expect(loader.get("BadCase")).toBeUndefined();
  });
});
