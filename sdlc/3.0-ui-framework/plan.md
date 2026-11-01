# 3.0 plan

## Approach
Add React and turn `index.html`'s static content into `App`. `index.html` keeps the `<main id="app">` root, now empty, and loads `src/main.tsx`, which finds `#app`, throws if it's missing (the page can't work without it; excluded from coverage), and renders `<StrictMode><App /></StrictMode>` with `createRoot`.

Vitest gets three projects in `vite.config.ts`, with disjoint file patterns so each test runs once:
- **node:** `tests/**/*.test.ts`, except `tests/ui/**`. The existing tests, unchanged.
- **ui:** `tests/ui/**/*.test.{ts,tsx}`, except `*.browser.test.*`; jsdom, with a setup file that registers jest-dom's matchers and runs RTL's `cleanup` after each test (Vitest globals are off, so RTL can't register it itself).
- **browser:** `tests/**/*.browser.test.{ts,tsx}`; Vitest browser mode, Playwright provider, headless Chromium.

Coverage: include `src/**/*.{ts,tsx}` and `scripts/**/*.ts`, exclude `src/main.tsx`; thresholds stay 100%.

Lint: `eslint-plugin-react-hooks` recommended flat config on `**/*.tsx`; the naming rule allows PascalCase functions in `.tsx` (intent, least sure 3). TypeScript: `"jsx": "react-jsx"`, and the browser-mode types for `expect.element` and `page`.

## Dependencies (each with its reason in the PR)
`react`, `react-dom` (D7; the only runtime `dependencies`). Dev: `@types/react`, `@types/react-dom`; `@vitejs/plugin-react` (fast refresh, intent least sure 2); `eslint-plugin-react-hooks` (D7); `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `jsdom` (D33); `@vitest/browser-playwright`, `playwright` (D33). Versions checked on 2026-11-01: React 19.3, plugin-react 6.1 (peer `vite ^8`), react-hooks 7.1 (peer includes eslint 10), RTL 16.3, jest-dom 7.0, jsdom 30.1, `@vitest/browser-playwright` 5.0.5 (peer `vitest 5.0.5`), Playwright 1.64. Check jest-dom 7's Vitest entry point (`/vitest` in 6.x) when installing.

## Files
- `src/ui/App.tsx` — new: the heading and "Coming soon."
- `src/main.ts` → `src/main.tsx` — mounts `App` into `#app`
- `index.html` — `#app` emptied; script points at `main.tsx`; `<title>` is "Word Golf" (D35)
- `vite.config.ts` — React plugin, three test projects, coverage include and exclude
- `eslint.config.js` — react-hooks rules, PascalCase functions in `.tsx`
- `tsconfig.json` — `jsx`, browser-mode types
- `package.json`, `package-lock.json` — dependencies above
- `.github/workflows/ci.yml` — install Chromium (`npx playwright install --with-deps chromium`) before the tests
- `tests/ui/setup.ts` — jest-dom matchers, cleanup after each test
- `tests/ui/App.test.tsx`, `tests/ui/main.browser.test.ts` — the tests below
- `DECISIONS.md` — D35, the name (done in session A)
- `CLAUDE.md` — the `npm test` line notes it needs Chromium installed once (`npx playwright install chromium`)

## Tests
| Test | Rule |
|---|---|
| shows the game's name as the page heading | D33: found by role and name, as a player sees it; D35: Word Golf |
| tells the player the game is coming soon | backlog 3.0: the coming-soon page becomes a component |
| shows the heading once the entry file mounts the app | D33: the app mounts from its entry file in a real browser |
| shows the game's name in the browser tab | D35: the tab title is Word Golf (added in review, finding 2) |

## Self-check
- Files (`git diff --name-only main...HEAD`): .github/workflows/ci.yml CLAUDE.md DECISIONS.md eslint.config.js index.html package-lock.json package.json sdlc/3.0-ui-framework/intent.md plan.md src/main.ts src/main.tsx src/ui/App.tsx tests/ui/App.test.tsx tests/ui/main.browser.test.ts tests/ui/setup.ts tsconfig.json vite.config.ts — match the plan
- Lint, tests and coverage: "All matched files use Prettier code style!"; "Tests 328 passed (328)"; "Statements 100% (402/402), Branches 100% (235/235), Functions 100% (64/64), Lines 100% (389/389)"
- Diff against intent: App renders "Word Golf" and "Coming soon.", main.tsx mounts it into `#app`, and tests run in node, jsdom and Chromium projects; no game UI added
