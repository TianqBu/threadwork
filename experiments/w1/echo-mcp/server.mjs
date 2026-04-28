#!/usr/bin/env node
// W1 spike: minimal MCP stdio echo server using @modelcontextprotocol/sdk.
// Exposes a single `echo` tool that returns whatever string it was given.
// Used to verify that an MCP server registered in ~/.claude.json can be
// reached from a Claude Code session inside a Skill invocation.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "threadwork-w1-echo", version: "0.0.1" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "echo",
      description: "Return the input text unchanged. Spike validation only.",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name !== "echo") {
    throw new Error(`unknown tool: ${req.params.name}`);
  }
  const { text } = req.params.arguments ?? {};
  return { content: [{ type: "text", text: String(text ?? "") }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
