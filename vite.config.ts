import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset paths, so the built site works from any folder,
  // including GitHub Pages at /word-ladder/ (chunk 0.5).
  base: "./",
  test: {
    include: ["tests/**/*.test.ts"],
    // Lines and branches the tests never run, as a safety net beside the
    // break-the-code checks. Counts every source file, tested or not.
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "scripts/**/*.ts"],
      reporter: ["text", "html"],
      // Every line, function and branch (D20; branches raised to 100 in 1.12).
      thresholds: { statements: 100, lines: 100, functions: 100, branches: 100 },
    },
  },
});
