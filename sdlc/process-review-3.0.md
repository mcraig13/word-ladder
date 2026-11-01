# Process and backlog review at 3.0

**Why now:** M2 is done and Phase 3 (UI) starts. D20, D23 and D29 are all due a revisit at 3.0, and 3.0 carries three process items forward. This is a proposal for the human to decide on; nothing is changed yet. The approved items go in one process PR (D23's freeze), and the decisions are logged in `DECISIONS.md`.

**Evidence:** the 19 chunk folders in `sdlc/` (their `review.md`, `plan.md` and sizes) and the 46 merged PRs (2026-10-30 to 2026-11-01).

## What the records show

| | |
|---|---|
| PRs | 46: 27 code chunks, 9 process, 9 backlog bookkeeping (`backlog/<id>-done`), 1 rules |
| Reviewer breaks | found gaps in 8 of the 9 chunks since D29 (none in 2.1); 2.6c 6 gaps, 2.6b 5 |
| Author self-check | caught no test gap since D29; in 2.4 it was wrong (said files matched, they didn't) |
| Tests changed after the human stop | 14 of 18 reviewed chunks |
| Over the ~200-line guide | 7 chunks (1.6, 1.9, 1.10, 2.2, 2.6a, 2.6b, 6.1b); always "called out in the PR", never split |
| Records since D29 | within the size limits (2.3: 10k characters across three files, 6.1a was 39k) |
| D28 risk (reviews only answering the "least sure" list) | not seen: every review also found gaps the list didn't name |

**Kinds of gap reviewers found:** a missing edge case, about 17 (leap year, NaN, empty target, mixed case); a fixture that can't tell two inputs apart, about 9 (same list for accepted and puzzle words, par always 6); weak test or a wrong claim in the records, 6; scope or process slips, 5; then return early, reorder and deleted guard, 4 each; forgotten state, 2.

## Process: what's working (keep)
- **Independent review with reviewer-only breaks (D29).** It finds real gaps almost every chunk, and the author's breaks never found one the reviewer missed.
- **Two sessions per chunk and the size limits (D29).** Records have stayed short since.
- **The one human stop (D23) and "least sure" (D28).** No sign the list narrows reviews.

## Process: proposals

1. **Fold the backlog update into the chunk PR.** 9 of 46 PRs only moved a finished entry to `backlog-done.md` and updated the milestone row. Make it the last commit of step 7, before merge. *Recommend: yes.*
2. **Fixtures that can tell inputs apart.** The second most common gap. Add to Testing in `CLAUDE.md`: "When a function takes two inputs of the same kind (accepted and puzzle words, start and target), the fixture makes them differ, so a test fails if the code uses one for the other." *Recommend: yes.*
3. **Make the self-check mechanical.** It has caught nothing and was once wrong. The "Files" line quotes `git diff --name-only main...HEAD` rather than a judgement, and the lint and coverage lines quote the result. *Recommend: yes.*
4. **Re-run the reviewer's breaks after fixes** (carried forward from 6.1b). The reviewer saves its breaks as `sdlc/<chunk>/breaks.json`. After fixes that change production logic, or that are meant to make a break go red, the author runs `npm run break -- sdlc/<chunk>/breaks.json` and adds one line to `review.md`. These are the reviewer's breaks, not the author's, so D29's blind-spot concern doesn't apply. *Recommend: yes.*
5. **CI runs `build:words`** (carried forward): add a step that runs `npm run build:words` and then `git diff --exit-code data/words`. A test already compares the lists with a fresh build, but the script itself is never run. `build:schedule` takes ~15 s and could go in the same step. *Recommend: words only for now.*
6. **No magic numbers** (carried forward; 7.1 does the existing code): add a line to Conventions saying every constant gets a name or a comment saying where it comes from. *Recommend: yes.*
7. **Size guide: be honest about it.** It was exceeded 7 times and never led to a split. Either count only `src/` and `scripts/` (tests uncapped but reported in the PR), or keep the rule and actually split. *Recommend: count production code only, ~200 lines; report test lines.*
8. **Break kinds for UI code** (D23 revisit for UI): add to the checklist: remove an element or its accessible name; show stale state (render before the update); leave a control enabled when it should be disabled; skip an announcement to screen readers. *Recommend: yes, here rather than in 3.0, so 3.0 stays about the framework.*
9. **Process freeze (D23):** keep it until soft launch, with this review as the one batch of changes. *Recommend: keep.*

Left to 3.0, as its backlog entry says: D7 (framework), how UI is tested, and D20's coverage gate for UI code (e.g. whether the entry file that mounts the app is covered).

## Backlog: proposals

1. **Do 6.2 and 6.3 now, alongside 3.0–3.2.** Both are human-owned and not started, and both lists are still empty (comments only). 6.2 removes abbreviations that can bridge parts of the Word Cloud, so shortest paths, D16's measurements and the schedule may shift. Before launch the schedule can be rebuilt freely (D24); after launch it can't. Doing them early means one rebuild, checked well before 3.8. *Decision: when you'll do them.*
2. **1.11 gets simpler: bundle the lists instead of fetching them.** `accepted.txt` is 16 KB, `puzzle.txt` 13 KB and `schedule.txt` 4 KB. Importing them at build time (Vite `?raw`) means no async loading, no loading or error state, and no network failure to handle. *Recommend: note this on 1.11; size stays S.*
3. **3.1: no puzzle for today.** D24 says a date past the schedule's end reports that there's no puzzle, but no UI chunk shows it. Add an acceptance criterion to 3.1: "shows a message when there's no puzzle for today".
4. **3.9: the page open past midnight.** 3.9 covers a new day on reload, but not a tab left open overnight, which is common on phones. Add: "a page left open into a new day shows the new puzzle". *Or accept it for launch and say so.*
5. **3.3: make the carried-forward line a criterion.** "undo shows that it adds one to the score" (D26), rather than a carried-forward note.
6. **3.8: link preview.** It's shared by link (D14), so a page description and Open Graph tags make the link readable in a chat app. Add one criterion: "the link shows the game's name and a one-line description when shared".
7. **After launch: nobody runs the 60-days check.** It fails the build only if someone builds. Once friends are playing, commits may stop. Add to 3.8: a scheduled CI run (e.g. weekly) of the schedule check, so running out shows up without a push.
8. **7.1 Explain magic numbers:** a natural fit between phases. *Recommend: after 3.0, before 3.1, or alongside proposal 6.*

## Outcome (human, 2026-11-01)

Gone through one by one. Logged as D31 (process), D32 (soft launch), D33 (UI testing) and D7 (UI framework).

- **Process:** 1–8 approved as recommended (5: word lists only). 9: **freeze lifted**, rather than kept.
- **Backlog:** 1 (6.2, 6.3 now), 2 (bundle), 4 (midnight), 5 (undo cost) and 6 (link preview) approved. 8: 7.1 stays unscheduled.
- **3 and 7, a puzzle every day:** the soft launch is a one-week trial, then offline while a server is considered (D32). The 365-day schedule outlasts it, so there's no "no puzzle" screen and no automated extension.
- **Open decisions, also settled here:**
  - D7: React, plus `eslint-plugin-react-hooks`.
  - UI tests: jsdom with Testing Library, plus a few in Vitest browser mode (D33).
  - Coverage: 100% for UI, entry file excluded (D33).
  - Browsers: evergreen browsers from the last two years (D32).
  - Launch date: set at 3.8.
  - 6.3 blocklist: dsojevic/profanity-list, reviewed by hand, mild words kept (D34).
  - D18 (TypeScript pin) still holds: 7.1 is in beta, and typescript-eslint supports below 6.1.

## Order after this review
Process PR → 3.0 → 1.11 → 3.1 …, with 6.2 and 6.3 running alongside.
