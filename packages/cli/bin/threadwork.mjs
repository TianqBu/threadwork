#!/usr/bin/env node
// Entry point published as the `threadwork` bin. The body is intentionally
// thin: real subcommand wiring lands in W3 (roles list) / W4 (roles
// show/create). For W2 the script just confirms the package installs and
// resolves its compiled main.

import { helloThreadwork } from "../dist/index.js";

const argv = process.argv.slice(2);

if (argv.length === 0 || argv[0] === "--version" || argv[0] === "-v") {
  console.log(helloThreadwork());
  process.exit(0);
}

if (argv[0] === "--help" || argv[0] === "-h") {
  console.log(`Usage: threadwork <command> [options]

Available commands (filled in during W3/W4):
  roles list             List discovered role yamls.
  roles show <name>      Print the rendered role contract.
  roles create <name>    Scaffold a new role yaml.
  init                   Register the Threadwork MCP server in ~/.claude.json.
  replay <task_id>       Open the step-level replay UI for a task.
`);
  process.exit(0);
}

console.error(`unknown command: ${argv[0]}\nrun 'threadwork --help' for usage.`);
process.exit(1);
