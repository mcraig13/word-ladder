# Word Ladder — Backlog

Ticket-sized chunks for AI-assisted delivery. Each chunk follows the loop in `CLAUDE.md`: spec → tests (reviewed) → implement → review → merge. Rules and their reasons are in `CLAUDE.md` and `DECISIONS.md`.

**Sizing:** S = under an hour of review-and-merge work, M = one sitting. Anything bigger gets split.
**Acceptance criteria** are written as test names. Each one protects a rule and must be written AAA-style.

## Milestones

| Milestone | Chunks | Outcome | Status |
|-----------|--------|---------|--------|
| M0 Walking skeleton | 0.1–0.3, 0.5 | Empty app deployed to a live URL with CI | Done |
| M1 Rules engine | 1.1–1.10, 1.12, 1.13 | All game rules enforced and tested; solver and scoring work | 1.13, 1.10 left |
| Word lists | 6.1a, 6.1b, 6.2, 6.3 | Built accepted and puzzle lists in `data/words/` | Not started |
| M2 Daily puzzle | 2.1–2.5 | A solvable, numbered puzzle for any date | Not started; 2.2 blocked by D24 |
| **M3 Soft launch** | 3.0–3.9, 1.11 | Friends can play today's puzzle from a link | Not started |
| M4 After launch | 4.1–4.3 | Share, hints, stats | Not started |
| M5 Later | 5.1 | Practice mode | Not started |

Update the Status column when a chunk merges.

Critical path to soft launch: 1.13 → 1.10 → 6.1a → 6.1b → 2.1, 2.5 → 2.2 → 2.4 → 2.3 → 3.0 → 1.11 → 3.1–3.9. While 2.x is under way, the human-owned work (6.2, 6.3, D16, D24) runs alongside; 6.2 and 6.3 block only 3.8 launch checks, not the UI work. M4 order follows feedback; pull 4.1 Share forward if friends start screenshotting results.

---

## Phase 0 — Walking skeleton

**0.1 Scaffold (S)** · Depends: none
Vite + TypeScript (strict) + Vitest. Folders per `CLAUDE.md`.
- `npm test` runs and passes
- `npm run build` produces a static bundle
Out of scope: UI framework, styling.

**0.2 Lint and type-check (S)** · Depends: 0.1
- `npm run lint` fails on a type error
- `npm run lint` fails on a lint rule violation

**0.3 CI (S)** · Depends: 0.2
- A PR with a failing test cannot merge
- A PR with a lint error cannot merge

**0.5 Deploy (S)** · Depends: 0.3
GitHub Pages, auto-deploy on merge to main. The page just says "Word Ladder — coming soon". Live at https://mcraig13.github.io/word-ladder/
- Merging to main updates the live URL
- The live page loads its script and styles (no broken asset paths)

---

## Phase 1 — Rules engine (pure functions in `src/core/`)

**1.1 `normaliseWord` (S)** · Depends: 0.1
- lowercases a word
- trims surrounding whitespace
- rejects a word containing non-letters
- rejects an empty string

