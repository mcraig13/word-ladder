# 3.0 review

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

The setup is small and clean. App, main.tsx, the three test projects and the coverage exclude do what the intent says, and the changed files match the plan. Lint, `test:coverage` (328 passed, 100%) and `build` passed. The rules-of-hooks lint works in `.tsx`. The UI tests are AAA, use literals, find elements by role and name, and have one Act each. Every acceptance criterion has a test.

## Findings
1. **should fix** The browser test never reads the real `index.html`, so renaming the `#app` root or pointing the script at a missing file leaves every test green (intent, least sure 1). Fix without a second harness: import `index.html?raw`, parse it, copy its body into the page and import the module script's `src`. — *Response:* fixed. **Test changed after human review:** "shows the heading once the entry file mounts the app" now arranges from the parsed `index.html` instead of building its own root, and imports the entry file named by its script tag. The renamed-root and missing-script breaks are now red.
2. **should fix** No test checks the tab title, though the intent's signature and D35 say it becomes "Word Golf". — *Response:* fixed. **New test after human review:** "shows the game's name in the browser tab" (browser project) checks the parsed `index.html`'s title. The old-title break is now red.
3. **should fix** The rules-of-hooks lint covers only `**/*.tsx`, so a custom hook in `src/ui/useBad.ts` with a conditional `useState` passed lint. — *Response:* fixed: the block now covers `src/ui/**/*.ts` too; the same scratch hook is now reported by `react-hooks/rules-of-hooks`.
4. **nit** The node project excludes only `tests/ui/**`, so a `*.browser.test.ts` elsewhere runs in node and Chromium, and a `.test.tsx` outside `tests/ui/` runs in no project. — *Response:* fixed: node excludes browser tests; the config comment says UI tests live in `tests/ui/`.

Also: Prettier reflowed one line of the human-reviewed browser test in the implement commit (formatting only), and formatted `breaks.json`.

**Re-run of `breaks.json` after fixes:** 17 breaks, 0 not applied, 16 red. Still green: "main: missing-root guard deleted" (see Notes; no action).

**Notes:**
- Deleting main.tsx's missing-root guard stays green, because `createRoot(null)` throws anyway. The guard only gives a clearer message, and main.tsx is excluded from coverage by design (D33). No action.
- The PascalCase naming allowance is limited to `function` declarations in `.tsx`; `Helper_Thing` is still rejected.
- With node_modules as a junction in a scratch copy, coverage printed "Failed to fetch … @vitest/coverage-v8/browser" but tests passed; in the repo the run is clean.
- The new dependencies match the plan's list; `react` and `react-dom` are the only runtime dependencies.

## Reviewer's own break-the-code checks
Saved as `breaks.json` (17 breaks; first run: 0 not applied, 4 all green).
- Heading: old name, demoted to h2, changed to a div, removed, `hidden` → red: "shows the game's name as the page heading" and "shows the heading once the entry file mounts the app"
- Coming-soon message: removed, reworded, `hidden` → red: "tells the player the game is coming soon"
- main.tsx: wrong root id, renders `{null}`, never calls render → red: "shows the heading once the entry file mounts the app"
- Test setup: no `cleanup` → red: "tells the player the game is coming soon"; UI project without jsdom → red: both App tests
- index.html root renamed to `root` → **all green** (finding 1)
- index.html script pointed at `/src/main.ts` → **all green** (finding 1)
- index.html `<title>` back to "Word Ladder" → **all green** (finding 2)
- main.tsx missing-root guard deleted → **all green** (Notes)
- Lint, outside the break runner: a conditional hook in `src/ui/useBad.ts` → no lint error (finding 3)
