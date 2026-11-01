# Word Golf — Backlog

Ticket-sized chunks for AI-assisted delivery. Each chunk follows the loop in `CLAUDE.md`: spec → tests (reviewed) → implement → review → merge. Rules and their reasons are in `CLAUDE.md` and `DECISIONS.md`.

**Sizing:** S = under an hour of review-and-merge work, M = one sitting. Anything bigger gets split.
**Acceptance criteria** are written as test names. Each one protects a rule and must be written AAA-style.

## Milestones

| Milestone | Chunks | Outcome | Status |
|-----------|--------|---------|--------|
| M0 Walking skeleton | 0.1–0.3, 0.5 | Empty app deployed to a live URL with CI | Done |
| M1 Rules engine | 1.1–1.10, 1.12, 1.13 | All game rules enforced and tested; solver and scoring work | Done |
| Word lists | 6.1a, 6.1b, 6.2, 6.3 | Built accepted and puzzle lists in `data/words/` | 6.1a, 6.1b done; 6.2, 6.3 next (human-owned) |
| M2 Daily puzzle | 2.1–2.6c | A solvable, numbered puzzle for any date | Done |
| **M3 Soft launch** | 3.0–3.9, 1.11 | Friends can play today's puzzle from a link | 3.0, 1.11, 3.1, 3.2 done; 3.3 next |
| M4 After launch | 4.1–4.3 | Share, hints, stats | Not started |
| M5 Later | 5.1 | Practice mode | Not started |
| Tech debt | 7.1 | Clean-ups with no change in behaviour | Not started |

Update the Status column when a chunk merges, and move its entry to `backlog-done.md`.

Critical path to soft launch: 1.13 → 1.10 → 6.1a → 6.1b → 2.1, 2.5 → 2.2 → 2.6a → 2.4, 2.6b → 2.3, 2.6c → 3.0 → 1.11 → 3.1–3.9. The human-owned 6.2 and 6.3 run now, alongside 3.0–3.2, so the schedule is rebuilt once, well before 3.8 (D31 review); they block only 3.8 launch checks, not the UI work. M4 order follows feedback; pull 4.1 Share forward if friends start screenshotting results.

---

## Phase 0 — Walking skeleton

Done: 0.1–0.3, 0.5. Finished chunks are in `backlog-done.md` (D29).

---

## Phase 1 — Rules engine (pure functions in `src/core/`)

Done: 1.1–1.13. Finished chunks are in `backlog-done.md` (D29).

---

## Phase 2 — Daily puzzle (`src/puzzles/`)

Done: 2.1–2.6c. Finished chunks are in `backlog-done.md` (D29).

---

## Phase 3 — Soft launch (`src/ui/`)

UI tests check what the player sees and can do, not component internals.

**3.3 Undo button (S)** · Depends: 3.2, 1.7
- undo removes the last word from the chain shown
- undo is unavailable when only the start word is shown
- undo shows that it adds one to the score, before it's pressed (D26)

The button reads "Undo (+1)", in a row with Give up between the chain and the keyboard (D36).

**3.4 Give up (S)** · Depends: 3.2, 1.8, 1.9
- giving up asks for confirmation first
- after giving up, a shortest path is shown
- after giving up, no more moves can be entered

The Give up button sits beside Undo (+1), between the chain and the keyboard (D36).

**3.5 Win screen (S)** · Depends: 3.2, 1.10
- reaching the target shows a win message
- shows the score as "par", "−N" or "+N"
- shows the player's chain beside a shortest path

*Carried forward:* after a win, a word that isn't letters (`c0rd`) gets "Use letters only." rather than "The game is over.", because the letters check runs first. If the input stays after a win, check `game.status` first (3.2 review, note 4).

**3.6a Look and tiles (S)** · Depends: 3.2 · *split from 3.6 Mobile layout (D36)*
The centred column, letter tiles and Clubhouse colours in D36. Layout tests run in Vitest browser mode (D33).
- each word in the chain is shown as a row of letter tiles
- the letter that changed from the word before is marked
- the target is shown in the header and as a row below the chain
- playable at phone width without horizontal scrolling
- the header and the input row stay in view when the chain is longer than the screen
- a rejection reason shows under the input row until a letter is changed
- rejected tiles don't shake when the player prefers reduced motion
- colours follow the device's light or dark setting
- text and tile colours meet WCAG AA contrast in light and dark

*Carried forward:* an empty submission after a rejection leaves the old reason showing; decide whether it clears, and test it (3.2 review, note 2). The same rejection twice in a row sets the same status text, so a screen reader may not announce it again; clearing the reason when a letter changes mostly fixes this (3.2 review, note 3).

**3.6b On-screen keyboard (M)** · Depends: 3.6a · *split from 3.6 Mobile layout (D36)*
Keys and tiles type into the real "Next word" input from 3.2; the phone's own keyboard stays closed (D36).
- tapping a tile and then a letter key changes that letter in the next word
- the on-screen Play key plays the word, and nothing plays before it's pressed
- Backspace puts back the last word's letter on the selected tile
- only the changed tile flips when a move is played, and nothing flips when the player prefers reduced motion
- a hardware keyboard can still type and play a word
- the phone's own keyboard does not open
- a screen reader user can still enter a move through the labelled input

