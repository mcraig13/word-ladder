# CLAUDE.md — Word Golf

Context for AI-assisted development. Read this before starting any task. Keep it up to date as decisions land.

## What we're building

Word Golf, a web-based word ladder game. The repository and its URL keep the name `word-ladder` (D35). The player gets from a start word to a target word by changing one letter per turn, and every step must be a real word.

Example: `COLD → CORD → CARD → WARD → WARM`

Soft launch as a static web app shared by link. No backend for v1.

## Game rules (source of truth)

Reasons for each rule are in `DECISIONS.md`.

**The puzzle**
- One daily puzzle, the same for everyone on a given date. "Today" is the player's local date (D5, D6).
- Puzzle #1 is the launch date; the number goes up by one each day (D15).
- Start and target words are 4 letters. Word length is a parameter in the code, not a hard-coded 4 (D4).
- Start and target are chosen from the **puzzle words** list; moves are checked against the **accepted words** list. Both lists come from the largest 4-letter Word Cloud, so every puzzle is solvable (D8).

**Moves**
- Each move changes exactly one letter, in the same position. No adding, removing or reordering letters.
- Every word in the chain must be an accepted word.
- A word already in the current chain is rejected (D13).
- A rejected attempt is not a move: the player sees the reason and tries again (D13).
- Comparisons are case-insensitive; words are stored and compared in lowercase.
- Undo removes the last word and cannot go past the start word. Each undo adds one to the score. An undone word is no longer in the chain, so it can be played again (D26).

**Ending and scoring**
- The game is won when the chain reaches the target word.
- Giving up ends the game as a loss, with no score (D11).
- **Par** is a typical result: 1.5 × the moves in a shortest path, rounded up. The shortest path is computed over the accepted words. `COLD → CORD → CARD → WARD → WARM` is a shortest path of 4 moves, so par is 6. Par is shown from the start (D9, D27).
- **Score** is moves in the final chain, plus undos, minus par. It can be below par: 0 is shown as "par", otherwise "−1", "+1" and so on. The best possible score is the shortest path minus par (D9, D26, D27).
- When the game ends (won or given up), show one shortest path; on a win, show it beside the player's chain (D9, D11).
- Hints (after launch) don't change the score; they're counted and shown as 💡 in the share (D10).

If a task seems to need a rule change, stop and ask. Don't change rules inside a code task.

## Stack

- TypeScript 6.0 (strict mode). Pinned below 6.1 until typescript-eslint supports TypeScript 7 (D18)
- ESLint with typescript-eslint (`strictTypeChecked` and `stylisticTypeChecked` rules), plus rules that keep `src/core/` pure (D21)
- Prettier for code and config formatting; Markdown is formatted by hand (D21)
- Vite for dev server and build
- Vitest for tests
- Static hosting; no server, no database in v1
- React for the UI (D7), set up in 3.0. UI tests use React Testing Library in jsdom, with a few in Vitest browser mode for layout (D33)

## Project layout

```
src/
  core/        # Pure game logic. No DOM, no I/O, no randomness without an injected seed.
  puzzles/     # Puzzle generation, par range, daily seeding and numbering
  ui/          # Rendering and input handling (Phase 3+)
data/
  source/      # Original SCOWL Hunspell files (D17). Never edit by hand.
  words/       # Built word lists (accepted, puzzle), exclusion list, blocklist, SCOWL licence
  puzzles/     # Built puzzle schedule: line N is puzzle #N (D24)
scripts/       # Build-time scripts, e.g. building word lists from a source dictionary
tests/         # Mirrors src/ structure
DECISIONS.md   # Short log of decisions and why
backlog.md     # Chunks still to do; finished ones are in backlog-done.md
```

## Commands

