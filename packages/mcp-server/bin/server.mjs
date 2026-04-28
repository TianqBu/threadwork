#!/usr/bin/env node
// MCP server bin. Real implementation lands in W5-W7 (memory + trace tools).
// W2 stub: prints version and exits 0 so packaging + path wiring is verified.

import { describeServer } from "../dist/index.js";

const dbPath = process.env.THREADWORK_DB ?? "~/.threadwork/db/threadwork.sqlite";
console.error(describeServer({ dbPath }));
console.error("(W2 stub: full MCP loop activates in W5-W7)");
process.exit(0);
