// Threadwork MCP server entry. Real tool registrations (memory_*, trace_*)
// land in W5-W7. For W2 the entry just exports a stub so the package builds.

export const MCP_SERVER_VERSION = "0.1.0";

export interface ThreadworkServerOptions {
  dbPath: string;
}

export function describeServer(opts: ThreadworkServerOptions): string {
  return `threadwork-mcp-server v${MCP_SERVER_VERSION} (db=${opts.dbPath})`;
}
