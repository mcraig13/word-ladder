# Word Ladder — Backlog

Ticket-sized chunks for AI-assisted delivery. Each chunk follows the loop in `CLAUDE.md`: spec → tests (reviewed) → implement → review → merge. Rules and their reasons are in `CLAUDE.md` and `DECISIONS.md`.

**Sizing:** S = under an hour of review-and-merge work, M = one sitting. Anything bigger gets split.
**Acceptance criteria** are written as test names. Each one protects a rule and must be written AAA-style.

## Milestones

| Milestone | Chunks | Outcome | Status |
|-----------|--------|---------|--------|
| M0 Walking skeleton | 0.1–0.3, 0.5 | Empty app deployed to a live URL with CI | Done |
| M1 Rules engine | 1.1–1.10, 1.12, 1.13 | All game rules enforced and tested; solver and scoring work | Done |
| Word lists | 6.1a, 6.1b, 6.2, 6.3 | Built accepted and puzzle lists in `data/words/` | 6.1a, 6.1b done; 6.2, 6.3 next (human-owned) |
| M2 Daily puzzle | 2.1–2.6 | A solvable, numbered puzzle for any date | 2.1, 2.2, 2.5 done; 2.6a next |
| **M3 Soft launch** | 3.0–3.9, 1.11 | Friends can play today's puzzle from a link | Not started |
| M4 After launch | 4.1–4.3 | Share, hints, stats | Not started |
| M5 Later | 5.1 | Practice mode | Not started |
| Tech debt | 7.1 | Clean-ups with no change in behaviour | Not started |

Update the Status column when a chunk merges, and move its entry to `backlog-done.md`.

Critical path to soft launch: 1.13 → 1.10 → 6.1a → 6.1b → 2.1, 2.5 → 2.2 → 2.6a → 2.4, 2.6b → 2.3 → 3.0 → 1.11 → 3.1–3.9. While 2.x is under way, the human-owned work (6.2, 6.3, D16) runs alongside; 6.2 and 6.3 block only 3.8 launch checks, not the UI work. M4 order follows feedback; pull 4.1 Share forward if friends start screenshotting results.

---

## Phase 0 — Walking skeleton

Done: 0.1–0.3, 0.5. Finished chunks are in `backlog-done.md` (D29).

---

## Phase 1 — Rules engine (pure functions in `src/core/`)

Done: 1.1–1.10, 1.12, 1.13. Finished chunks are in `backlog-done.md` (D29).

**1.11 Load word lists (S)** · Depends: 1.2, 6.1b, 3.0 · *part of M3*
Load the built accepted and puzzle word lists into dictionaries at app start. This is app wiring, not core logic: D21's lint bans `fetch` in `src/core/`, so it lives in `src/puzzles/` (or beside the UI, per 3.0). Done after 3.0, just before 3.1. It works with empty exclusion and block lists, so it doesn't wait for 6.2 and 6.3. The ID is kept so references stay valid.
- loads accepted words and puzzle words as separate dictionaries
- every puzzle word is also an accepted word

*Carried forward:* `data/words/accepted.txt` and `puzzle.txt` are one lowercase word per line, LF, a newline at the end, no comments or blank lines, in alphabetical order (6.1b intent, choice 5).

*Carried forward:* also load the puzzle schedule that 2.6a builds; 2.4 looks up a date's puzzle in it (D24).

---

## Phase 2 — Daily puzzle (`src/puzzles/`)

Done: 2.1, 2.2, 2.5. Finished chunks are in `backlog-done.md` (D29).

**2.3 Daily par range (S)** · Depends: 2.6b, **D16**
Regenerate the schedule with the agreed range; before launch, the whole schedule can be rebuilt (D24).
- every scheduled puzzle's shortest path is within the agreed range (par follows from it, D27)

**2.4 Puzzle for a date (S)** · Depends: 2.5, 2.6a
Given a date, the launch date and the schedule, find that date's start and target (D24). The app passes in the player's local date; nothing reads the clock. Loading the schedule file at app start goes with 1.11.
- the launch date gets the first puzzle in the schedule
- the same date gets the same puzzle
- consecutive dates get the puzzles on consecutive lines
- a date after the schedule ends has no puzzle
- an invalid date, or a date before launch, has no puzzle, with the reason from `getPuzzleNumber`

**2.6a Build the puzzle schedule (M)** · Depends: 2.2, 6.1b · in progress, `sdlc/2.6a-build-schedule/`
`extendSchedule`, `getScheduleText` and `npm run build:schedule`, which writes `data/puzzles/schedule.txt` (format in the intent). Repeat window D30.

**2.6b Extend and check the schedule (M)** · Depends: 2.6a
Read `data/puzzles/schedule.txt` back, make `build:schedule` extend it rather than rebuild from #1 (D24), and add the build checks.
- every scheduled start and target is a puzzle word
- every scheduled puzzle is solvable with the current accepted words
- extending the schedule adds dates up to the requested length ahead
- the check fails when fewer than 60 days of schedule remain
- the check fails when a list change alters the shortest path of a published date

*Carried forward:* `npm run build:schedule` took 63 s for 365 puzzles in 2.6a (each date runs `generatePuzzle` and a `findShortestPath`). `generatePuzzle`'s cut-off at the most moves is still untested, since dropping it costs time, not correctness; a check on the build's time would cover it (2.2 review B1).

*Carried forward:* `createSeededRandom` doesn't check its seed (2.1 review 1). Dates no longer seed anything: `extendSchedule` seeds puzzle #N with `(scheduleSeed + N) >>> 0`, always in range. What's left is that `scheduleSeed` itself isn't checked: `0` and `0.5` build the same schedule, and `-1` is accepted (2.6a review A6).

