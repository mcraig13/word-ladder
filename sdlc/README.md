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

## Earlier chunks (before these records)

Specs for these lived in the chat at the time; the commit messages and tests carry them now.

- 0.1–0.5 Walking skeleton: scaffold, lint, CI, deploy. See `DECISIONS.md` D1, D2, D18.
- 1.1 `normaliseWord` — `tests/core/normaliseWord.test.ts`
- 1.2 `createDictionaryFromWords` — `tests/core/createDictionaryFromWords.test.ts`
- 1.3 `areWordsOneLetterApart` — `tests/core/areWordsOneLetterApart.test.ts` (one test strengthened in self-review; see commit 7a56cfd)
