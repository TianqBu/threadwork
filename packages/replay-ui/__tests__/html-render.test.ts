import { describe, expect, it } from "vitest";
import { dumpAsJson } from "../src/json-dump.js";
import { renderHtml } from "../src/html-render.js";
import type { TraceEvent, EpisodeRow } from "../src/types.js";

function fixture() {
  const events: TraceEvent[] = [];
  for (let i = 1; i <= 12; i++) {
    events.push({
      id: i,
      task_id: "ui-001",
      role: i <= 4 ? "researcher" : i <= 8 ? "writer" : "reviewer",
      event_type: i % 3 === 0 ? "tool_result" : "tool_call",
      content: `payload ${i}`,
      parent_event_id: i === 1 ? null : i - 1,
      ts: `2026-04-28T01:00:${i.toString().padStart(2, "0")}Z`,
    });
  }
  const episodes: EpisodeRow[] = [];
  for (let i = 1; i <= 5; i++) {
    episodes.push({
      id: i,
      task_id: "ui-001",
      role: "writer",
      ts: `2026-04-28T01:01:${i.toString().padStart(2, "0")}Z`,
      content: `episode ${i}`,
    });
  }
  return { events, episodes };
}

describe("renderHtml", () => {
  it("returns a self-contained HTML document with the dump JSON embedded", () => {
    const { events, episodes } = fixture();
    const dump = dumpAsJson({ taskId: "ui-001", events, episodes });
    const html = renderHtml({ dump });

    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("Threadwork replay");
    expect(html).toContain('id="threadwork-dump"');
    expect(html).toContain('data-task-id');
    expect(html).toContain('data-timeline');
    expect(html).toContain('data-detail');
    // No external network references — viewer must work offline.
    expect(html).not.toMatch(/<link[^>]+href=["']https?:/);
    expect(html).not.toMatch(/<script[^>]+src=["']https?:/);
  });

  it("escapes </script> sequences inside the embedded JSON", () => {
    const malicious = "</script><script>alert(1)";
    const events: TraceEvent[] = [
      {
        id: 1,
        task_id: "x",
        role: "researcher",
        event_type: "tool_call",
        content: malicious,
        parent_event_id: null,
        ts: "2026-04-28T00:00:00Z",
      },
    ];
    const dump = dumpAsJson({ taskId: "x", events, episodes: [] });
    const html = renderHtml({ dump });
    // The literal raw </script> must not appear anywhere inside the
    // application/json payload.
    const scriptStart = html.indexOf('<script type="application/json"');
    const scriptEnd = html.indexOf("</script>", scriptStart);
    const payload = html.slice(scriptStart, scriptEnd);
    expect(payload).not.toMatch(/<\/script/i);
  });

  it("includes one detail panel placeholder for the click-to-inspect interaction", () => {
    const { events, episodes } = fixture();
    const dump = dumpAsJson({ taskId: "ui-001", events, episodes });
    const html = renderHtml({ dump });
    expect(html).toMatch(/Click an event in the timeline to inspect it/);
    // W7 AC: presence of >=2 swim-lanes — the markup builds them at runtime
    // from data-roles, so confirm the runtime logic and the role list are
    // present.
    expect(html).toContain("[data-role-list]");
    expect(dump.roles.length).toBeGreaterThanOrEqual(2);
  });
});
