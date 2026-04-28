import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Writable } from "node:stream";
import { rolesList } from "../src/cli/roles-list.js";
import { rolesShow } from "../src/cli/roles-show.js";
import { rolesCreate } from "../src/cli/roles-create.js";
import { parseRole } from "../src/role/schema.js";
import { parse as parseYaml } from "yaml";

let tmpRoot: string;
let globalDir: string;
let projectDir: string;

class StringStream extends Writable {
  buf = "";
  override _write(chunk: Buffer | string, _enc: string, cb: (err?: Error | null) => void): void {
    this.buf += chunk.toString();
    cb();
  }
}

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "threadwork-cli-"));
  globalDir = join(tmpRoot, "global");
  projectDir = join(tmpRoot, "project");
  mkdirSync(globalDir, { recursive: true });
  mkdirSync(projectDir, { recursive: true });
});

afterEach(() => {
  if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true });
});

const yamlText = (name: string) => `name: ${name}
description: a test role
system_prompt: |
  You are ${name}.
tools_allowed:
  - Read
budget:
  max_tokens: 1000
  max_duration_sec: 60
`;

describe("roles list", () => {
  it("prints a table of discovered roles", async () => {
    writeFileSync(join(globalDir, "alpha.yaml"), yamlText("alpha"));
    writeFileSync(join(projectDir, "beta.yaml"), yamlText("beta"));
    const out = new StringStream();
    const entries = await rolesList({ globalDir, projectDir, out });
    expect(entries.map((e) => e.role.name)).toEqual(["alpha", "beta"]);
    expect(out.buf).toContain("NAME");
    expect(out.buf).toContain("alpha");
    expect(out.buf).toContain("beta");
    expect(out.buf).toContain("project");
    expect(out.buf).toContain("global");
  });

  it("emits a friendly message when no roles exist", async () => {
    const out = new StringStream();
    const entries = await rolesList({ globalDir, projectDir, out });
    expect(entries).toHaveLength(0);
    expect(out.buf).toContain("no roles found");
  });
});

describe("roles show", () => {
  it("prints rendered role contract", async () => {
    writeFileSync(join(globalDir, "alpha.yaml"), yamlText("alpha"));
    const out = new StringStream();
    const ok = await rolesShow({ name: "alpha", globalDir, projectDir, out });
    expect(ok).toBe(true);
    expect(out.buf).toContain("# alpha");
    expect(out.buf).toContain("system_prompt:");
    expect(out.buf).toContain("max_tokens: 1000");
  });

  it("returns false for a missing role", async () => {
    const out = new StringStream();
    const ok = await rolesShow({ name: "ghost", globalDir, projectDir, out });
    expect(ok).toBe(false);
    expect(out.buf).toContain("role not found");
  });
});

describe("roles create", () => {
  it("scaffolds a yaml that the loader accepts", async () => {
    const out = new StringStream();
    const path = await rolesCreate({ name: "noter", projectDir, out });
    const text = readFileSync(path, "utf8");
    expect(() => parseRole(parseYaml(text))).not.toThrow();
    expect(out.buf).toContain("created");
  });

  it("refuses to overwrite without force", async () => {
    await rolesCreate({ name: "noter", projectDir, out: new StringStream() });
    await expect(
      rolesCreate({ name: "noter", projectDir, out: new StringStream() }),
    ).rejects.toThrow(/already exists/);
  });

  it("rejects invalid names", async () => {
    await expect(
      rolesCreate({ name: "BadName", projectDir, out: new StringStream() }),
    ).rejects.toThrow(/invalid role name/);
  });
});
