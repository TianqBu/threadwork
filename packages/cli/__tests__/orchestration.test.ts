import { describe, expect, it } from "vitest";
import {
  researchThenWrite,
  parallelReview,
  codeReviewFix,
  type CallRole,
} from "../src/orchestration/index.js";

function mockLlm(table: Record<string, string | ((iter: number) => string)>): CallRole {
  return async (ctx, _msg) => {
    const key = `${ctx.role}:${ctx.phase}`;
    const v = table[key];
    if (typeof v === "function") return v(ctx.iteration ?? 1);
    if (typeof v === "string") return v;
    return `(no canned response for ${key})`;
  };
}

describe("research-then-write", () => {
  it("records role transitions in the expected order", async () => {
    const call = mockLlm({
      "researcher:research": "1. MCP spec is dated 2025-11-25 (source: modelcontextprotocol.io)",
      "writer:compose": "MCP's current spec is dated 2025-11-25.",
    });
    const { transcript, final } = await researchThenWrite({ task: "MCP spec date?", callRole: call });
    expect(transcript.map((t) => `${t.role}:${t.phase}`)).toEqual([
      "researcher:research",
      "writer:compose",
    ]);
    expect(final).toContain("2025-11-25");
  });
});

describe("parallel-review", () => {
  it("runs three reviewers in parallel and majority-votes", async () => {
    const call = mockLlm({
      "reviewer:review-1": "APPROVED looks good",
      "reviewer:review-2": "APPROVED no issues",
      "reviewer:review-3": "REVISE minor naming nit",
    });
    const { transcript, final } = await parallelReview({ task: "review this PR", callRole: call });
    expect(transcript).toHaveLength(3);
    expect(final).toBe("APPROVED");
  });
});

describe("code-review-fix", () => {
  it("loops until reviewer APPROVES", async () => {
    let calls = 0;
    const call: CallRole = async (ctx) => {
      calls++;
      if (ctx.role === "coder") return `code v${ctx.iteration}`;
      if (ctx.iteration === 1) return "REVISE bug on line 1";
      return "APPROVED looks good now";
    };
    const { transcript, final } = await codeReviewFix({ task: "fix bug", callRole: call });
    expect(final).toBe("code v2");
    expect(transcript.map((t) => `${t.role}:${t.iteration}`)).toEqual([
      "coder:1",
      "reviewer:1",
      "coder:2",
      "reviewer:2",
    ]);
    expect(calls).toBe(4);
  });

  it("stops after maxIterations even if reviewer never approves", async () => {
    const call: CallRole = async (ctx) =>
      ctx.role === "coder" ? `code v${ctx.iteration}` : `REVISE still wrong (iter ${ctx.iteration})`;
    const { transcript, final } = await codeReviewFix({
      task: "fix bug",
      callRole: call,
      maxIterations: 2,
    });
    expect(final).toBe("code v2");
    expect(transcript).toHaveLength(4); // 2 coder + 2 reviewer
  });
});
