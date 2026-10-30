import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // No tests exist until chunk 1.1. CLAUDE.md forbids placeholder tests,
    // so an empty suite passes instead. Remove this once real tests land.
    passWithNoTests: true,
  },
});
