# 3.0 UI framework and UI testing

**Intent:** set up React (D7) and the two kinds of UI test (D33), so 3.1–3.9 start from a working pattern: jsdom tests that find what the player sees by role and name, and a real-browser test for what jsdom can't show. The static "coming soon" page becomes the first component, mounted from the entry file, and shows the game's new name, Word Golf (D35). No game UI yet.
**Signature:** `App()` in `src/ui/App.tsx`, a React component rendering the page: the heading "Word Golf" and "Coming soon.". The tab title in `index.html` becomes "Word Golf". `src/main.tsx` (was `main.ts`) mounts `App` into `#app` in `index.html`.

## Rules protected
No game rules change. The chunk protects how UI is built and tested:
- The UI is React with the rules-of-hooks lint (D7)
- UI tests find elements by role and name, the way a player sees the page, not by component internals (D33, backlog Phase 3)
- Most UI tests run in jsdom; a few run in a real browser (D33)
- Coverage stays 100%; only the entry file is excluded, and only the browser test runs it (D33, D20)
- The page shows the game's name, Word Golf, and that it's coming soon (backlog 3.0, D35)

## Acceptance criteria
- shows the game's name as the page heading (jsdom; backlog: "an example UI test finds the page heading the way a player would see it")
- tells the player the game is coming soon (jsdom)
- shows the heading once the entry file mounts the app (browser mode)
- `npm run lint`, `npm run test:coverage` and `npm run build` pass with the framework added (checked by CI, not a test)

## What I'm least sure of
- **The browser test makes its own `#app` root instead of loading `index.html`.** Vitest browser mode runs tests in its own page, so the test adds the root, then imports `main.tsx`. A break that renames the root in `index.html`, or drops its script tag, stays green; `npm run build` only checks the script path resolves. Loading the built `dist/` in Playwright would close the gap but adds a second browser harness for one check. I'd change my mind if you want the real page tested now rather than at 3.8's launch checks.
- **Two dependencies beyond what D7 and D33 name.** `@testing-library/jest-dom` gives readable assertions (`toBeVisible`, and later `toHaveTextContent` for 3.2's announcements); without it, tests assert on raw DOM properties. `@vitejs/plugin-react` gives fast refresh in `npm run dev`; the build would work without it. Either can be dropped if you'd rather keep the list to what the decisions name.
- **Naming lint loosened for components.** typescript-eslint's naming rule requires camelCase functions, but React components must be PascalCase. The plan allows PascalCase for functions in `.tsx` files only, so a `.tsx` helper could be PascalCase by mistake; review catches that. Narrower options (a regex for component names) are more config for the same effect.

**Also:** CI installs Chromium for the browser test (about 30 s per run), and `npm run break` runs every project, so each break launches Chromium too.

## Out of scope
- Any game UI: puzzle, chain, input (3.1–3.9)
- Loading word lists (1.11)
- Testing in browsers other than Chromium, and layout at phone width (3.6, 3.8; D32 lists the browsers)
- `eslint-plugin-react` and `jsx-a11y` rules; D7 names only the hooks plugin
- Renaming the repository, its URL and the docs to Word Golf (D35)
