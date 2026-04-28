import { describe, expect, it } from "vitest";
import { parseRole, RoleYamlSchema } from "../src/role/schema.js";

const happy = {
  name: "researcher",
  description: "finds facts",
  system_prompt: "You are a researcher.",
  tools_allowed: ["WebSearch", "Read"],
  budget: { max_tokens: 50000, max_duration_sec: 300 },
};

describe("role schema", () => {
  it("accepts a minimal valid role", () => {
    expect(() => parseRole(happy)).not.toThrow();
  });

  it("rejects role missing required name", () => {
    const bad = { ...happy } as Record<string, unknown>;
    delete bad.name;
    expect(() => parseRole(bad)).toThrow(/name/);
  });

  it("rejects role with non-numeric max_tokens", () => {
    const bad = { ...happy, budget: { ...happy.budget, max_tokens: "lots" } };
    expect(() => parseRole(bad)).toThrow();
  });

  it("rejects unknown top-level fields (strict mode)", () => {
    const bad = { ...happy, color: "blue" };
    expect(() => parseRole(bad)).toThrow();
  });

  it("rejects empty system_prompt", () => {
    const bad = { ...happy, system_prompt: "" };
    expect(() => parseRole(bad)).toThrow(/system_prompt/);
  });

  it("rejects names with uppercase or spaces", () => {
    const bad1 = { ...happy, name: "Researcher" };
    const bad2 = { ...happy, name: "my role" };
    expect(() => parseRole(bad1)).toThrow();
    expect(() => parseRole(bad2)).toThrow();
  });

  it("defaults tools_allowed to empty array when omitted", () => {
    const minimal = { ...happy } as Record<string, unknown>;
    delete minimal.tools_allowed;
    const parsed = RoleYamlSchema.parse(minimal);
    expect(parsed.tools_allowed).toEqual([]);
  });
});
