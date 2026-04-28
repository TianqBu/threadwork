// Single-file HTML template for the replay viewer. The placeholder
// `__THREADWORK_DUMP__` is replaced with a JSON-escaped ReplayDump at
// render time. The template is intentionally framework-free; everything
// runs in the browser from inline vanilla JS.

export const HTML_TEMPLATE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>__THREADWORK_TITLE__</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --bg: #0F1117;
      --card: #161A22;
      --border: #2A2F3A;
      --text: #F4F3EE;
      --muted: #8B92A1;
      --accent: #E8FF3A;
      --r-researcher: #6EA8FE;
      --r-writer: #B197FC;
      --r-coder: #63E6BE;
      --r-reviewer: #FFD43B;
      --r-other: #ADB5BD;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; height: 100%; }
    body {
      background: var(--bg);
      color: var(--text);
      font: 14px/1.5 -apple-system, "SF Mono", "Geist Mono", Menlo, Consolas, monospace;
    }
    header {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: baseline;
      gap: 16px;
    }
    header h1 {
      font-size: 16px; margin: 0; font-weight: 600;
      font-family: "Instrument Serif", Georgia, serif;
      letter-spacing: 0.02em;
    }
    header .meta { color: var(--muted); font-size: 12px; }
    header .accent { color: var(--accent); }
    main { padding: 24px; display: grid; grid-template-rows: auto 1fr; gap: 24px; min-height: calc(100% - 60px); }
    .timeline {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px;
      overflow-x: auto;
    }
    .swim-row { display: grid; grid-template-columns: 120px 1fr; align-items: center; gap: 12px; min-height: 32px; }
    .swim-label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
    .swim-track { display: flex; gap: 4px; flex-wrap: wrap; padding: 4px 0; }
    .event {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 4px;
      background: var(--border);
      color: var(--text);
      font-size: 11px;
      cursor: pointer;
      border: 1px solid transparent;
      user-select: none;
    }
    .event:hover { border-color: var(--accent); }
    .event.selected { border-color: var(--accent); background: #20241E; }
    .event .id { color: var(--muted); font-variant-numeric: tabular-nums; }
    .event .type { font-weight: 600; }
    .event[data-role="researcher"] { box-shadow: inset 0 -2px var(--r-researcher); }
    .event[data-role="writer"]     { box-shadow: inset 0 -2px var(--r-writer); }
    .event[data-role="coder"]      { box-shadow: inset 0 -2px var(--r-coder); }
    .event[data-role="reviewer"]   { box-shadow: inset 0 -2px var(--r-reviewer); }
    .detail {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px;
      min-height: 200px;
    }
    .detail h2 {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin: 0 0 12px;
    }
    .detail .placeholder { color: var(--muted); }
    .detail .head { display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap; margin-bottom: 8px; }
    .detail .head .role { color: var(--accent); font-weight: 600; }
    .detail .head .ts { color: var(--muted); font-size: 12px; }
    .detail pre {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 12px;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 360px;
      overflow: auto;
      margin: 0;
    }
    footer { padding: 12px 24px; color: var(--muted); font-size: 11px; border-top: 1px solid var(--border); }
  </style>
</head>
<body>
  <header>
    <h1>Threadwork replay</h1>
    <span class="meta">task <span class="accent" data-task-id></span></span>
    <span class="meta"><span data-event-count></span> events &middot; <span data-episode-count></span> episodes &middot; roles: <span data-role-list></span></span>
  </header>
  <main>
    <section class="timeline" aria-label="Per-role event timeline" data-timeline></section>
    <section class="detail" aria-live="polite">
      <h2>Event detail</h2>
      <div data-detail><p class="placeholder">Click an event in the timeline to inspect it.</p></div>
    </section>
  </main>
  <footer>Generated <span data-generated></span> by threadwork-replay-ui.</footer>

  <script type="application/json" id="threadwork-dump">__THREADWORK_DUMP__</script>
  <script>
    (function () {
      const node = document.getElementById("threadwork-dump");
      const dump = JSON.parse(node.textContent || "{}");

      document.querySelector("[data-task-id]").textContent = dump.task_id || "(unknown)";
      document.querySelector("[data-event-count]").textContent = String(dump.totals && dump.totals.events || 0);
      document.querySelector("[data-episode-count]").textContent = String(dump.totals && dump.totals.episodes || 0);
      document.querySelector("[data-role-list]").textContent = (dump.roles || []).join(", ") || "—";
      document.querySelector("[data-generated]").textContent = dump.generated_at || "";

      const timeline = document.querySelector("[data-timeline]");
      const eventsByRole = new Map();
      for (const role of (dump.roles || [])) eventsByRole.set(role, []);
      for (const ev of (dump.events || [])) {
        if (!eventsByRole.has(ev.role)) eventsByRole.set(ev.role, []);
        eventsByRole.get(ev.role).push(ev);
      }

      let selected = null;
      const detail = document.querySelector("[data-detail]");

      function renderDetail(ev) {
        if (!ev) {
          detail.innerHTML = '<p class="placeholder">Click an event in the timeline to inspect it.</p>';
          return;
        }
        detail.replaceChildren();
        const head = document.createElement("div");
        head.className = "head";
        const role = document.createElement("span"); role.className = "role"; role.textContent = ev.role;
        const type = document.createElement("span"); type.textContent = "#" + ev.id + " · " + ev.event_type;
        const ts = document.createElement("span"); ts.className = "ts"; ts.textContent = ev.ts;
        head.append(role, type, ts);
        const pre = document.createElement("pre");
        pre.textContent = ev.content || "(empty)";
        detail.append(head, pre);
      }

      for (const [role, events] of eventsByRole) {
        const row = document.createElement("div");
        row.className = "swim-row";
        const label = document.createElement("div");
        label.className = "swim-label"; label.textContent = role;
        const track = document.createElement("div");
        track.className = "swim-track";
        for (const ev of events) {
          const node = document.createElement("button");
          node.type = "button";
          node.className = "event";
          node.dataset.role = ev.role;
          node.dataset.id = String(ev.id);
          const idSpan = document.createElement("span");
          idSpan.className = "id"; idSpan.textContent = "#" + ev.id;
          const typeSpan = document.createElement("span");
          typeSpan.className = "type"; typeSpan.textContent = ev.event_type;
          node.append(idSpan, typeSpan);
          node.addEventListener("click", function () {
            if (selected) selected.classList.remove("selected");
            node.classList.add("selected");
            selected = node;
            renderDetail(ev);
          });
          track.appendChild(node);
        }
        row.append(label, track);
        timeline.appendChild(row);
      }
    })();
  </script>
</body>
</html>
`;
