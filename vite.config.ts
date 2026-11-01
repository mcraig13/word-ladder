import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Browser-mode tests, which run in real Chromium rather than jsdom (D33).
const browserTests = "tests/**/*.browser.test.{ts,tsx}";

export default defineConfig({
  // Relative asset paths, so the built site works from any folder,
  // including GitHub Pages at /word-ladder/ (chunk 0.5).
  base: "./",
  // Fast refresh in `npm run dev` (3.0 intent, least sure 2).
  plugins: [react()],
  test: {
    // Disjoint file patterns, so each test runs in exactly one project.
    projects: [
      {
        extends: true,
        test: { name: "node", include: ["tests/**/*.test.ts"], exclude: ["tests/ui/**"] },
      },
      {
        extends: true,
        test: {
          name: "ui",
          include: ["tests/ui/**/*.test.{ts,tsx}"],
          exclude: [browserTests],
          environment: "jsdom",
          setupFiles: ["tests/ui/setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: [browserTests],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
    // Lines and branches the tests never run, as a safety net beside the
    // break-the-code checks. Counts every source file, tested or not.
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}", "scripts/**/*.ts"],
      // The entry file only runs in the browser test, not the coverage run (D33).
      exclude: ["src/main.tsx"],
      reporter: ["text", "html"],
      // Every line, function and branch (D20; branches raised to 100 in 1.12).
      thresholds: { statements: 100, lines: 100, functions: 100, branches: 100 },
    },
  },
});
