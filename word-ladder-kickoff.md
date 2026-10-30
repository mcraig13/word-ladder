# Word Ladder — Project Kickoff

> Kept for the original reasoning. Current rules are in `CLAUDE.md`, decisions in `DECISIONS.md`, and the working backlog in `backlog.md`. Where this file disagrees with them, they win.

## 1. Product brief

**Goal:** A game where the player gets from a start word to a target word by changing one letter per turn. Every intermediate step must be a real word.

Example: `COLD → CORD → CARD → WARD → WARM`

**Core rules (proposed defaults — confirm or change)**
- Start and target words are the same length (default: 4 letters).
- Each move changes exactly one letter, in place. No adding, removing or reordering letters.
- Every word in the chain must be in the game dictionary.
- The game is won when the player reaches the target word.
- Every puzzle offered to the player must be solvable.

**Out of scope for v1:** accounts, multiplayer, leaderboards, monetisation.

## 2. Open decisions

| # | Decision | Options | Why it matters |
|---|----------|---------|----------------|
| D1 | Platform | **Leaning: web app first** (soft launch via a shareable link; mobile-friendly; installable as a PWA later) | Shapes Phase 3 onwards; Phases 0–2 are platform-neutral |
| D2 | Language & stack | _[TBD]_ — candidate: TypeScript + Vite, Vitest for tests, static hosting (no backend needed for v1) | Sets tooling in Phase 0 |
| D3 | Dictionary source | Open word list / curated list | Licensing, and avoiding obscure or offensive words |
| D4 | Word lengths | Fixed 4 / 3–6 selectable | Affects puzzle generation and difficulty |
| D5 | Game mode | Daily puzzle / endless / both | Affects generation, seeding and persistence |

Keep the core logic independent of D1 and D2 choices where possible, so these can be decided late.

## 3. AI SDLC working agreement

Every chunk follows the same loop:

1. **Spec** — Human writes (or approves an AI draft of) a short spec: intent, inputs/outputs, acceptance criteria, edge cases.
2. **Tests first** — AI generates tests from the acceptance criteria, each named after the rule it protects. Human reviews that tests match intent *before* any implementation, and rejects tautological tests (see "Testing" in `CLAUDE.md`). The check: would this test fail if the rule were broken?
3. **Implement** — AI implements until tests pass. Small diffs, one chunk per branch/PR.
4. **Review** — Human reviews the diff: correctness, readability, no scope creep. AI can do a first-pass self-review against the spec.
5. **Merge & record** — Update the backlog status and note any decisions in `DECISIONS.md`.

**Guardrails**
- A chunk should fit in one sitting (roughly ≤ 200 lines changed). If it doesn't, split it.
- Core game logic is pure functions with no UI or I/O, so it's easy to test and for AI to reason about.
- Keep a `CLAUDE.md` (or equivalent context file) in the repo with: project purpose, rules above, stack, conventions, how to run tests. Update it as decisions land.
- CI runs lint + tests on every PR; nothing merges red.
- Humans own: product rules, dictionary choice, final review. AI owns: first drafts of specs, tests, code and docs.

**Definition of done (per chunk)**
- Acceptance criteria covered by passing tests
- Reviewed by a human
- CI green
- Backlog and context file updated if anything changed

## 4. Backlog — small, buildable chunks

> First cut, kept for reference. The working backlog is `backlog.md`.

### Phase 0 — Foundations
| ID | Chunk | Acceptance criteria | Depends on |
|----|-------|---------------------|-----------|
| 0.1 | Repo scaffold | Project builds; test runner runs a passing placeholder test | D2 |
| 0.2 | CI pipeline | Lint + tests run on every PR | 0.1 |
| 0.3 | Context file | `CLAUDE.md` with purpose, rules, stack, commands | 0.1 |

### Phase 1 — Core game logic (pure functions)
| ID | Chunk | Acceptance criteria | Depends on |
|----|-------|---------------------|-----------|
| 1.1 | Load dictionary | Loads word list; normalises case; filters by length; rejects non-alphabetic entries | 0.1, D3 |
| 1.2 | `isValidWord(word)` | True for dictionary words, false otherwise; case-insensitive | 1.1 |
| 1.3 | `isOneLetterApart(a, b)` | True only when same length and exactly one position differs; false for identical words | 0.1 |
| 1.4 | `validateMove(current, next)` | Returns OK or a specific reason: wrong length / not one change / not a word / repeated word | 1.2, 1.3 |
| 1.5 | Game state | Holds start, target, chain of moves; applies valid moves; rejects invalid ones; reports `isWon` | 1.4 |
| 1.6 | Solver (BFS) | Returns a shortest path between two words, or none if unreachable | 1.2, 1.3 |

### Phase 2 — Puzzles
| ID | Chunk | Acceptance criteria | Depends on |
|----|-------|---------------------|-----------|
| 2.1 | Puzzle generator | Produces start/target pairs with a solution of a given length; never returns an unsolvable pair | 1.6 |
| 2.2 | Difficulty | Easy/medium/hard mapped to shortest-path length ranges | 2.1 |
| 2.3 | Seeded daily puzzle | Same date → same puzzle for every player | 2.1, D5 |

### Phase 3 — First playable version
| ID | Chunk | Acceptance criteria | Depends on |
|----|-------|---------------------|-----------|
| 3.1 | Minimal UI | Shows start, target, chain; accepts a word; shows the error reason for invalid moves | 1.5, D1 |
| 3.2 | Win screen | Shows move count vs. optimal ("par") on win | 3.1, 1.6 |
| 3.3 | New game | Starts a fresh generated puzzle | 3.1, 2.1 |

### Phase 4 — Game feel
| ID | Chunk | Acceptance criteria | Depends on |
|----|-------|---------------------|-----------|
| 4.1 | Undo | Removes last move; can't undo past the start word | 3.1 |
| 4.2 | Hint | Reveals the next word on a shortest path from the current word | 1.6, 3.1 |
| 4.3 | Give up | Shows a full optimal solution | 1.6, 3.1 |
| 4.4 | Share result | Copyable, spoiler-free result summary | 3.2 |

### Phase 5 — Persistence & stats
| ID | Chunk | Acceptance criteria | Depends on |
|----|-------|---------------------|-----------|
| 5.1 | Save in-progress game | Reload resumes the current game | 3.1 |
| 5.2 | Stats | Games played, wins, streak, average moves vs par | 5.1 |

## 5. Worked example: spec for chunk 1.3

**Intent:** Decide whether two words differ by exactly one letter in the same position.

**Signature:** `isOneLetterApart(a: string, b: string) -> bool`

**Acceptance criteria**
- `("cold", "cord")` → true
- `("cold", "cold")` → false (no change)
- `("cold", "card")` → false (two changes)
- `("cold", "colds")` → false (different length)
- `("Cold", "cord")` → true (case-insensitive)
- `("", "")` → false

**Not in scope:** checking the dictionary (that's 1.2) — this function is purely about letters.

Use this as the template for every chunk spec.

## 6. Suggested first session

1. Settle D1–D3 (or explicitly defer D1).
2. Do 0.1–0.3.
3. Do 1.3 using the worked example above — it needs no dictionary, so it's the quickest end-to-end run of the spec → tests → code → review loop.
