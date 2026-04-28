#!/usr/bin/env node
// Entry point published as the `threadwork` bin. W3 wires up `roles list`;
// W4 will add `roles show / roles create`; W5+ will add `init`, `replay`,
// `bench:run`, etc.

import { helloThreadwork } from "../dist/index.js";

const argv = process.argv.slice(2);

if (argv.length === 0 || argv[0] === "--version" || argv[0] === "-v") {
  console.log(helloThreadwork());
  process.exit(0);
}

if (argv[0] === "--help" || argv[0] === "-h") {
  console.log(`Usage: threadwork <command> [options]

Available commands:
  init [--dry-run]                Register the Threadwork MCP server in
                                  ~/.claude.json (with backup) and lay
                                  down ~/.threadwork/{roles,db}.
  uninstall [--purge]             Remove the MCP server entry. --purge
                                  also deletes ~/.threadwork.
  roles list                      List discovered role yamls.
  roles show <name>               Print the rendered role contract.
  roles create <name> [--force]   Scaffold a new role yaml.
  replay <task_id> [--serve|--json] [--db <path>]
                                  Render the step-level replay HTML.
`);
  process.exit(0);
}

if (argv[0] === "init") {
  const { init } = await import("../dist/cli/init.js");
  const r = init({ dryRun: argv.includes("--dry-run") });
  process.exit(r.changed || r.dryRun ? 0 : 0);
}

if (argv[0] === "uninstall") {
  const { uninstall } = await import("../dist/cli/uninstall.js");
  uninstall({ purge: argv.includes("--purge") });
  process.exit(0);
}

if (argv[0] === "roles" && argv[1] === "list") {
  const { rolesList } = await import("../dist/cli/roles-list.js");
  await rolesList();
  process.exit(0);
}

if (argv[0] === "roles" && argv[1] === "show" && argv[2]) {
  const { rolesShow } = await import("../dist/cli/roles-show.js");
  const ok = await rolesShow({ name: argv[2] });
  process.exit(ok ? 0 : 1);
}

if (argv[0] === "roles" && argv[1] === "create" && argv[2]) {
  const { rolesCreate } = await import("../dist/cli/roles-create.js");
  try {
    await rolesCreate({ name: argv[2], force: argv.includes("--force") });
    process.exit(0);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

if (argv[0] === "replay" && argv[1]) {
  const { replay } = await import("../dist/cli/replay.js");
  const dbIdx = argv.indexOf("--db");
  const opts = {
    taskId: argv[1],
    json: argv.includes("--json"),
    serve: argv.includes("--serve"),
    ...(dbIdx >= 0 && argv[dbIdx + 1] ? { dbPath: argv[dbIdx + 1] } : {}),
  };
  const eventCount = await replay(opts);
  process.exit(eventCount > 0 ? 0 : 1);
}

console.error(`unknown command: ${argv.join(" ")}\nrun 'threadwork --help' for usage.`);
process.exit(1);
