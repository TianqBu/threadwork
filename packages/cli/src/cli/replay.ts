// `threadwork replay <task_id> [--json] [--serve] [--db <path>]`
// Default mode (no flags): write a single-file HTML replay to
//   <cwd>/.threadwork/replay/<task_id>.html
// --json:  print the raw ReplayDump JSON to stdout, do not write a file.
// --serve: open the rendered HTML in the user's default browser.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { readTask, dumpAsJson, renderHtml } from "threadwork-replay-ui";

export interface ReplayOptions {
  taskId: string;
  dbPath?: string;
  json?: boolean;
  serve?: boolean;
  out?: NodeJS.WritableStream;
  outFile?: string;
}

export async function replay(opts: ReplayOptions): Promise<number> {
  const out = opts.out ?? process.stdout;
  const dbPath = opts.dbPath ?? join(homedir(), ".threadwork", "db", "threadwork.sqlite");

  const { events, episodes } = readTask({ dbPath, taskId: opts.taskId });
  const dump = dumpAsJson({ taskId: opts.taskId, events, episodes });

  if (opts.json) {
    out.write(JSON.stringify(dump, null, 2) + "\n");
    return events.length;
  }

  const outFile = resolve(opts.outFile ?? join(".threadwork", "replay", `${opts.taskId}.html`));
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
