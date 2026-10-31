# Decisions

Short log of what we decided and why. Newest decisions are added at the bottom. To change a decision, add a new entry that supersedes the old one rather than editing it.

Status: **Decided**, **Open**, or **Superseded by Dn**.

---

## D1 — Platform: web app first
**Decided** · 2026-10-30
Soft launch as a static web app shared by link. Friends already play web games, there's no app store review, and it can become an installable PWA later.

## D2 — Stack: TypeScript, Vite, Vitest, static hosting
**Decided** · 2026-10-30
Typed pure functions are easy to test and review in an AI-assisted loop. No backend in v1: the dictionary ships with the page and the daily puzzle is computed in the browser.

## D3 — Dictionary source
**Superseded by D17** · was blocking 6.1
Reference list: `english3.txt` (194,433 entries, lowercase, British). Its origin and licence are unknown, so it can't ship as-is. SCOWL (British variant) is being evaluated as a source with a known licence. Whatever we pick needs a licence that allows bundling in a public app.

## D4 — Word length: 4 letters
**Decided** · 2026-10-30
Classic word ladder, and 4-letter words form the densest clouds. Word length stays a parameter in the code so 5–7 can be added later.

## D5 — Game mode: daily only
**Decided** · 2026-10-30
One shared puzzle per day. Comparing results with friends is what spreads a soft launch. Practice/endless mode is deferred until after launch.

## D6 — "Today" is the player's local date
**Decided** · 2026-10-30
A new puzzle appears at each player's own midnight, as in Wordle. Every date maps to one puzzle, the same for everyone. The app passes the local date into the core; the core never reads the clock itself. Accepted risk: a player in a later timezone may see tomorrow's puzzle first.

## D7 — UI framework
**Open** · decide at the start of 3.1

## D8 — Two word lists, built from the largest Word Cloud
**Decided** · 2026-10-30 · puzzle-word source superseded by D17 (SCOWL size 60 replaces the frequency list)
A Word Cloud is a group of words where every word can reach every other by single-letter changes (a connected component). Two words one letter apart are always in the same cloud, so a player can never move out of the cloud their puzzle is in.
- **Accepted words** — any word a player may type. Source list, cleaned of proper nouns, abbreviations, Roman numerals and entries with apostrophes, restricted to the largest 4-letter cloud.
- **Puzzle words** — start and target words only. Accepted words that also appear in a common-English frequency list, so every puzzle starts and ends on words people know.
- Both lists are filtered through an offensive-words blocklist.
- Par is computed over the accepted words, so it reflects any route a player could take.

Evidence from `english3.txt`: 5,361 four-letter words in 84 clouds; the largest holds 5,255 (98%). The rest are tiny groups and 67 isolated words (`envy`, `hymn`, `aqua`), which can never appear in a ladder anyway. Proper nouns can't be detected from that list alone because it's all lowercase.

## D9 — Scoring: par, shown up front
**Decided** · 2026-10-30
- **Par** is the number of moves in a shortest path. `COLD → CORD → CARD → WARD → WARM` is par 4.
- Par is shown from the start ("COLD → WARM, par 4"). The shortest path itself is only shown when the game ends.
- **Score** is moves in the player's final chain minus par. Par is the best possible result (shown as "par"); otherwise "+1", "+2" and so on.
- At the end, the player's chain is shown beside one shortest path.

## D10 — Hints are marked, not penalised
**Decided** · 2026-10-30 · applies from 4.2
A hint reveals the next word on a shortest path from the player's current word. It doesn't change the score; the share shows 💡 for each hint used.

## D11 — Giving up is a loss
**Decided** · 2026-10-30
Giving up ends the game, reveals a shortest path, and shares as "didn't finish" with no score. It counts as a loss for stats and streaks.

## D12 — Undo is free
**Decided** · 2026-10-30
Undo removes the last word from the chain at no cost; the score counts only the final chain. An undone word no longer counts as used, so it can be played again. Undo cannot go past the start word.

## D13 — Rejected attempts are free; repeated words are banned
**Decided** · 2026-10-30
An invalid word is not a move: the player sees the reason and tries again. A word already in the current chain is rejected.

## D14 — Soft launch scope
**Decided** · 2026-10-30
Launch includes: today's puzzle with par, entering moves, undo, give up, win screen with the shortest path, mobile layout, how to play. After launch: hints, sharing (first, if friends start screenshotting results), stats, practice mode.

## D15 — Puzzle numbering starts at launch
**Decided** · 2026-10-30
Puzzle #1 is the launch date; the number goes up by one each day. Fixed once people start sharing results, so don't change it after launch.

## D16 — Daily par range
**Open** · blocks 2.3
How long should daily puzzles be? Suggested starting point: par 4–6, adjusted from player feedback.

