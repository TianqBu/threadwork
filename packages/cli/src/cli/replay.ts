// `threadwork replay <task_id> [--json]` — reads the user's Threadwork
// SQLite, dumps the task's traces+episodes as JSON. The polished HTML view
// (without --json) lands in W7; for now --json is the default and only
// supported mode.

import { join } from "node:path";
import { homedir } from "node:os";
import { readTask, dumpAsJson } from "threadwork-replay-ui";

export interface ReplayOptions {
  taskId: string;
  dbPath?: string;
  json?: boolean;
  out?: NodeJS.WritableStream;
}

export async function replay(opts: ReplayOptions): Promise<number> {
  const out = opts.out ?? process.stdout;
  const dbPath = opts.dbPath ?? join(homedir(), ".threadwork", "db", "threadwork.sqlite");

  // W6 ships --json only. W7 will branch here for the static HTML viewer.
  const { events, episodes } = readTask({ dbPath, taskId: opts.taskId });
  const dump = dumpAsJson({ taskId: opts.taskId, events, episodes });
  out.write(JSON.stringify(dump, null, 2) + "\n");
  return events.length;
}