**1.2 `createDictionaryFromWords` (S)** · Depends: 1.1
Builds a lookup from a word list, with `containsWord` and `getWordsOfLength`. No file I/O here. (0.4's planned `dictionaryOf` helper was dropped: tests call `createDictionaryFromWords` directly.)
- recognises a word that is in the list
- does not recognise a word that is not in the list
- recognises a word regardless of case
- ignores entries that are not valid words
- lists only words of a requested length
- lists each word once even when the list repeats it
- lists words in alphabetical order whatever order they were given in

**1.3 `areWordsOneLetterApart` (S)** · Depends: 0.1
- accepts words that differ in exactly one position
- rejects identical words
- rejects words that differ in two positions
- rejects words of different lengths
- ignores case when comparing
- rejects empty strings

**1.4 `getWordsOneLetterAway` (S)** · Depends: 1.2, 1.3
All dictionary words one letter away from a given word.
- returns every dictionary word one letter away
- excludes the word itself
- excludes words that are not in the dictionary
- returns nothing for a word with no words one letter away

**1.5 `checkMove` (M)** · Depends: 1.2, 1.3
Given the current chain and a proposed next word, return OK or a specific reason.
- accepts a valid one-letter change to an accepted word
- rejects a word of a different length with reason `wrong-length`
- rejects a change of more than one letter with reason `not-one-change`
- rejects an unchanged word with reason `not-one-change`
- rejects a word not in the dictionary with reason `not-a-word`
- rejects a word already in the chain with reason `repeated-word`
- reports `wrong-length` before other reasons (precedence: length → change → word → repeat)

**1.6 Game state: `createGame`, `applyMove`, game status (M)** · Depends: 1.5
- a new game's chain contains only the start word
- applying a valid move extends the chain
- an invalid move leaves the chain unchanged and returns the reason
- an invalid move does not count as a move
- the game is won when the chain reaches the target
- the game is still in progress before the target is reached
- no moves are accepted after the game is won
- rejects creating a game where start and target differ in length

**1.7 `undoLastMove` (S)** · Depends: 1.6
- removes the last word from the chain
- cannot undo past the start word
- an undone word can be played again
- undo is not available after the game has ended

**1.8 `giveUp` (S)** · Depends: 1.6
- giving up ends the game as a loss
- no moves are accepted after giving up
- cannot give up a game that is already won

**1.9 Solver: `findShortestPath` (M)** · Depends: 1.4
Breadth-first search.
- finds a path whose length is the fewest moves between two words
- every step of the path is one letter apart and in the dictionary
- path starts at the start word and ends at the target
- returns no path when the target is unreachable
- returns a single-word path when start equals target

*Done in 1.9:* reuses `getWordsOneLetterAway`; speed is re-checked on the real list in 6.1b (1.9 intent choice 3).

**1.10 `getPar` and `getScore` (S)** · Depends: 1.9, 1.6, 1.13
- par is 1.5 × the moves in a shortest path (`cold → cord → card → ward → warm` is 4 moves, so par 6) (D27)
- par rounds up when the shortest path is odd (5 moves gives par 8)
- a win in par moves scores 0
- a win in two moves over par scores +2
- a win along a shortest path scores below par (4 moves on par 6 scores −2)
- each undo adds one to the score (D26)
- a game that was given up has no score
- a game in progress has no score

**1.11 Load word lists (S)** · Depends: 1.2, 6.1b, 3.0 · *part of M3*
Load the built accepted and puzzle word lists into dictionaries at app start. This is app wiring, not core logic: D21's lint bans `fetch` in `src/core/`, so it lives in `src/puzzles/` (or beside the UI, per 3.0). Done after 3.0, just before 3.1. It works with empty exclusion and block lists, so it doesn't wait for 6.2 and 6.3. The ID is kept so references stay valid.
- loads accepted words and puzzle words as separate dictionaries
- every puzzle word is also an accepted word

**1.12 Non-empty chain (S)** · Depends: 1.8
Type `Game.chain` so an empty chain can't be built, and drop `checkMove`'s `?? ""` fallback (1.5 review 5, 1.6 review 6). Types only; behaviour unchanged.
- every existing test passes with its values and assertions unchanged
- type-check fails if code builds a chain without a start word
- branch coverage is 100%

**1.13 Count undos (S)** · Depends: 1.8
The game records how many undos the player has used, so `getScore` can add them (D26). Undo itself works as before.
- a new game has used no undos
- each undo adds one to the undo count
- a move does not change the undo count
- the undo count is kept when the game is won or given up

---

## Phase 2 — Daily puzzle (`src/puzzles/`)

**2.1 Seeded random (S)** · Depends: 0.1
- the same seed produces the same sequence
- different seeds produce different sequences

**2.2 `generatePuzzle` (M)** · Depends: 1.9, 2.1, 6.1b, **D24**
Given accepted words, puzzle words, a range of shortest-path lengths and a seed. How puzzles are tied to a date, and whether they're generated in the browser or into a schedule at build time, depends on D24.
*Design note:* don't call `findShortestPath` once per candidate target. It takes about 200 ms on a PC and maybe 0.6–1 s on a phone (1.9 review 5). One breadth-first search from the start word gives the distance to every word, so every target with a shortest path in range comes from a single search.
- start and target are both puzzle words
- the puzzle's shortest path is inside the requested range
- every generated puzzle is solvable
- the same seed produces the same puzzle
- reports failure when no puzzle fits the range

**2.3 Daily par range (S)** · Depends: 2.2, **D16**
- the daily puzzle's shortest path is within the agreed range (par follows from it, D27)

**2.4 Puzzle for a date (S)** · Depends: 2.2
The app passes in the player's local date; the core never reads the clock.
- the same date produces the same puzzle
- consecutive dates produce different puzzles

**2.5 Puzzle number (S)** · Depends: 0.1
- the launch date is puzzle #1
- the day after launch is puzzle #2
- the number counts calendar days across month and year boundaries
- dates before launch have no puzzle number

---

## Phase 3 — Soft launch (`src/ui/`)

UI tests check what the player sees and can do, not component internals.

**3.0 UI framework and UI testing (S)** · Depends: 2.4, 2.5, 1.10
Decide D7 (UI framework) and how UI code is tested, and review D20 (coverage gate) and D23 (break checks) for UI code; log the decisions in `DECISIONS.md`. Set up the framework and one example test against the "coming soon" page. No game UI yet.
- an example UI test finds the page heading the way a player would see it
- `npm run lint`, `npm run test:coverage` and `npm run build` pass with the framework added

**3.1 Show today's puzzle (M)** · Depends: 3.0, 1.11
- shows the puzzle number
- shows the start word, target word and par
- shows the chain so far

**3.2 Enter a move (M)** · Depends: 3.1, 1.6
- a valid word is added to the chain
- an invalid word shows a message that explains the reason
- an invalid word does not change the move count
- the input clears after a valid move
- the reason for a rejected word is announced to screen readers

*Carried forward:* clean up input such as `İ` and zero-width spaces here; `checkMove` reports them as `wrong-length` (1.5 review 6).

**3.3 Undo button (S)** · Depends: 3.2, 1.7
- undo removes the last word from the chain shown
- undo is unavailable when only the start word is shown

*Carried forward:* undo now adds one to the score (D26), so the player should be able to see that before pressing it.

**3.4 Give up (S)** · Depends: 3.2, 1.8, 1.9
- giving up asks for confirmation first
- after giving up, a shortest path is shown
- after giving up, no more moves can be entered

**3.5 Win screen (S)** · Depends: 3.2, 1.10
- reaching the target shows a win message
- shows the score as "par", "−N" or "+N"
- shows the player's chain beside a shortest path

**3.6 Mobile layout (S)** · Depends: 3.2
- playable at phone width without horizontal scrolling
- the on-screen keyboard does not hide the input

**3.7 How to play (S)** · Depends: 3.1
- first-time players see the rules with a worked example
- the rules can be reopened later
- credits SCOWL as the word list source (licence condition, D17)

*Carried forward:* the rules say each undo adds one to the score (D26).

**3.8 Launch checks (S)** · Depends: 3.1–3.7, 3.9, 6.2, 6.3
- a full game can be played on a phone browser, from link to win
- tomorrow's date shows a different puzzle with the next number
Set the launch date (puzzle #1) here. Don't change it once results are shared (D15).

**3.9 Resume today's game (S)** · Depends: 3.2 · *moved from 4.3 (D25)*
Browser storage only; no backend.
- reloading the page restores today's chain
- a new day starts a fresh game
- the game still works when storage is unavailable
- a saved chain that is empty or doesn't start with the start word is not restored

*Carried forward:* restoring a saved game must reject a saved chain that is empty or doesn't start with the start word. `Chain` (1.12) checks only code, not JSON read from storage, so the restore code must check it at runtime, with a test. Without that check, an empty chain now makes `checkMove` throw rather than return a reason (1.6 review 6, 1.12 review 2). Once that test exists, D20's branch threshold note no longer applies.

*Carried forward:* the saved game must keep its undo count (1.13), or a reload would clear the undos from the score (D26).

---

## Phase 4 — After launch (order by feedback)

**4.1 Share result (S)** · Depends: 3.5, 3.4
- a win shares the puzzle number and score, with no words (spoiler-free)
- a give-up shares the puzzle number and "didn't finish"
- copies the summary to the clipboard

**4.2 Hints (M)** · Depends: 1.9, 3.2, 4.1
- a hint reveals the next word on a shortest path from the current word
- a hint is still valid after the player strays from the original solution
- using a hint does not change the score
- the share shows 💡 for each hint used

**4.3 Stats and streaks (M)** · Depends: 3.9
Browser storage only; no backend. Resuming today's game moved to 3.9 (D25).
- records games played and won
- giving up counts as a loss
- a win on consecutive days extends the streak
- a missed day or a give-up resets the streak

---

## Phase 5 — Later

**5.1 Practice mode (M)** · Depends: 2.2
- starts a fresh generated puzzle on demand
- practice games don't affect daily stats or streaks

---

## Phase 6 — Word lists (build-time, `scripts/`)

Runs at build time to produce the files in `data/words/` from the SCOWL sources in `data/source/scowl/` (D17). Not shipped as app code, but tested like it.

`scripts/build-words` reads both Hunspell dictionaries and writes `accepted-4.txt` and `puzzle-4.txt`. Takes the exclusion list and blocklist as input files (they can start empty). Split in two because Hunspell suffix rules (strip, add, condition) are a chunk on their own. Tests use tiny hand-written `.dic`/`.aff` fixtures, not the real dictionaries.

**6.1a Read Hunspell dictionaries (M)** · Depends: 0.1
Turn one `.dic`/`.aff` pair into a filtered list of lowercase words.
- expands words with their Hunspell endings (`cold/S` gives `colds`)
- does not add possessive forms (`cold's`)
- drops words that only appear capitalised (`Bach`, `Avon`)
- keeps a word that has both a capitalised and a lowercase entry (`polish`)
- drops entries containing non-letters
- drops Roman numerals (`xiii`, `clix`) but keeps real words made of the same letters (`mild`, `mill`, `dill`)
- drops words on the exclusion list
- drops words SCOWL flags as taboo and words on the blocklist

**6.1b Build the word list files (M)** · Depends: 6.1a, 1.4
- accepted words are the largest 4-letter Word Cloud of the size-70 list
- puzzle words are size-60 words that are also accepted words
- every pair of puzzle words is connected through accepted words
- the same inputs always produce the same output files

*Carried forward:* time `findShortestPath` on the built accepted list (worst case: a target it can't reach) and record it. On a synthetic list, 1.9 measured about 310 ms for 4,096 words on a PC, so about 200 ms for 3,300 words (1.9 review 5). If it's too slow for 2.2, or for loading a game on a phone (less likely with a schedule, D24), speed up `getWordsOneLetterAway` behind its 1.4 tests (1.9 intent choice 3).

**6.2 Review exclusion list (S)** · Depends: 6.1b · *human-owned*
The script lists candidate abbreviations (no vowels, or in SCOWL but missing from a common-words cross-check). A human confirms each one before it goes into `data/words/exclude.txt`.
- every excluded word has been reviewed and is listed alphabetically

**6.3 Offensive-words blocklist (S)** · Depends: 6.1b · *human-owned*
Choose a blocklist source with a compatible licence, log it in `DECISIONS.md`, and add it as `data/words/blocklist.txt`.
- no blocklisted word appears in either built list
- no SCOWL taboo-flagged word appears in either built list

## Decisions needed before their chunks

| ID | Decision | Blocks |
|----|----------|--------|
| D7 | UI framework | 3.0 |
| D16 | Daily par range, in moves of the shortest path (suggest 4–6, so par 6–9); decide once 6.1b gives real data | 2.3 |
| D24 | Keeping past and future puzzles fixed when a word list changes | 2.2 |
