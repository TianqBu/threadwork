#!/usr/bin/env node
// W1 spike: MCP stdio trace server. Exposes one tool, `trace_record`, that
// writes a row to spike-traces.sqlite. The recording logic lives in
// ./lib.mjs so the smoke test can hit it without going through stdio.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { openDb, recordTrace } from "./lib.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.THREADWORK_W1_DB ?? join(here, "spike-traces.sqlite");
const db = openDb(dbPath);

const server = new Server(
  { name: "threadwork-w1-trace", version: "0.0.1" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "trace_record",
      description:
        "Record a step-level trace event for a Threadwork task. Spike-grade; persistent storage moves to packages/mcp-server in W7.",
      inputSchema: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          role: { type: "string" },
          event_type: { type: "string" },
          content: { type: "string" },
          parent_event_id: { type: ["integer", "null"] },
        },
        required: ["task_id", "role", "event_type"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name !== "trace_record") {
    throw new Error(`unknown tool: ${req.params.name}`);
  }
  const { id } = recordTrace(db, req.params.arguments ?? {});
  return { content: [{ type: "text", text: JSON.stringify({ id }) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
