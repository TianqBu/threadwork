// Threadwork MCP server entry. Exposes:
//  - createMcpServer({ db }): build an McpServer with all memory_* + trace_record tools
//  - runStdioServer({ dbPath }): convenience launcher used by bin/server.mjs
//  - describeServer / MCP_SERVER_VERSION: compatibility helpers retained from W2 stub

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { openDb } from "./db/index.js";
import { createMcpServer, MCP_SERVER_NAME, MCP_SERVER_VERSION } from "./server.js";

export {
  createMcpServer,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  type CreateServerOptions,
} from "./server.js";

export interface ThreadworkServerOptions {
  dbPath: string;
}

export function describeServer(opts: ThreadworkServerOptions): string {
  return `${MCP_SERVER_NAME} v${MCP_SERVER_VERSION} (db=${opts.dbPath})`;
}

export interface RunStdioServerOptions {
  dbPath: string;
}

export interface RunningServer {
  close: () => Promise<void>;
}

export async function runStdioServer(opts: RunStdioServerOptions): Promise<RunningServer> {
  const db = openDb({ path: opts.dbPath });
  const server = createMcpServer({ db });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`${describeServer({ dbPath: opts.dbPath })} ready on stdio\n`);
  return {
    close: async () => {
      await server.close();
      db.close();
    },
  };
}
