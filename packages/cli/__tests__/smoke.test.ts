import { describe, expect, it } from "vitest";
import { VERSION, helloThreadwork } from "../src/index.js";

describe("threadwork cli smoke", () => {
  it("exports a non-empty version string", () => {
    expect(typeof VERSION).toBe("string");
    expect(VERSION.length).toBeGreaterThan(0);
  });

  it("helloThreadwork includes the version", () => {
    expect(helloThreadwork()).toContain(VERSION);
  });
});
