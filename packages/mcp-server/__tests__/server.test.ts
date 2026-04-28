import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { openDb, type DatabaseSync } from "../src/db/index.js";
import { createMcpServer, MCP_SERVER_NAME, MCP_SERVER_VERSION } from "../src/server.js";

let tmpRoot: string;
let db: DatabaseSync;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "threadwork-server-"));
  db = openDb({ path: join(tmpRoot, "server.sqlite") });
});

afterEach(() => {
  db.close();
  if (existsSync(tmpRoot)) rmSync(tmpRoot, { recursive: true, force: true });
});

async function connectClient(): Promise<Client> {
  const server = createMcpServer({ db });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "threadwork-test-client", version: "0.0.0" });
  await client.connect(clientTransport);
  return client;
}

function unwrapJson<T>(content: unknown): T {
  const arr = content as Array<{ type: string; text: string }>;
  return JSON.parse(arr[0].text) as T;
}

describe("createMcpServer", () => {
  it("constants match the package", () => {
    expect(MCP_SERVER_NAME).toBe("threadwork-mcp-server");
    expect(MCP_SERVER_VERSION).toBe("0.1.0");
  });

  it("answers tools/list with all 7 expected tools", async () => {
    const client = await connectClient();
    try {
      const result = await client.listTools();
      const names = result.tools.map((t) => t.name).sort();
      expect(names).toEqual(
        [
          "memory_get_working",
          "memory_recall_episodes",
          "memory_recall_facts",
          "memory_set_working",
          "memory_write_episode",
          "memory_write_fact",
          "trace_record",
        ].sort(),
      );
    } finally {
      await client.close();
    }
  });

  it("memory_write_episode call writes a row and emits a trace", async () => {
    const client = await connectClient();
    try {
      const result = await client.callTool({
        name: "memory_write_episode",
        arguments: {
          task_id: "smoke-1",
          role: "writer",
          content: "first episode",
        },
      });
      expect(result.isError ?? false).toBe(false);
      const parsed = unwrapJson<{ id: number; deduped: boolean }>(result.content);
      expect(parsed.id).toBeGreaterThan(0);
      expect(parsed.deduped).toBe(false);

      const epRow = db.prepare("SELECT count(*) c FROM episodes").get() as { c: number };
      expect(epRow.c).toBe(1);
      const trRow = db
        .prepare("SELECT event_type, episode_id FROM traces WHERE task_id = ?")
        .get("smoke-1") as { event_type: string; episode_id: number };
      expect(trRow.event_type).toBe("memory_write_episode");
      expect(trRow.episode_id).toBe(parsed.id);
    } finally {
      await client.close();
    }
  });

  it("memory_recall_episodes returns FTS5-ranked rows", async () => {
    const client = await connectClient();
    try {
      await client.callTool({
        name: "memory_write_episode",
        arguments: { task_id: "r1", role: "researcher", content: "the MCP spec is dated 2025-11-25" },
      });
      const result = await client.callTool({
        name: "memory_recall_episodes",
        arguments: { query: "MCP" },
      });
      const rows = unwrapJson<Array<{ content: string }>>(result.content);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]?.content).toContain("MCP");
    } finally {
      await client.close();
    }
  });

  it("trace_record stores a custom event", async () => {
    const client = await connectClient();
    try {
      const result = await client.callTool({
        name: "trace_record",
        arguments: {
          task_id: "tr-1",
          role: "writer",
          event_type: "tool_call",
          content: "WebSearch",
        },
      });
      const parsed = unwrapJson<{ id: number }>(result.content);
      expect(parsed.id).toBeGreaterThan(0);
      const row = db
        .prepare("SELECT event_type, content FROM traces WHERE id = ?")
        .get(parsed.id) as { event_type: string; content: string };
      expect(row.event_type).toBe("tool_call");
      expect(row.content).toBe("WebSearch");
    } finally {
      await client.close();
    }
  });
});