- `npm run dev` — start local dev server
- `npm test` — run tests once. The browser tests need Chromium, installed once with `npx playwright install chromium`
- `npm run test:watch` — run tests on change
- `npm run test:coverage` — run tests once with coverage; fails below the thresholds in `vite.config.ts` (D20). Report in `coverage/index.html`
- `npm run build` — type-check, then production build to `dist/`
- `npm run lint` — type-check, ESLint, then Prettier check; fails on any error, warning or unformatted file
- `npm run format` — format code and config with Prettier
- `npm run build:words` — build `data/words/accepted.txt` and `puzzle.txt` from the SCOWL sources, exclusion list and blocklist. Commit the rebuilt lists; a test fails if they don't match a fresh build
- `npm run build:schedule` — build `data/puzzles/schedule.txt` from the built word lists, about 15 s. Commit the rebuilt schedule

CI (`.github/workflows/ci.yml`) runs lint, tests with coverage and build, then rebuilds the word lists and fails if they differ from the committed ones, on every pull request and push to `main`. A pull request can only merge when CI is green.

## How we work

Every chunk follows this loop, recorded in `sdlc/<chunk id>-<short name>/` (templates in `sdlc/README.md`):

1. **Intent** — write `intent.md`: what and why, rules protected, acceptance criteria as test names, what you're least sure of, out of scope. The PR description repeats the least-sure list, updated after review (D28).
2. **Plan and tests** — write `plan.md` (approach, files, each test with the rule it protects) and the tests. Stop once and show intent, plan and tests for human review before implementing (D23). This ends the first session (D29).
3. **Implement** — in a new session, make the tests pass with the smallest change that does it.
4. **Self-check** — three lines in `plan.md`, each quoting command output rather than a judgement: the files changed (`git diff --name-only main...HEAD`) against the plan's list, the lint and coverage results, and one line on whether the diff does what the intent says. The author runs no breaks (D29, D31).
5. **Independent review** — for every chunk, run a reviewer agent with a fresh context, using the brief in `sdlc/README.md`; two in parallel for an M chunk. It sees only the intent, plan, diff and this file, never the author's reasoning, and runs the breaks with `npm run break`, saving them as `breaks.json` in the chunk folder. Its findings go in `review.md`.
6. **Respond** — answer every finding in `review.md`: fixed (with the test or change), or not changed and why. A test changed after human review is always called out. If a fix changes production logic, or is meant to make a break go red, re-run the reviewer's breaks (`npm run break -- sdlc/<chunk>/breaks.json`) and add the result to `review.md` (D31).
7. **Human review and merge** — via a pull request that links `review.md`. Its last commit moves the chunk's entry to `backlog-done.md` and updates the milestone row, so no separate backlog PR is needed (D31). CI must be green.

**Sessions and context (D29):** at each handoff point in `sdlc/README.md`, tell the human it's a good point for a new session and give a ready-to-paste prompt for it (template in `sdlc/README.md`). Read only the parts of `backlog.md` and `DECISIONS.md` the chunk needs, keep records within the size limits in `sdlc/README.md`, and send research to a subagent.

Process changes (this file, `sdlc/README.md`) go in their own branch and pull request, never inside a code chunk. They can be made whenever they help: the 3.0 review lifted D23's freeze (D31).

Chunks still to do, with their IDs, live in `backlog.md`; finished ones move to `backlog-done.md`. A review finding left for a later chunk goes on that chunk's backlog entry as a *Carried forward* line, so the next session finds it there. Decisions and their reasons live in `DECISIONS.md`.

## Conventions

- Core logic is pure functions: same input, same output. Pass dependencies (dictionary, random seed, current date) in as arguments.
- Functions that can fail in expected ways return a result object with a specific reason (e.g. `{ ok: false, reason: "not-a-word" }`) rather than throwing.
- Name things after the game's words: `chain`, `move`, `start`, `target`, `par` (the typical number of moves, D27), `shortest path`.
- One chunk per branch/PR. Closely related S chunks may be done as one chunk (as 1.7 and 1.8 could have been) when the code stays within the size limit.
- Keep production changes in `src/` and `scripts/` under ~200 lines. Tests, `sdlc/` records, docs and `package-lock.json` don't count, but give the test lines in the PR description. If a chunk is bigger, propose a split (D31).
- No magic numbers: every constant gets a name, or a comment saying where it comes from. Existing code is cleaned up in 7.1 (D31).
- No new dependencies without saying why in the PR description.
- Every exported function has tests covering its acceptance criteria and edge cases (empty strings, different lengths, mixed case). See Testing below.

