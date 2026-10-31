# SDLC records

One folder per chunk of work, named `<chunk id>-<short name>`, e.g. `1.5-check-move`. The backlog (`backlog.md`) is the index of chunks; once a chunk starts, its folder is the detailed source.

## The loop

| Step | Who | Output |
|---|---|---|
| 1. Intent | AI drafts, human approves | `intent.md` |
| 2. Plan and tests | AI writes, human reviews before implementation | `plan.md`, test file |
| 3. Implement | AI | code |
| 4. Self-review | AI: check against intent, then break the code on purpose and confirm a test goes red | notes in `plan.md` |
| 5. Independent review | Reviewer agent with fresh context: sees only `intent.md`, `plan.md`, the diff and `CLAUDE.md` | `review.md` |
| 6. Respond | AI answers every finding: fixed, or why not | responses in `review.md` |
| 7. Human review and merge | Human, via pull request linking `review.md` | merged PR |

Keep files short. A small chunk should need a few lines per file, not pages.

## Templates

### intent.md

```md
# <chunk id> <name>

**Intent:** one or two sentences: what this does and why the game needs it.
**Signature:** the public function(s) and what they return.

## Rules protected
- Rule, with its source (CLAUDE.md section or decision ID)

## Acceptance criteria
- Written as test names

## Out of scope
- What this deliberately doesn't do, and which chunk does
```

### plan.md

```md
# <chunk id> plan

## Approach
A few lines on how, and why this way.

## Files
- path — what changes

## Tests
| Test | Input | Expected | Rule |

## Self-review
- Break: <deliberate change> → <which tests went red>
```

### review.md

```md
# <chunk id> review

**Reviewer:** independent agent, fresh context · **Verdict:** approve / approve with changes / changes needed

## Findings
1. **<severity>** <finding> — *Response:* <fixed in abc123 / not changed because …>

## Reviewer's own break-the-code checks
- <change> → <result>
```

## Reviewer brief

Give the reviewer agent this brief, filling in the chunk details. Don't add your own explanation of the work: the point is a fresh view.

> You are an independent reviewer for this repo. Judge the work only on what is in the repo, not on any explanation from its author. Be rigorous and specific; if the work is good, say so briefly.
>
> **Rules for you:** don't modify anything in the repo and don't run git commands that change state. For experiments, copy `src/` and `tests/` to a scratch folder outside the repo and work there; delete it when done.
>
> **Read, in order:** `CLAUDE.md`; `sdlc/README.md`; `sdlc/<chunk folder>/intent.md` and `plan.md`; the diff `<commit range>`; and any source files the change builds on.
>
> **Check:**
> - Does the code do what the intent says, and nothing outside its scope? Are any files changed that the plan doesn't list?
> - Does each test meet the testing rules in `CLAUDE.md` (named after a rule, AAA, one Act, hand-worked literals, small fixtures, not tautological)? Does every acceptance criterion have a test? Are edge cases that come from the game rules missing?
> - Naming, per `CLAUDE.md`.
> - Correctness on awkward input. Run it rather than guessing.
> - Your **own** break-the-code checks: at least three deliberate breaks of different rules, different from those in `plan.md` where you can. Report which tests went red. A break that leaves every test green is a finding.
> - Type-check and lint pass. If you can't run the test runner in your environment, say so; CI is the final check.
>
> **Reply with only the content for `review.md`**, following the template: a verdict, numbered findings each with a severity (**blocker**, **should fix**, **nit**, **note**), what, where and why in plain language, a "*Response:*" placeholder after each, then your break-the-code checks. Only report what you verified.

## Earlier chunks (before these records)

Specs for these lived in the chat at the time; the commit messages and tests carry them now.

- 0.1–0.5 Walking skeleton: scaffold, lint, CI, deploy. See `DECISIONS.md` D1, D2, D18.
- 1.1 `normaliseWord` — `tests/core/normaliseWord.test.ts`
- 1.2 `createDictionaryFromWords` — `tests/core/createDictionaryFromWords.test.ts`
- 1.3 `areWordsOneLetterApart` — `tests/core/areWordsOneLetterApart.test.ts` (one test strengthened in self-review; see commit 7a56cfd)

From 1.4 on, each chunk has its own folder here.
