# Decisions

Short log of what we decided and why. Newest decisions are added at the bottom. To change a decision, add a new entry that supersedes or amends the old one rather than editing it. The game rules as they stand now are in `CLAUDE.md`; an entry here gives the reasons.

Status: **Decided**, **Open**, or **Superseded by Dn**. A later entry that amends this one is named on the status line, in both entries. Bookkeeping edits are allowed (D29): status lines, chunk numbers that a later decision moved, and a **Now:** line at the top of an amended entry saying what has changed. A superseded entry keeps a one-line summary; its full text is in git history.

---

## D1 — Platform: web app first
**Decided** · 2026-10-30
Soft launch as a static web app shared by link. Friends already play web games, there's no app store review, and it can become an installable PWA later.

## D2 — Stack: TypeScript, Vite, Vitest, static hosting
**Decided** · 2026-10-30 · amended by D18 (TypeScript pinned to 6.0)
Typed pure functions are easy to test and review in an AI-assisted loop. No backend in v1: the dictionary ships with the page and the daily puzzle is computed in the browser.

## D3 — Dictionary source
**Superseded by D17** · was blocking 6.1
The first reference list, `english3.txt`, had no known origin or licence, so it couldn't ship; SCOWL was evaluated instead.

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
**Decided** · 2026-11-01 · React · set up in 3.0
React, with components in TSX, plus `eslint-plugin-react-hooks` for the rules of hooks and missing dependencies.
- Why: the most familiar component model, for the human and for AI-assisted work, and typescript-eslint's type-aware rules and Prettier work on TSX unchanged.
- Cost: about 45 KB of runtime, more than this game needs; accepted for familiarity.
- Considered: Preact (the same model at about 4 KB); no framework (rendering the chain, messages, dialogs and win screen by hand gets harder in 3.2–3.9); Svelte (its own ESLint plugin, with weaker type-aware lint).
- How UI code is tested and covered: D33.

## D8 — Two word lists, built from the largest Word Cloud
**Decided** · 2026-10-30 · puzzle-word source superseded by D17 (SCOWL size 60 replaces the frequency list)
A Word Cloud is a group of words where every word can reach every other by single-letter changes (a connected component). Two words one letter apart are always in the same cloud, so a player can never move out of the cloud their puzzle is in.
- **Accepted words** — any word a player may type. Source list, cleaned of proper nouns, abbreviations, Roman numerals and entries with apostrophes, restricted to the largest 4-letter cloud.
- **Puzzle words** — start and target words only. Accepted words that also appear in a common-English frequency list, so every puzzle starts and ends on words people know.
- Both lists are filtered through an offensive-words blocklist.
- Par is computed over the accepted words, so it reflects any route a player could take.

Evidence from `english3.txt`: 5,361 four-letter words in 84 clouds; the largest holds 5,255 (98%). The rest are tiny groups and 67 isolated words (`envy`, `hymn`, `aqua`), which can never appear in a ladder anyway. Proper nouns can't be detected from that list alone because it's all lowercase.

