# Word Ladder — Finished chunks

Backlog entries for chunks that have merged, moved here from `backlog.md` (D29) so a session reads only the chunks still to do. Each chunk's `sdlc/` folder (from 1.4 on) has the detail.

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
- the same seed picks the same sequence
- seeds one apart pick different sequences
- seed 2026 picks the same sequence it always has
- picks every item in a short list and nothing else
- picking from an empty list finds nothing

**2.2 `generatePuzzle` (M)** · Depends: 1.9, 2.1, 6.1b
- start and target are both puzzle words
- never picks a puzzle word that isn't an accepted word
- never picks a target closer than the fewest moves
- never picks a target farther than the most moves
- measures a target by its shortest path when a longer route also reaches it
- every generated puzzle is solvable
- never picks the start as its own target, even when the range starts at 0 moves
- tries another start when the first one picked has no target in range
- the same seed produces the same puzzle
- picks words of the requested length
- reports failure when no puzzle fits the range
- reports failure when there are no puzzle words of the requested length
- a puzzle from the real word lists has a shortest path in the requested range

**2.5 Puzzle number (S)** · Depends: 0.1
- the launch date is puzzle #1
- the day after launch is puzzle #2
- counts across a month boundary
- counts across a year boundary
- counts February 29 in a leap year
- goes straight from February 28 to March 1 in a year that isn't a leap year
- counts a leap year as 366 days
- counts whole days across a change to summer time
- the day before launch has no puzzle number
- rejects February 29 in a year that isn't a leap year
- rejects month 13
- rejects a day that isn't a whole number
- rejects an invalid launch date
- reports an invalid date before launch as invalid, not before launch
- rejects an invalid date that is the same as the launch date

**2.6a Build the puzzle schedule (M)** · Depends: 2.2, 6.1b · repeat window D30
- builds one puzzle for each number up to the last puzzle number
- every scheduled puzzle's shortest path is within the requested range
- records each puzzle's shortest path moves
- measures each puzzle's shortest path over the accepted words, not the puzzle words
- builds puzzles of the requested word length
- keeps every existing puzzle unchanged when extending
- adds puzzles after the existing ones up to the last puzzle number
- leaves a schedule that already reaches the last puzzle number as it is
- the same seed builds the same schedule
- extending gives the same puzzles as building the whole schedule at once
- a schedule seed one higher doesn't put the same puzzles on neighbouring dates
- gives different puzzle numbers different puzzles
- never uses a start or target word again within the repeat window
- counts the existing schedule's last puzzles in the repeat window
- uses a word again once the repeat window has passed
- reports the puzzle number that has no puzzle in range
- reports the puzzle number that has no puzzle partway through a run
- writes one line per puzzle, in order, as start, target and moves
- writes an empty file for an empty schedule

**2.4 Puzzle for a date (S)** · Depends: 2.5, 2.6a
- the launch date gets the first puzzle in the schedule
- the day after launch gets the puzzle on the second line
- the last scheduled date gets the last puzzle in the schedule
- the day after the schedule ends has no puzzle
- an empty schedule has no puzzle on the launch date
- a date before launch has no puzzle, with the reason from getPuzzleNumber
- an invalid date has no puzzle, with the reason from getPuzzleNumber
- a date before launch has no puzzle even when the schedule is empty
- an invalid launch date has no puzzle, even on the launch date itself

---

## Phase 6 — Word lists (build-time, `scripts/`)

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