## D17 — Dictionary source: SCOWL, two sizes
**Decided** · 2026-10-30 · supersedes D3 and the puzzle-word source in D8
- **Accepted words:** SCOWL `en_GB-large` (size 70, British, `-ise` and `-ize`), Hunspell release 2026.02.25.
- **Puzzle words:** SCOWL `en_GB-ise` (size 60, British `-ise`), same release. SCOWL sizes rank words by how common they are, so size 60 replaces the separate frequency list.
- **Licence:** permissive, including commercial use, on condition that the copyright notice is included. Keep `data/words/SCOWL-LICENSE.txt` beside the built lists and credit SCOWL in the app.
- **Cleaning:** expand Hunspell endings; keep only lowercase words; drop Roman numerals; drop a human-reviewed exclusion list (lowercase abbreviations such as `asap`, `govt`); drop SCOWL's taboo-flagged words plus a fuller offensive-words blocklist.

Why: one licence and one spelling standard for both lists. `english3.txt` has no known licence and lost its capitals, so proper nouns can't be removed from it; it's kept out of the repo and used only as a cross-check.

Evidence (spike, before exclusion and blocklist):

| | Size 60 | Size 70 |
|---|---|---|
| 4-letter words, cleaned | 2,692 | 3,433 |
| Largest cloud | 2,550 | 3,308 (96%) |

- Puzzle pool: 2,614 size-60 words inside the size-70 cloud. Every size-60 cloud word is in the size-70 cloud.
- Size 70 reconnects 64 common words stranded at size 60 (`high`, `sign`, `able`, `idle`, `into`).
- Some words stay outside the cloud at any sensible size (`evil`, `exam`, `hymn`, `opal/oral/oval`). They can't be reached in any puzzle, so leaving them out costs nothing.
- From `cold`, most words are 4–6 moves away, which fits the suggested par range (D16). `cold → warm` is par 4.

## D18 — Pin TypeScript 6.0 for now
**Decided** · 2026-10-30 · amends D2
TypeScript 7.0 ships without the JavaScript API that typescript-eslint uses, and typescript-eslint only supports TypeScript below 6.1. Microsoft expects a new API in 7.1. Pinning `typescript@~6.0` keeps one compiler and standard ESLint working; at this project's size, TypeScript 7's speed makes no visible difference.
- Considered: running 6 and 7 side by side via npm aliases (two TypeScripts to explain); oxlint or Biome (fewer rules, no type-aware linting).
- **Revisit when** TypeScript 7.1 ships and typescript-eslint supports it.

## D19 — Per-chunk SDLC records and independent review
**Decided** · 2026-10-31
Each chunk gets `sdlc/<id>-<name>/` with `intent.md`, `plan.md` and `review.md`, and is reviewed by an agent with a fresh context before the human review.
- Why: specs were only living in chat, so the reasons behind tests weren't in the repo; and self-review is the author marking their own work.
- Evidence from the trial on 1.4: the independent reviewer found that two breaks of the core move rule left every test green, and that `"cold "` returned `colds`. Self-review had missed both.
- Cost: a few minutes and three short files per chunk. Keep the files short so the process doesn't become the work.

## D20 — Coverage gate in CI
**Decided** · 2026-10-31 · branches raised to 100 in 1.12, which removed the empty-chain fallback instead of testing it
CI runs the tests with V8 coverage (`@vitest/coverage-v8`) over `src/` and `scripts/` and fails below 100% statements, lines and functions, and 97% branches: the level on main when this was added.
- Why: break-the-code checks show a test protects its rule, but only for code someone thinks to break. Coverage catches code no test runs at all, such as a new untested file, at no review cost.
- Coverage is a floor, not the goal: a covered line can still be untested in any meaningful sense. The testing rules and break-the-code checks still apply.
- The one uncovered branch is the empty-chain fallback in `checkMove`; raise branches to 100 once 4.3 tests restoring a game with an empty chain.
- Considered: 100% everywhere (needs a code change first); report only (nothing stops an untested file).
- **Revisit at** 3.1, when UI code arrives.

## D21 — Stricter lint, a lint-enforced pure core, and Prettier
**Decided** · 2026-10-31
- **Type-aware lint:** typescript-eslint `strictTypeChecked` and `stylisticTypeChecked` replace `strict`. They passed on the existing code with no changes; they catch promises nobody waits for and conditions that are always true, which matter once UI and async code arrive.
- **Pure core in lint:** `src/core/` can't use DOM or storage globals, `fetch` or timers, `Date`, `performance`, `crypto`, `Math.random`, Node modules, or imports from `ui/` or `puzzles/`. The rule was only in prose before.
- **Prettier** (`printWidth` 100, otherwise defaults) formats code and config; `npm run lint` checks it, so CI does too. Markdown is left to hand formatting so tables and records aren't reflowed.
- SOLID isn't adopted as a standard: it targets class design, and this code is pure functions over plain data. Where it translates (one job per function, dependencies passed in, small interfaces) the conventions already cover it.
- New dependency: `prettier` (dev only, exact version).

---

## Ideas for later (not scheduled)
- **Separate-cloud puzzles:** offer a start and target from different clouds and ask the player to spot that it can't be done.
- **Longer words:** 5–7 letter puzzles, each length with its own cloud.
