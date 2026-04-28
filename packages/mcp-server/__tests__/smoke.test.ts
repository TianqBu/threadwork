import { describe, expect, it } from "vitest";
import { MCP_SERVER_VERSION, describeServer } from "../src/index.js";

describe("mcp-server smoke", () => {
  it("describeServer renders the version and db path", () => {
    const out = describeServer({ dbPath: "/tmp/threadwork.sqlite" });
    expect(out).toContain(MCP_SERVER_VERSION);
    expect(out).toContain("/tmp/threadwork.sqlite");
  });
});
