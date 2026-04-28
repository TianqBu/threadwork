// `threadwork replay <task_id|--last> [--json] [--serve] [--db <path>]`
// Default mode (no flags): write a single-file HTML replay to
//   <cwd>/.threadwork/replay/<task_id>.html
// --last:  resolve to the most recent task_id in the database (handy when
//          you just finished a run and don't remember the id).
// --json:  print the raw ReplayDump JSON to stdout, do not write a file.
// --serve: open the rendered HTML in the user's default browser.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { readTask, dumpAsJson, renderHtml, findLastTaskId } from "threadwork-replay-ui";

export interface ReplayOptions {
  /** Task id to replay. Mutually exclusive with `last`. */
  taskId?: string;
  /** Resolve task id from the most recent trace/episode row. */
  last?: boolean;
  dbPath?: string;
  json?: boolean;
  serve?: boolean;
  out?: NodeJS.WritableStream;
  outFile?: string;
}

export async function replay(opts: ReplayOptions): Promise<number> {
  const out = opts.out ?? process.stdout;
  const dbPath = opts.dbPath ?? join(homedir(), ".threadwork", "db", "threadwork.sqlite");

  let taskId = opts.taskId;
  if (!taskId) {
    if (!opts.last) {
      throw new Error("replay requires either a task_id argument or --last");
    }
    const resolved = findLastTaskId(dbPath);
    if (!resolved) {
      out.write(`no tasks found in ${dbPath}\n`);
      return 0;
    }
    taskId = resolved;
    out.write(`--last resolved to task_id=${taskId}\n`);
  }

  const { events, episodes } = readTask({ dbPath, taskId });
  const dump = dumpAsJson({ taskId, events, episodes });

  if (opts.json) {
    out.write(JSON.stringify(dump, null, 2) + "\n");
    return events.length;
  }

  const outFile = resolve(opts.outFile ?? join(".threadwork", "replay", `${taskId}.html`));
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, renderHtml({ dump }), "utf8");
  out.write(`wrote ${outFile}\n`);

  if (opts.serve) {
    try {
      const { default: open } = await import("open");
      await open(outFile);
    } catch (err) {
      out.write(`(could not auto-open: ${(err as Error).message})\n`);
    }
  }

  return events.length;
}
