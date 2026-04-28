// Threadwork orchestration patterns. Each function is a tiny, deterministic
// runner that fans work out across roles using a caller-supplied `callRole`
// implementation. The real CLI binds `callRole` to the parent session's
// Task / Agent dispatch; tests bind it to a mock LLM.

import type { CallRole, OrchestrationResult, TranscriptEntry } from "./types.js";

export interface ResearchThenWriteOpts {
  task: string;
  callRole: CallRole;
}

export async function researchThenWrite(opts: ResearchThenWriteOpts): Promise<OrchestrationResult> {
  const transcript: TranscriptEntry[] = [];

  const researchOutput = await opts.callRole(
    { role: "researcher", phase: "research", iteration: 1 },
    opts.task,
  );
  transcript.push({ role: "researcher", phase: "research", iteration: 1, output: researchOutput });

  const writerInput = `Task: ${opts.task}\n\nResearcher notes:\n${researchOutput}`;
  const final = await opts.callRole(
    { role: "writer", phase: "compose", iteration: 1 },
    writerInput,
  );
  transcript.push({ role: "writer", phase: "compose", iteration: 1, output: final });

  return { transcript, final };
}

export interface ParallelReviewOpts {
  task: string;
  reviewers?: string[]; // role names; defaults to ["reviewer", "reviewer", "reviewer"]
  callRole: CallRole;
}

export async function parallelReview(opts: ParallelReviewOpts): Promise<OrchestrationResult> {
  const reviewerRoles = opts.reviewers ?? ["reviewer", "reviewer", "reviewer"];
  if (reviewerRoles.length < 1) throw new Error("parallelReview needs at least one reviewer");

  const verdicts = await Promise.all(
    reviewerRoles.map(async (role, idx) =>
      opts.callRole({ role, phase: `review-${idx + 1}`, iteration: 1 }, opts.task),
    ),
  );

  const transcript: TranscriptEntry[] = reviewerRoles.map((role, idx) => ({
    role,
    phase: `review-${idx + 1}`,
    iteration: 1,
    output: verdicts[idx] ?? "",
  }));

  // Majority vote on first token APPROVED / REVISE / REJECT.
  const tally = new Map<string, number>();
  for (const v of verdicts) {
    const verdict = (v.trim().split(/\s+/)[0] ?? "").toUpperCase();
    tally.set(verdict, (tally.get(verdict) ?? 0) + 1);
  }
  const winner = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "REVISE";

  return { transcript, final: winner };
}

export interface CodeReviewFixOpts {
  task: string;
  maxIterations?: number; // default 3
  callRole: CallRole;
}

export async function codeReviewFix(opts: CodeReviewFixOpts): Promise<OrchestrationResult> {
  const maxIter = opts.maxIterations ?? 3;
  const transcript: TranscriptEntry[] = [];
  let lastCode = "";
  let lastReview = "";

  for (let i = 1; i <= maxIter; i++) {
    const coderInput = i === 1
      ? opts.task
      : `Original task: ${opts.task}\n\nPrior code:\n${lastCode}\n\nReviewer feedback:\n${lastReview}`;
    lastCode = await opts.callRole({ role: "coder", phase: "implement", iteration: i }, coderInput);
    transcript.push({ role: "coder", phase: "implement", iteration: i, output: lastCode });

    lastReview = await opts.callRole(
      { role: "reviewer", phase: "review", iteration: i },
      `Task: ${opts.task}\n\nCode under review:\n${lastCode}`,
    );
    transcript.push({ role: "reviewer", phase: "review", iteration: i, output: lastReview });

    const verdict = (lastReview.trim().split(/\s+/)[0] ?? "").toUpperCase();
    if (verdict === "APPROVED") {
      return { transcript, final: lastCode };
    }
  }

  return { transcript, final: lastCode };
}
