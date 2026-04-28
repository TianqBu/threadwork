import { describe, expect, it } from "vitest";
import { REPLAY_UI_VERSION, rolesIn, type TraceEvent } from "../src/index.js";

const sample: TraceEvent[] = [
  { id: 1, task_id: "t1", role: "researcher", event_type: "tool_call", content: "", parent_event_id: null, ts: "" },
  { id: 2, task_id: "t1", role: "writer",     event_type: "draft",     content: "", parent_event_id: 1,    ts: "" },
  { id: 3, task_id: "t1", role: "researcher", event_type: "tool_result", content: "", parent_event_id: 1,  ts: "" },
];

describe("replay-ui smoke", () => {
  it("exports a version", () => {
    expect(REPLAY_UI_VERSION).toBeTruthy();
  });

  it("rolesIn returns unique roles sorted", () => {
    expect(rolesIn(sample)).toEqual(["researcher", "writer"]);
  });
});
