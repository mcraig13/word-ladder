import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset paths, so the built site works from any folder,
  // including GitHub Pages at /word-ladder/ (chunk 0.5).
  base: "./",
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
