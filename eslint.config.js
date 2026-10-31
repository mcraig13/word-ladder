// ESLint flat config. TypeScript is pinned to 6.0 so typescript-eslint works (D18).
// Naming rules back up the Naming section of CLAUDE.md; whether a name reads
// well is still checked in review.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist/", "coverage/", "node_modules/", "data/"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
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
        { selector: "variable", modifiers: ["const", "global"], format: ["camelCase", "UPPER_CASE"] },
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
        { selector: "variable", modifiers: ["const", "global"], format: ["camelCase", "UPPER_CASE"] },
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
];