## Naming

Readable beats short. A name should make sense on first read to someone who doesn't know the codebase, and read like a sentence where it's used: `dictionary.containsWord(nextWord)`, `areWordsOneLetterApart(firstWord, secondWord)`.

- `create…` builds something new from what's passed in: `createDictionaryFromWords`, `createGame`.
- `get…` looks up or works out a value: `getWordsOfLength`, `getPar`.
- `find…` searches and may find nothing: `findShortestPath`.
- `check…` returns a result with a reason: `checkMove`.
- `is…` / `are…` / `contains…` answer yes or no.
- Plain verbs for actions that change game state: `applyMove`, `undoLastMove`, `giveUp`.
- No abbreviations or single-letter names, including parameters and loop variables (`word`, not `w`).
- If a name needs explaining in review, rename it.

Lint enforces the mechanical parts: no single-letter names, `camelCase` for functions and variables, `PascalCase` for types, and yes/no values in `src/` starting with `is`, `are`, `has`, `contains`, `can` or `should`. Whether a name reads well is checked in review.

## Testing: meaningful, not tautological

Every test must check a game rule or a behaviour a player would notice. A test earns its place only if it would fail when that rule is broken.

**Each test must:**
- Be named after the rule it protects, in plain language: `rejects a move that changes two letters`, not `checkMove test 3`.
- Use expected values worked out by hand from the rules, written as literals. `COLD → CARD` is invalid because two letters change, so the test says `false`.
- Test through the public function's inputs and outputs, not its internals.
- Use small, purpose-built fixture dictionaries (a handful of words) so the reason for each result is visible in the test itself.
- When a function takes two inputs of the same kind (accepted and puzzle words, start and target), make them differ in the fixture, so a test fails if the code uses one in place of the other (D31).

**Structure every test as Arrange / Act / Assert (AAA):**
- **Arrange** — set up the inputs and any fixture dictionary, with values that make the rule obvious.
- **Act** — call the function under test exactly once.
- **Assert** — check the outcome that the rule predicts.
- Mark each section with a `// Arrange`, `// Act`, `// Assert` comment and separate them with a blank line.
- One behaviour per test. If you need a second Act, write a second test.
- Keep Arrange inside the test where possible, so a reader sees the whole story without scrolling. Use shared helpers only for setup that is noise, and name them for what they create.

```ts
it("rejects a move that changes two letters", () => {
  // Arrange
  const currentWord = "cold";
  const nextWord = "card";

  // Act
  const result = areWordsOneLetterApart(currentWord, nextWord);

  // Assert
  expect(result).toBe(false);
});
```

**Not allowed (tautological tests):**
- Computing the expected value with the same logic, or a copy of it, as the code under test.
- Mocking the unit under test, or asserting only that a mock was called.
- Asserting that a function returns what it was just given, or that a constructor sets the fields it was passed.
- Snapshot tests of logic output.
- Tests of TypeScript, Vitest or library behaviour rather than our rules.
- Tests with no assertion, or that only assert "does not throw" where a real outcome exists.

**Encouraged:**
- Edge cases that come from the rules: identical words, different lengths, mixed case, repeated words, unreachable targets.
- Invariant (property) checks where they express a rule, e.g. every step of a solver's path is one letter apart and in the dictionary, and the path starts at `start` and ends at `target`. Adding a property-testing library needs a one-line justification in the PR.

**Review check for every test:** "If I broke the rule this test is named after, would it fail?" If the answer is no, or unclear, rewrite or delete it. When presenting tests for review (step 2 of the loop), list each test with the rule it protects.

## Don'ts

- Don't touch files outside the current chunk's scope.
- Don't add a backend, accounts or analytics.
- Don't weaken or delete a test to make it pass. If a test looks wrong, say so.
- Don't invent dictionary words or puzzle data; use the files in `data/words/`.
- Don't edit the built word lists by hand. Change the sources, exclusion list or blocklist and rebuild.
- Don't add, remove or reword the SCOWL licence notice. It's a condition of using the word lists.

## Open decisions

See `DECISIONS.md` for detail.
- Whether to add a server after the one-week trial (D32)
