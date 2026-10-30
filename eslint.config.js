// ESLint flat config. TypeScript is pinned to 6.0 so typescript-eslint works (D18).
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
    },
  },
];
