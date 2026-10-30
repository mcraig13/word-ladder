import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset paths, so the built site works from any folder,
  // including GitHub Pages at /word-ladder/ (chunk 0.5).
  base: "./",
  test: {
    include: ["tests/**/*.test.ts"],
    // No tests exist until chunk 1.1. CLAUDE.md forbids placeholder tests,
    // so an empty suite passes instead. Remove this once real tests land.
    passWithNoTests: true,
  },
});
