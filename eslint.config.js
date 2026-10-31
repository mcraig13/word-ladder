// ESLint flat config. TypeScript is pinned to 6.0 so typescript-eslint works (D18).
// Naming rules back up the Naming section of CLAUDE.md; whether a name reads
// well is still checked in review.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist/", "coverage/", "node_modules/", "data/"] },
  js.configs.recommended,
  // Type-aware rules, e.g. promises nobody waits for, conditions that are
  // always true (D21). Plain JavaScript files have no types to check.
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  { files: ["**/*.js", "**/*.mjs"], ...tseslint.configs.disableTypeChecked },
  {
    rules: {
      eqeqeq: ["error", "always"],
      "prefer-const": "error",
      // No single-letter names: `word`, not `w`.
      "id-length": ["error", { min: 2, properties: "never" }],
    },
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        // camelCase for functions, variables, parameters and properties.
        { selector: "default", format: ["camelCase"], leadingUnderscore: "forbid" },
        // Module-level constants may be UPPER_CASE, e.g. LETTERS_ONLY.
        {
          selector: "variable",
          modifiers: ["const", "global"],
          format: ["camelCase", "UPPER_CASE"],
        },
        // PascalCase for types, interfaces and classes, e.g. Dictionary.
        { selector: "typeLike", format: ["PascalCase"] },
      ],
    },
  },
  {
    // Yes/no values in game code start with a question word. Tests are
    // exempt so they can keep the AAA convention of `const result = ...`.
    files: ["src/**/*.ts"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "default", format: ["camelCase"], leadingUnderscore: "forbid" },
        {
          selector: "variable",
          modifiers: ["const", "global"],
          format: ["camelCase", "UPPER_CASE"],
        },
        { selector: "typeLike", format: ["PascalCase"] },
        {
          selector: ["variable", "parameter"],
          types: ["boolean"],
          format: ["PascalCase"],
          prefix: ["is", "are", "has", "contains", "can", "should"],
        },
      ],
    },
  },
  {
    // Core logic is pure: no DOM, no I/O, no clock, no unseeded randomness.
    // Dependencies are passed in as arguments (CLAUDE.md, Conventions; D21).
    files: ["src/core/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        ...["window", "document", "navigator", "localStorage", "sessionStorage", "indexedDB"].map(
          (name) => ({ name, message: "No DOM or storage in src/core." }),
        ),
        ...["fetch", "XMLHttpRequest", "setTimeout", "setInterval"].map((name) => ({
          name,
          message: "No I/O or timers in src/core.",
        })),
        { name: "Date", message: "Pass the date in; the core never reads the clock (D6)." },
        { name: "performance", message: "The core never reads the clock (D6)." },
        { name: "crypto", message: "Pass a seed in; no unseeded randomness in src/core." },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "Pass a seed in; no unseeded randomness in src/core.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["node:*"], message: "No Node modules in src/core." },
            {
              group: ["**/ui/**", "**/puzzles/**"],
              message: "src/core doesn't depend on ui or puzzles.",
            },
          ],
        },
      ],
    },
  },
];
