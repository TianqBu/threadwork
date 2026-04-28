// Zod schema for a Threadwork role yaml. The shape must match
// experiments/w0/spike-role.*.yaml so that W0 spike yamls are upward
// compatible with the production loader.

import { z } from "zod";

export const RoleYamlSchema = z
  .object({
    name: z
      .string()
      .min(1, "name required")
      .max(64, "name max 64 chars")
      .regex(/^[a-z0-9][a-z0-9-]*$/, "name must be lowercase letters, digits, and hyphens"),
    description: z.string().min(1, "description required").max(500),
    system_prompt: z.string().min(1, "system_prompt required"),
    tools_allowed: z.array(z.string().min(1)).default([]),
    budget: z.object({
      max_tokens: z.number().int().positive("max_tokens must be positive integer"),
      max_duration_sec: z.number().int().positive("max_duration_sec must be positive integer"),
    }),
  })
  .strict();

export type RoleYaml = z.infer<typeof RoleYamlSchema>;

export function parseRole(raw: unknown): RoleYaml {
  return RoleYamlSchema.parse(raw);
}