*Carried forward:* when reading the file back, lowercase each line or reject one that isn't lowercase, and test mixed case: `extendSchedule` compares the existing schedule's words as given, so a capitalised hand edit (D24) would slip past the repeat window (2.6a reviews A2, B4).

*Carried forward:* check that a hand edit to a published date doesn't bring back a start or target within D30's window (2.6a intent, least sure 3; review A1).

*Carried forward:* no test ties a seed to a particular puzzle, so a change to the per-puzzle seed in `extendSchedule` would reshuffle every date and only a rebuild would show it. The published-dates check should compare start and target as well as moves (2.6a review B3).

---

## Phase 3 — Soft launch (`src/ui/`)

UI tests check what the player sees and can do, not component internals.

**3.0 UI framework and UI testing (S)** · Depends: 2.4, 2.5, 1.10
Decide D7 (UI framework) and how UI code is tested, and review D20 (coverage gate) and D23 (break checks) for UI code; log the decisions in `DECISIONS.md`. Set up the framework and one example test against the "coming soon" page. No game UI yet.
- an example UI test finds the page heading the way a player would see it
- `npm run lint`, `npm run test:coverage` and `npm run build` pass with the framework added

*Carried forward to the process review:* CI doesn't run `npm run build:words`, so a broken build script shows only when someone rebuilds; a CI step running it and then `git diff --exit-code data/words` would catch that and stale lists together. And when a review fix is meant to make a break go red, or changes production logic, nobody re-runs those breaks (D29: the author runs none); consider a short breaks-only re-review of the fix commit (6.1b PR discussion). Also consider a "no magic numbers" line in `CLAUDE.md` Conventions: every constant gets a name or a comment saying where it comes from (2.1 PR discussion; the existing code is 7.1).

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

*Carried forward:* the saved game must keep its undo count (1.13), or a reload would clear the undos from the score (D26). As with the chain, `Game`'s type checks only code, not JSON read from storage, so restore must also reject a saved count that isn't a whole number of 0 or more, with a test (1.13 intent choice 4).

*Carried forward:* don't restore par from storage: take it from `createGame` for today's puzzle, so a saved par can't disagree with the words (1.10 intent choice 5).

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

*Carried forward:* this runs `generatePuzzle` in the browser, which 2.2 assumed it wouldn't (D24). At 180–370 ms a call on a PC, and slower on a phone (1.9 review 5), it may need a faster neighbour lookup or a worker (2.2 review A3).

---

## Phase 6 — Word lists (build-time, `scripts/`)

Runs at build time to produce the files in `data/words/` from the SCOWL sources in `data/source/scowl/` (D17). Not shipped as app code, but tested like it.

`npm run build:words` reads both Hunspell dictionaries and writes `accepted.txt` and `puzzle.txt`. Takes the exclusion list and blocklist as input files (they can start empty). Split in two because Hunspell suffix rules (strip, add, condition) are a chunk on their own. Tests use tiny hand-written `.dic`/`.aff` fixtures, not the real dictionaries.

Done: 6.1a, 6.1b. Finished chunks are in `backlog-done.md` (D29).

**6.2 Review exclusion list (S)** · Depends: 6.1b · *human-owned*
The script lists candidate abbreviations (no vowels, or in SCOWL but missing from a common-words cross-check). A human confirms each one before it goes into `data/words/exclude.txt`.
*Carried forward:* the format is one word per line, any case, with blank lines and `#` comments allowed; a line that isn't a word stops the build. Each form is matched exactly, so list `govts` as well as `govt` if both should go. The same format serves 6.3's blocklist (6.1a intent, choice 8). Prefixes on abbreviation entries make more abbreviations that Hunspell also accepts: in en_GB-large, `conc, conj, dept, intr, proa, pron, recd, rees, reis, revs, unis, univ`, and in en_GB-ise also `incs, prob`. Review these as candidates (6.1a plan, Self-review). The 6.1b lists also have vowel-less abbreviations such as `bdrm, bldg, blvd, ftps, mfrs, rcpt, shpt, shtg`, and others with vowels such as `asst, corp, dept, govt`; `psst`, `cwms` and `pwns` are vowel-less but may be real words. Abbreviations can bridge parts of the cloud and shorten shortest paths, so par ranges measured before this review (D16, 2.3) may shift after it (6.1b PR discussion).
- every excluded word has been reviewed and is listed alphabetically

**6.3 Offensive-words blocklist (S)** · Depends: 6.1b · *human-owned*
Choose a blocklist source with a compatible licence, log it in `DECISIONS.md`, and add it as `data/words/blocklist.txt`.
- no blocklisted word appears in either built list
- no SCOWL taboo-flagged word appears in either built list

---

## Phase 7 — Tech debt

Clean-ups that change no behaviour. Pick them up between chunks; each one still follows the loop in `CLAUDE.md`.

**7.1 Explain magic numbers (S)** · Depends: 2.1
No unexplained numbers in the code: each constant gets a name or a one-line comment saying where it comes from and what it does. Start with `createSeededRandom` (2.1): mulberry32's increment `0x6d2b79f5`, the shifts `15`, `7` and `14`, the multipliers `| 1` and `| 61`, and `2 ** 32`. Link the published mulberry32 so the code can still be checked against it line by line, which is how the 2.1 review confirmed the pinned sequence. Then go through `src/` and `scripts/` for others.
- seed 2026 picks the same sequence it always has (2.1's existing test, unchanged: the constants must not change)
- all existing tests pass unchanged

## Decisions needed before their chunks

| ID | Decision | Blocks |
|----|----------|--------|
| D7 | UI framework | 3.0 |
| D16 | Daily par range, in moves of the shortest path (suggest 4–6, so par 6–9); decide once 6.1b gives real data | 2.3 |