## D9 — Scoring: par, shown up front
**Decided** · 2026-10-30 · score amended by D26 (undos count), par amended by D27 (1.5 × the shortest path)
**Now:** par is 1.5 × the moves in a shortest path, rounded up, so `cold → warm` is par 6 and a score can be below par (D27). Each undo adds one to the score (D26). Par shown up front and the end-of-game shortest path still stand.
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
**Superseded by D26** · 2026-10-30
Undo was free: the score counted only the final chain. D26 keeps the rest (an undone word can be played again; undo can't go past the start word).

## D13 — Rejected attempts are free; repeated words are banned
**Decided** · 2026-10-30
An invalid word is not a move: the player sees the reason and tries again. A word already in the current chain is rejected.

## D14 — Soft launch scope
**Decided** · 2026-10-30 · amended by D25 (resume today's game is in launch)
Launch includes: today's puzzle with par, entering moves, undo, give up, win screen with the shortest path, mobile layout, how to play. After launch: hints, sharing (first, if friends start screenshotting results), stats, practice mode.

## D15 — Puzzle numbering starts at launch
**Decided** · 2026-10-30
Puzzle #1 is the launch date; the number goes up by one each day. Fixed once people start sharing results, so don't change it after launch.

## D16 — Daily par range
**Decided** · 2026-11-01 · for now · 2.3
Every daily puzzle has a shortest path of 4–6 moves, so par is 6–9 (D27). The range is in moves of the shortest path, as generation and the schedule store it.
- Why: on the real lists most words are 4–6 moves from each other (D17's spike from `cold`), and the committed schedule, built with this range as a placeholder, has 97 puzzles of 4 moves, 159 of 5 and 109 of 6 with no date failing under D30's window.
- Agreed "for now": adjust from friends' shared scores (4.1) once there are some. Before launch, a new range means deleting `schedule.txt` and rebuilding (D24). After launch, published dates keep the range they were made with; the dates already scheduled after today would need dropping first, which nothing does yet (2.3 intent, Out of scope).

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
- From `cold`, most words are 4–6 moves away, which fits the suggested par range (D16). `cold → warm` has a shortest path of 4 moves (par 6, D27).

## D18 — Pin TypeScript 6.0 for now
**Decided** · 2026-10-30 · amends D2
TypeScript 7.0 ships without the JavaScript API that typescript-eslint uses, and typescript-eslint only supports TypeScript below 6.1. Microsoft expects a new API in 7.1. Pinning `typescript@~6.0` keeps one compiler and standard ESLint working; at this project's size, TypeScript 7's speed makes no visible difference.
- Considered: running 6 and 7 side by side via npm aliases (two TypeScripts to explain); oxlint or Biome (fewer rules, no type-aware linting).
- **Revisit when** TypeScript 7.1 ships and typescript-eslint supports it.

## D19 — Per-chunk SDLC records and independent review
**Decided** · 2026-10-31 · amended by D23, D29
Each chunk gets `sdlc/<id>-<name>/` with `intent.md`, `plan.md` and `review.md`, and is reviewed by an agent with a fresh context before the human review.
- Why: specs were only living in chat, so the reasons behind tests weren't in the repo; and self-review is the author marking their own work.
- Evidence from the trial on 1.4: the independent reviewer found that two breaks of the core move rule left every test green, and that `"cold "` returned `colds`. Self-review had missed both.
- Cost: a few minutes and three short files per chunk. Keep the files short so the process doesn't become the work.

## D20 — Coverage gate in CI
**Decided** · 2026-10-31 · branches raised to 100 in 1.12, which removed the empty-chain fallback instead of testing it · amended by D33 (UI code)
**Now:** 100% on all four measures. The empty-chain note below is done (1.12); restoring a saved chain is checked in 3.9 (D25).
CI runs the tests with V8 coverage (`@vitest/coverage-v8`) over `src/` and `scripts/` and fails below 100% statements, lines and functions, and 97% branches: the level on main when this was added.
- Why: break-the-code checks show a test protects its rule, but only for code someone thinks to break. Coverage catches code no test runs at all, such as a new untested file, at no review cost.
- Coverage is a floor, not the goal: a covered line can still be untested in any meaningful sense. The testing rules and break-the-code checks still apply.
- The one uncovered branch is the empty-chain fallback in `checkMove`; raise branches to 100 once 4.3 tests restoring a game with an empty chain.
- Considered: 100% everywhere (needs a code change first); report only (nothing stops an untested file).
- **Revisit at** 3.0, when UI code arrives (moved from 3.1 by D25).

## D21 — Stricter lint, a lint-enforced pure core, and Prettier
**Decided** · 2026-10-31
- **Type-aware lint:** typescript-eslint `strictTypeChecked` and `stylisticTypeChecked` replace `strict`. They passed on the existing code with no changes; they catch promises nobody waits for and conditions that are always true, which matter once UI and async code arrive.
- **Pure core in lint:** `src/core/` can't use DOM or storage globals, `fetch` or timers, `Date`, `performance`, `crypto`, `Math.random`, Node modules, or imports from `ui/` or `puzzles/`. The rule was only in prose before.
- **Prettier** (`printWidth` 100, otherwise defaults) formats code and config; `npm run lint` checks it, so CI does too. Markdown is left to hand formatting so tables and records aren't reflowed.
- SOLID isn't adopted as a standard: it targets class design, and this code is pure functions over plain data. Where it translates (one job per function, dependencies passed in, small interfaces) the conventions already cover it.
- New dependency: `prettier` (dev only, exact version).

## D22 — Mutation testing (Stryker) not adopted
**Decided** · 2026-10-31
Stryker was tried once, on 1.9 `findShortestPath`, in a scratch copy with nothing committed. Details are in `sdlc/1.9-find-shortest-path/plan.md`.
- Result: 48 mutants and a mutation score of 95.8% (97.9% after the review fixes; the one survivor left changes no result). It found one real gap the hand-made breaks missed: the unreachable-target test had no loop, so a solver that never records the words it has reached still passed.
- Why not adopt it: the independent review found that same gap, and three more Stryker couldn't. Those needed a statement moved or added, not a small change in place. It added nothing beyond the review, at the cost of two dev dependencies and a config to maintain.
- Considered: running it on every chunk in CI; running it once on M chunks with search or loop logic.
- **Revisit if** an independent review misses a gap that a mutant would have shown.

## D23 — One human stop, review by risk, and a process freeze
**Decided** · 2026-10-31 · amends D19 · amended by D28, D29, D31 (freeze lifted)
**Now:** the author runs no breaks and no review is skipped (D29); the break checklist is the reviewer's. The one human stop, shorter reviews and the freeze still stand.
After 1.4–1.12, a look back at how the loop actually ran.
- **One human stop per chunk**, after intent, plan and tests, before implementing. The two stops planned for M chunks never happened: 1.5 and 1.6 put intent, plan and tests in one commit, and 1.9 had no stop before the PR.
- **Break checklist for self-review.** The gaps reviewers found and self-review missed came from breaks that reorder checks, delete a guard on the second argument, return early or forget visited state (1.4, 1.5, 1.7, 1.9). Self-review now works through those kinds of break, so they're caught before review.
- **Skip the independent review** for S chunks that follow a pattern, have no search or loop logic, and whose self-review breaks all went red. 1.8 and 1.12 reviews came back "approve" with notes only. 1.7's review did find two check-order gaps, but those are now on the checklist. M chunks keep the review: it found real gaps in 1.4, 1.5 and 1.9.
- **Shorter reviews:** observations that need no action go on a one-line Notes list, not as numbered findings each answered "agreed, no change".
- **Process freeze until soft launch:** only fixes to the process tooling (as `break.mjs` crash reporting was). Six of the first 18 PRs were process changes; the effort now goes to the critical path.
- Considered: dropping the human stop and reviewing only at the PR (tests written to fit the code would be harder to spot); keeping the review for every chunk (several minutes per S chunk for notes only).
- **Revisit at** 3.0 (moved from 3.1 by D25), together with D7 and D20: how UI code is tested, and whether the coverage gate and break checks still fit.
- **Revisit sooner if** a skipped review lets through a gap that the human review or a later chunk finds.

## D24 — Keeping puzzles fixed when a word list changes
**Decided** · 2026-11-01 · Option A, a puzzle schedule
A build script writes a schedule file: a start and target for each date from launch, about a year ahead. The app looks up the line for the date's puzzle number (2.5). Published dates never change, so a word-list change only affects dates added after it.
- Why: if the browser picks each puzzle from a seed and the word lists, removing one word (from the exclusion list or blocklist) reshuffles every date, including past puzzles whose results people have shared and today's while people are playing it.
- **Par isn't stored.** `createGame` works it out from the accepted words, as now (1.10). A build check fails if a list change alters the shortest path of a date already published, so par can't shift under players without someone noticing.
- **Changing the schedule:** before launch it can be regenerated freely, e.g. once D16 sets the par range. After launch the script only adds dates. A published date is changed only by hand, e.g. to remove an offensive word, and then only that date changes.
- **Running out:** a build check fails when fewer than 60 days remain, two months to notice and extend it. A date past the end reports that there's no puzzle, rather than failing some other way.
- A check that every scheduled puzzle is still solvable with the current accepted list belongs in the build.
- Generation runs at build time, so a phone runs one search (par), not a generation search. The whole schedule is visible at once, so rules across dates, such as not repeating a word within a few weeks, are possible; 2.6 decides whether to add one. **D30** adds one: no start or target again within 90 days.
- Accepted risk: a determined player could read ahead in the file, which is fine for a game among friends.
- Considered: **B**, freeze the lists at launch and generate in the browser (an offensive word found after launch can't be removed without reshuffling); **C**, generate only from puzzle words added before a date (harder to get right and to test than A).
- Backlog: new chunk 2.6 builds and extends the schedule; 2.4 becomes looking up a date's puzzle in it; 2.3 checks the schedule against D16's range.

## D25 — Resume today's game is part of soft launch
**Decided** · 2026-10-31 · amends D14
Reloading the page and keeping today's chain moves from after launch (4.3) to soft launch, as 3.9. On a phone, friends will reload or switch apps by accident and lose their chain in the first week. Stats and streaks stay after launch, as 4.3.
- The restore check for a saved chain carried forward from 1.6 and 1.12 moves with it; D20's branch note now refers to 3.9.
- Backlog review on the same day: 6.1 split into 6.1a (reading Hunspell) and 6.1b (building the lists); a new 3.0 chunk decides D7 and how UI code is tested, so the 3.1 revisits in D20 and D23 happen at 3.0; 1.11 depends on 6.1b and 3.0 rather than 6.2 and 6.3, which now block only 3.8 launch checks.

## D26 — Undo costs a move
**Decided** · 2026-10-31 · supersedes D12, amends D9
Each undo adds one to the score. Score is moves in the final chain, plus undos, minus par. That's the same as counting every move played, since an undo takes back exactly one move: play `colt`, undo it, then win in par, and the score is +1.
- Why: with free undo, trial and error cost nothing, so the score showed only the final chain, not how the player got there.
- Unchanged from D12: undo removes the last word, cannot go past the start word, and isn't available once the game has ended. An undone word is no longer in the chain, so it can be played again; playing it again is a new move.
- Undos only add to the score, so they never help a player get under par (D27).
- The game has to record its undos, since the chain alone no longer gives the score (new chunk 1.13, before 1.10). A saved game must keep its undo count (3.9), or a reload would clear it.
- Considered: +2 per undo (the move back plus a penalty: harsher than playing on, for no clear gain); counting undos and showing them in the share without changing the score, as hints do (D10).

## D27 — Par is a typical result, not the best
**Decided** · 2026-10-31 · amends D9
Par is 1.5 × the moves in a shortest path, rounded up. `cold → warm` has a shortest path of 4 moves, so par is 6; a shortest path of 5 gives par 8. Score is still moves (plus undos, D26) minus par, so it can go below par: winning `cold → warm` in 4 scores −2, in 6 "par", in 7 +1.
- Why: as in golf, par should be what a typical player scores, so a good game beats it. With par equal to the shortest path, par was a ceiling to reach, and nobody could get under it.
- 1.5 × is a stand-in until there's data on what players actually score. Finding that out needs analytics, which v1 rules out (CLAUDE.md), so it's a decision for after launch; friends' shared scores (4.1) are a rough guide meanwhile.
- Rounded up so odd shortest paths still leave at least half the shortest path under par.
- The best possible score is the shortest path minus par. The shortest path is still worked out over the accepted words and shown at the end (D9).
- D16's range is in moves of the shortest path, not par: the suggested 4–6 gives par 6–9. 2.2 already generates by shortest path.
- Considered: par equal to the shortest path (D9 as it was); the shortest path plus a fixed number of moves (unlike 1.5 ×, the room under par wouldn't grow with longer puzzles); par by puzzle difficulty, now in Ideas for later.

## D28 — The intent says what the author is least sure of
**Decided** · 2026-10-31 · amends D23
`intent.md` gains a "What I'm least sure of" section: two or three points where judgement went in, weakest first, each with what would change the author's mind. The PR description repeats it, updated after self-review.
- Why: at the human stop, the records read as uniformly confident, so the contentious points were hard to find. In 1.13 the weakest choice (no shared test helper, though half the diff was literals reflowed for one new field) was argued for, not flagged. The author writes the code, tests and breaks, so their blind spots are shared; saying where they're unsure points the human at them.
- An exception to D23's process freeze, made by the human reviewer: it changes a template, not how chunks run, and costs a few lines per chunk.
- The independent reviewer also reads `intent.md`, so it sees the list. That's accepted: the brief still asks for its own breaks, and checking named doubts is cheap. If reviews start only answering the list, revisit at 3.0.
- Considered: waiting for the 3.0 process review (another ten or so chunks reviewed without it); a full risk register per chunk (too heavy for S chunks).

## D29 — Two sessions per chunk, reviewer-only breaks, and reading less
**Decided** · 2026-11-01 · amends D19, D23 · amended by D31
The 6.1a session's context grew very large. A look at the last three sessions' transcripts showed the code is a small part of it (`src/core/` is about 15k characters). Most came from reading whole documents at the start (20–27k characters each time: `backlog.md`, `DECISIONS.md`, an earlier chunk's records), writing and editing ever longer records (1.4's intent and plan were about 4k together, 6.1a's 33k), and running breaks in the main session (22 in 1.10). Reviewer agents returned 1–4k characters each.
- **Two sessions per chunk,** split at the human stop. The records are the handoff. At each handoff point the author says so and gives a ready-to-paste prompt for the next session (`sdlc/README.md`).
- **The author runs no breaks; the reviewer runs them all,** for every chunk, through the full checklist. In 6 of the 9 reviewed chunks, the reviewer found gaps the author's breaks had missed: the author writes breaks with the same blind spots as the tests. Self-review found real gaps only in the bigger chunks (1.5, 1.9, 6.1a), and the reviewer still found more in each. Self-review never found something the reviewer then missed. The author keeps a three-line self-check.
- **No more skipped reviews.** D23's skip depended on self-review breaks, and saved one review (1.13). The reviewer costs the main session a few thousand characters.
- **Two reviewers in parallel for M chunks,** one on breaks only and one on everything else, as the two kinds of work find different gaps.
- **Read less:** finished chunks move to `backlog-done.md`; read only the backlog entries and decisions a chunk cites; size limits for `intent.md` and `plan.md`; research and, from Phase 3, browser checks go to subagents.
- Another exception to D23's process freeze, made by the human reviewer: without it, every chunk until 3.0 pays the same context cost.
- Considered: keeping self-review breaks but running them in a subagent (cheaper for the main session, but still the author's blind spots, and the reviewer then repeats them); dropping self-review entirely (the self-check costs almost nothing and catches, before review, the kind of slip reviewers found in 1.4, a file outside the chunk's scope, and 6.1a, a listed file not committed).
- **Revisit at** 3.0 with D23. **Revisit sooner if** the human finds a gap at PR review that author breaks would plausibly have caught, or session B often needs to reread session A's chat.

## D30 — No start or target word again within 90 days
**Decided** · 2026-11-01 · decides the open point in D24 · 2.6a · window cut from 365 to 90 days at PR review
A word that was a start or target is neither again for the next 90 puzzles, counting the puzzles already in the schedule. It can still appear in a path. The window is a parameter, `daysBeforeWordRepeats`; 0 turns the rule off.
- Why: measured on the real lists (seed 2026, 4–6 moves), a year with no rule used 632 different words for its 730 starts and targets, and 12 dates reused a word from the 30 days before. Players notice a word coming back days later. With 90 days the year's schedule uses 674 different words, and the nearest a word comes back is 94 days later; no date fails, and generation is no slower.
- Why 90, not 365: a year was proposed first (all 730 different, nothing measurable lost), but it holds back 28% of the puzzle words by its end, which leaves less room for a narrower range from 2.3. The human reviewer judged three months enough for players not to notice a word coming back.
- Cost: each new date depends on the ones before it. Dates already in the file are kept, so a hand edit to a published date (D24) changes no other date, though its new words could repeat within the window unless 2.6b checks for it.
- If a narrower range from 2.3 leaves a date with no puzzle, the error names its number; a shorter window is the fallback.
- Considered: no rule (the repeats above); a few weeks, as D24 suggested; a year (above).

## D31 — Process review at 3.0
**Decided** · 2026-11-01 · amends D23, D29 · record: `sdlc/process-review-3.0.md`
A look back over the 19 chunk records and 46 PRs at the start of Phase 3. Independent review with reviewer-only breaks, two sessions per chunk and the one human stop all stay: reviewer breaks found gaps in 8 of the 9 chunks since D29, and records have stayed within the size limits.
- **Backlog update in the chunk PR:** its last commit moves the entry to `backlog-done.md`. 9 of the 46 PRs did only this.
- **Fixtures tell inputs apart:** when a function takes two inputs of the same kind, the fixture makes them differ. The second most common gap reviewers found (about 9 times).
- **Self-check quotes command output:** the changed-file list, lint and coverage. It caught no test gap since D29, and in 2.4 it said the files matched when they didn't.
- **Re-run the reviewer's breaks after fixes:** the reviewer saves them as `breaks.json`; the author re-runs them after a fix that changes logic or should turn a break red. These are the reviewer's breaks, so D29's blind-spot reason doesn't apply.
- **CI runs `build:words`** and fails if the committed lists differ; the tests compared lists but never ran the script. `build:schedule` isn't added.
- **No magic numbers** is a convention (7.1 cleans up existing code, whenever).
- **Size guide counts production code only** (`src/`, `scripts/`); test lines are given in the PR. It was exceeded 7 times and never led to a split.
- **UI break kinds** join the checklist: remove an element or its accessible name, stale state, a control wrongly enabled, a skipped announcement.
- **Process freeze lifted:** process changes can be made whenever they help, still in their own PR.
- Considered: dropping the self-check; a breaks-only second reviewer for fixes (more cost for the same breaks); keeping the freeze.

## D32 — Soft launch is a one-week trial
**Decided** · 2026-11-01 · amends D14
The soft launch runs for a week with friends, then the site goes offline while a server-managed version is considered.
- Launch date (puzzle #1, D15) is set at 3.8, once the launch checks pass.
- Browsers: evergreen browsers from the last two years: Safari on iOS, Chrome on Android, and desktop Chrome, Edge, Firefox and Safari.
- No automated schedule extension and no "no puzzle today" screen: the schedule runs 365 days ahead, far past the trial. If the game continues, how puzzles are managed is decided then, with the server question.
- **Open after the trial:** whether to add a server, and what it would manage (puzzles, stats). D1 and D2's "no backend in v1" still hold for the trial.

## D33 — How UI code is tested and covered
**Decided** · 2026-11-01 · amends D20 · set up in 3.0
- **Most UI tests run in jsdom** with React Testing Library, finding elements by role and name, the way a player sees the page. The core tests keep running in Node.
- **A few run in a real browser** (Vitest browser mode), for what jsdom can't show, such as layout at phone width (3.6) and the app mounting from its entry file.
- **Coverage stays 100%** for UI code. Only the entry file that mounts the app is excluded: only the browser test runs it.
- Considered: jsdom only (layout untestable); browser only (slower, browser download in CI for every test); a lower threshold for UI code.
## D34 — Blocklist source: dsojevic/profanity-list, reviewed by hand
**Decided** · 2026-11-01 · for 6.3
`data/words/blocklist.txt` starts from dsojevic/profanity-list (MIT, © 2021 David Sojevic), filtered and added to by a human. Mild words such as hell, damn and crap stay playable; slurs and sexual terms are blocked.
- Why: the clearest licence of the lists compared, and its severity and tags let mild words be kept deliberately. SCOWL's own taboo flag, already applied in 6.1a, covers only 5 four-letter words.
- Known gaps: the lists match base forms, so plurals slip through, and several slurs in `accepted.txt` are in no list. The human review adds them; LDNOOBW's hits are a cross-check only, so its CC-BY credit isn't needed.
- Licence: a notice for dsojevic/profanity-list (link, commit date, "filtered and added to by hand", the MIT text) goes in `data/words` beside the SCOWL notice.
- Considered: LDNOOBW (CC-BY-4.0, no severity, blocks butt and suck); a Google-derived list (data licence doubtful); CMU's list (no licence, blocks fire and kill); hand-written only.

## D35 — The game is called Word Golf
**Decided** · 2026-11-01 · in 3.0
Players see the name Word Golf: the page heading and the browser tab title. The puzzle is still a word ladder, and the repository, its URL (`/word-ladder/`) and the docs keep the old name for now.
- Why: it goes with the par theming (D9, D27): a score of par, −1, +1 reads like golf.
- Considered: keeping Word Ladder (a generic name for the puzzle type, not the game).

## D36 — The look: letter tiles, an on-screen keyboard, Clubhouse colours
**Decided** · 2026-11-01 · in 3.2 (prefilled input), 3.3, 3.4, 3.6a, 3.6b
A clean centred column in the style of daily word games, not a copy of any one game's look or branding. The aim: someone who has played Wordle feels at home straight away (tile rows, a QWERTY keyboard, one puzzle a day) but can tell it's a different game (its own colours, a prefilled word, the target on screen, par).
- **Chain:** each word is a row of letter tiles. The letter that changed from the word before is filled with the accent colour. Colour marks only that, never right or wrong letters.
- **Next word:** the input starts as a copy of the last word in the chain. The player taps a tile, then a letter, then Play or Enter. Nothing plays before that, because a real word played by mistake costs a move and undoing it costs +1 (D26).
- **On-screen keyboard:** QWERTY, with Play (Enter) at the left of the bottom row and Backspace at the right, where Wordle players expect them. Backspace puts back the last word's letter on the selected tile. Tiles and keys type into the real labelled "Next word" input, so screen readers, hardware keyboards and the role-and-name tests (D33) keep working. The phone's own keyboard stays closed (`inputmode="none"`). Needed for the soft launch.
- **Playing a move:** only the changed tile flips as the new row is added, unless the player prefers reduced motion.
- **Header:** the name, puzzle number, `start → target`, Par and Moves. Golf words stay light: Par and Moves, not Strokes or Hole.
- **Target:** in the header, and as a dashed row of tiles below the chain.
- **Long chains:** the chain scrolls to keep the input row in view; the header and keyboard stay put. Nothing collapses.
- **Rejections:** shown under the input row, in the `role="status"` region, until the player changes a letter. The tiles shake once, unless the player prefers reduced motion.
- **Undo and Give up:** a row of two buttons between the chain and the keyboard, "Undo (+1)" and "Give up" (with 3.4's confirmation).
- **Colours (Clubhouse):** navy and teal, with red kept for rejections only. Light: page `#F4F6FA`, text `#14213D`, tile border `#C5CCDA`, changed letter `#1F6F8B` with white text, rejection `#7A1E14` on `#F8DCD8`. Dark: page `#0E1626`, text `#E6ECF5`, tile border `#33415C`, changed letter `#4FB3D1` with `#06202A` text, rejection `#F5C4BD` on `#4A1A16`. These are starting values from the mockups. 3.6a checks contrast (WCAG AA) and may adjust them.
- **Dark mode:** follows the device setting. No toggle for launch.
- Why: tiles and keys feel like a daily word game on a phone, where the phone's own keyboard would cover half the screen. Prefilling the last word turns the one-letter rule into the way you play: two taps a move.
- Cost: the keyboard is an M chunk (3.6b) on the path to launch, and the hidden-input wiring has to work with screen readers.
- Considered: a plain text field with the phone's keyboard; a golf scorecard list (cheapest, looks least like a game); typing all four letters each move; playing a move as soon as a letter is tapped; Fairway (cream and green, too close to Wordle's tiles) and Flag (black and white with red, which reads as wrong) palettes; folding older words away; a toast that fades; Undo on the keyboard with Give up in the header or a menu; a dark-mode toggle; Play at the right with no Backspace; flipping the whole row, or no animation.

---

## Ideas for later (not scheduled)
- **Separate-cloud puzzles:** offer a start and target from different clouds and ask the player to spot that it can't be done.
- **Longer words:** 5–7 letter puzzles, each length with its own cloud.
- **Par by difficulty:** set par from how hard a puzzle is (few routes, many dead ends), not a fixed 1.5 × the shortest path (D27). Needs a difficulty measure.
- **Par from player averages:** once there's data on what players score (D27). Needs a decision on collecting it, since v1 has no analytics.
