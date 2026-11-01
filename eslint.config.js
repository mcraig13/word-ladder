// ESLint flat config. TypeScript is pinned to 6.0 so typescript-eslint works (D18).
// Naming rules back up the Naming section of CLAUDE.md; whether a name reads
// well is still checked in review.
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const namingRules = [
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
];
// Yes/no values start with a question word, e.g. isWon.
const booleanNamingRule = {
  selector: ["variable", "parameter"],
  types: ["boolean"],
  format: ["PascalCase"],
  prefix: ["is", "are", "has", "contains", "can", "should"],
};
// React components are PascalCase functions, e.g. App (3.0 intent, least sure 3).
const componentNamingRule = { selector: "function", format: ["camelCase", "PascalCase"] };

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
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: { "@typescript-eslint/naming-convention": ["error", ...namingRules] },
  },
  {
    // Yes/no values in game code and build scripts start with a question word.
    // Tests are exempt so they can keep the AAA convention of `const result = ...`.
    files: ["src/**/*.ts", "src/**/*.tsx", "scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/naming-convention": ["error", ...namingRules, booleanNamingRule],
    },
  },
  { files: ["**/*.tsx"], ...reactHooks.configs.flat.recommended },
  {
    files: ["tests/**/*.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": ["error", ...namingRules, componentNamingRule],
    },
  },
  {
    files: ["src/**/*.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        ...namingRules,
        booleanNamingRule,
        componentNamingRule,
      ],
    },
  },
  {
    // Core logic is pure: no DOM, no I/O, no clock, no unseeded randomness.
    // Dependencies are passed in as arguments (CLAUDE.md, Conventions; D21).
    // The word-list parser is pure too; only the build script around it reads
    // files (6.1a intent, choice 1).
    files: ["src/core/**/*.ts", "scripts/words/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        ...["window", "document", "navigator", "localStorage", "sessionStorage", "indexedDB"].map(
          (name) => ({ name, message: "No DOM or storage in pure code." }),
        ),
        ...["fetch", "XMLHttpRequest", "setTimeout", "setInterval"].map((name) => ({
          name,
          message: "No I/O or timers in pure code.",
        })),
        { name: "Date", message: "Pass the date in; pure code never reads the clock (D6)." },
        { name: "performance", message: "Pure code never reads the clock (D6)." },
        { name: "crypto", message: "Pass a seed in; no unseeded randomness in pure code." },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "Pass a seed in; no unseeded randomness in pure code.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["node:*"], message: "No Node modules in pure code." },
            {
              group: ["**/ui/**", "**/puzzles/**"],
              message: "Pure code doesn't depend on ui or puzzles.",
            },
          ],
        },
      ],
    },
  },
];
