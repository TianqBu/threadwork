import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["packages/cli/src/**", "packages/mcp-server/src/**"],
      thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
    },
  },
});
