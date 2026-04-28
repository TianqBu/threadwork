// Renders a single-file HTML replay viewer from a ReplayDump.

import type { ReplayDump } from "./types.js";
import { HTML_TEMPLATE } from "./html-template.js";

export interface RenderHtmlOptions {
  dump: ReplayDump;
  title?: string;
}

export function renderHtml(opts: RenderHtmlOptions): string {
  const title = escapeHtml(opts.title ?? `Threadwork replay — ${opts.dump.task_id}`);
  const json = jsonForScript(opts.dump);
  return HTML_TEMPLATE.replace("__THREADWORK_TITLE__", title).replace(
    "__THREADWORK_DUMP__",
    json,
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Embed JSON safely inside <script type="application/json">. Closing
// `</script>` and `<!--` sequences would prematurely terminate the script
// block; both must be escaped. U+2028 / U+2029 are line separators that
// some JSON consumers mishandle inside a script block; we replace them
// with their JSON-escaped form. Regexes for the line separators are built
// dynamically so the source file stays plain ASCII.
const LS_REGEX = new RegExp(String.fromCharCode(0x2028), "g");
const PS_REGEX = new RegExp(String.fromCharCode(0x2029), "g");

function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/<\/(script)/gi, "<\\/$1")
    .replace(/<!--/g, "<\\!--")
    .replace(LS_REGEX, "\\u2028")
    .replace(PS_REGEX, "\\u2029");
}