**3.7 How to play (S)** · Depends: 3.1
- first-time players see the rules with a worked example
- the rules can be reopened later
- credits SCOWL as the word list source (licence condition, D17)

*Carried forward:* the rules say each undo adds one to the score (D26).

*Carried forward:* the worked example shows a move as tapping a tile, then a letter, then Play (D36).

**3.8 Launch checks (S)** · Depends: 3.1–3.7 (including 3.6a and 3.6b), 3.9, 6.2, 6.3, 2.6c
- a full game can be played on a phone browser, from link to win
- tomorrow's date shows a different puzzle with the next number
- the link shows the game's name and a one-line description when shared
Set the launch date (puzzle #1) here. Don't change it once results are shared (D15). The soft launch is a one-week trial on evergreen browsers from the last two years (D32).

*Carried forward:* when `build:schedule` works today's puzzle number out from the date, a bad value (`NaN`, negative, a fraction) makes `getExtendedScheduleText` add nothing and still succeed; check it, or rely on 2.6c's 60-days check (2.6b review G4). 2.6c's check catches `NaN`, since it fails unless at least 60 puzzles remain; a negative number or a fraction still passes it.

*Carried forward:* `npm run build:schedule` took about 65 s for 365 puzzles in 2.6a, about 15 s since 2.6c sped up `getWordsOneLetterAway`. `generatePuzzle`'s cut-off at the most moves is still untested, since dropping it costs time, not correctness; a check on the build's time would cover it (2.2 review B1, moved from 2.6c).

*Carried forward:* no test shows `build:schedule` refuses fewer than 60 puzzles ahead: its `fewestPuzzlesAhead` can be set to 0 with every test green, because the script always extends 365 ahead before checking. Once today's number comes from the date, test the script with a today that leaves too few (2.6c review, breaks finding 3).

**3.9 Resume today's game (S)** · Depends: 3.2 · *moved from 4.3 (D25)*
Browser storage only; no backend.
- reloading the page restores today's chain
- a new day starts a fresh game
- the game still works when storage is unavailable
- a saved chain that is empty or doesn't start with the start word is not restored
- a page left open into a new day shows the new puzzle

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

**6.2 Review exclusion list (S)** · Depends: 6.1b · *human-owned* · now, alongside 3.0–3.2
The script lists candidate abbreviations (no vowels, or in SCOWL but missing from a common-words cross-check). A human confirms each one before it goes into `data/words/exclude.txt`.
*Carried forward:* the format is one word per line, any case, with blank lines and `#` comments allowed; a line that isn't a word stops the build. Each form is matched exactly, so list `govts` as well as `govt` if both should go. The same format serves 6.3's blocklist (6.1a intent, choice 8). Prefixes on abbreviation entries make more abbreviations that Hunspell also accepts: in en_GB-large, `conc, conj, dept, intr, proa, pron, recd, rees, reis, revs, unis, univ`, and in en_GB-ise also `incs, prob`. Review these as candidates (6.1a plan, Self-review). The 6.1b lists also have vowel-less abbreviations such as `bdrm, bldg, blvd, ftps, mfrs, rcpt, shpt, shtg`, and others with vowels such as `asst, corp, dept, govt`; `psst`, `cwms` and `pwns` are vowel-less but may be real words. Abbreviations can bridge parts of the cloud and shorten shortest paths, so par ranges measured before this review (D16, 2.3) may shift after it (6.1b PR discussion).
- every excluded word has been reviewed and is listed alphabetically

**6.3 Offensive-words blocklist (S)** · Depends: 6.1b · *human-owned* · now, alongside 3.0–3.2
Build `data/words/blocklist.txt` from dsojevic/profanity-list, reviewed by hand, with its MIT notice in `data/words` (D34). Mild words stay playable; add the plurals and slurs the list misses.
- no blocklisted word appears in either built list
- no SCOWL taboo-flagged word appears in either built list

---

## Phase 7 — Tech debt

Clean-ups that change no behaviour. Pick them up between chunks; each one still follows the loop in `CLAUDE.md`.

**7.1 Explain magic numbers (S)** · Depends: 2.1
No unexplained numbers in the code: each constant gets a name or a one-line comment saying where it comes from and what it does. Start with `createSeededRandom` (2.1): mulberry32's increment `0x6d2b79f5`, the shifts `15`, `7` and `14`, the multipliers `| 1` and `| 61`, and `2 ** 32`. Link the published mulberry32 so the code can still be checked against it line by line, which is how the 2.1 review confirmed the pinned sequence. Then go through `src/` and `scripts/` for others.
- seed 2026 picks the same sequence it always has (2.1's existing test, unchanged: the constants must not change)
- all existing tests pass unchanged

*Carried forward:* `scripts/buildSchedule.mjs`, `tests/puzzles/checkSchedule.scowl.test.ts` and `generatePuzzle.scowl.test.ts` split the list files and build dictionaries themselves; consider one shared reader such as `createGameDataFromText` (1.11 review 1).

## Decisions needed before their chunks

| ID | Decision | Blocks |
|----|----------|--------|
| — | Server after the one-week trial (D32) | after soft launch |
