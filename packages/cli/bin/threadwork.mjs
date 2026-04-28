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
  replay <task_id|--last> [--serve|--json] [--db <path>]
                                  Render the step-level replay HTML.
                                  --last picks the most recent task in the db.
`);
  process.exit(0);
}

if (argv[0] === "init") {
  const { init } = await import("../dist/cli/init.js");
  init({ dryRun: argv.includes("--dry-run") });
  process.exit(0);
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

if (argv[0] === "replay") {
  const { replay } = await import("../dist/cli/replay.js");
  const dbIdx = argv.indexOf("--db");
  const wantsLast = argv.includes("--last");
  // First positional that isn't a flag (so `replay --last` works). Use the
  // index from `findIndex` directly so we don't risk argv.indexOf returning
  // the wrong slot when the positional value happens to equal another argv
  // entry (e.g. a task id literally called "--db").
  let positional;
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) continue;
    if (argv[i - 1] === "--db") continue;
    positional = a;
    break;
  }
  if (!wantsLast && !positional) {
    console.error("replay requires either a task_id or --last");
    process.exit(1);
  }
  const opts = {
    ...(positional ? { taskId: positional } : {}),
    last: wantsLast,
    json: argv.includes("--json"),
    serve: argv.includes("--serve"),
    ...(dbIdx >= 0 && argv[dbIdx + 1] ? { dbPath: argv[dbIdx + 1] } : {}),
  };
  await replay(opts);
  // Exit 0 in all cases — replay returning 0 events is a legitimate "no
  // tasks yet" or "task has no events" result, not a failure. Errors
  // from replay() throw and bubble up to a nonzero exit naturally.
  process.exit(0);
}

console.error(`unknown command: ${argv.join(" ")}\nrun 'threadwork --help' for usage.`);
process.exit(1);
