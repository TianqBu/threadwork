// Threadwork CLI library entry. The bin script in `bin/threadwork.mjs`
// imports from this module's compiled output. Top-level commands land in
// W3 (`roles list`) and W4 (`roles show/create`).

export const VERSION = "0.1.0";

export function helloThreadwork(): string {
  return `threadwork v${VERSION}`;
}
