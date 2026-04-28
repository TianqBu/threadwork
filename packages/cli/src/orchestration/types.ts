// Shared orchestration types. The runner functions accept a `callRole`
// callback so unit tests can pass a mock LLM and inspect transitions, while
// the real CLI binds it to whatever the parent session provides.

export interface RoleCallContext {
  role: string;
  phase: string;
  iteration?: number;
}

export type CallRole = (
  ctx: RoleCallContext,
  message: string,
) => Promise<string>;

export interface TranscriptEntry {
  role: string;
  phase: string;
  iteration: number;
  output: string;
}

export interface OrchestrationResult {
  transcript: TranscriptEntry[];
  final: string;
}
