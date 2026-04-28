import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/__tests__/**/*.test.ts"],
    pool: "forks",
    server: {
      deps: {
        // Node built-ins must stay external so vite does not try to resolve
        // `node:sqlite` as a npm package. node:sqlite is experimental in
        // Node 22.5+ and shipped stable in 24.x.
        external: [/^node:/],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["packages/cli/src/**", "packages/mcp-server/src/**"],
      thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
    },
  },
});
