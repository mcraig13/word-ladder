# 1.7 review

**Reviewer:** independent agent, fresh context · **Verdict:** approve

In scope and correct; lint clean, 79/79 tests pass. Awkward input checked by the reviewer: a fresh game, a hand-built empty chain (`nothing-to-undo`, no throw), a won game of one word (`game-over`), and undo twice then replay.

## Findings
1. **note** Swapping the check order (`nothing-to-undo` before `game-over`) leaves every test green; the intent says this is only testable from 1.8. — *Response:* Agreed, no change in 1.7. Carried into the 1.8 intent: test that undo after giving up returns `game-over`, including at the start word, which pins the order.
2. **note** Deciding "game over" from last word = target instead of from status leaves every test green; the two are the same while `won` is the only ending. — *Response:* Agreed, no change in 1.7. The 1.8 given-up test from finding 1 tells them apart, since a given-up game's last word isn't the target.
3. **note** `an undone word can be played again` adds no protection beyond `removes the last word…`, as `Game` has no separate used-words record. — *Response:* Kept: it's a backlog acceptance criterion and checks D12 end to end through `applyMove`.

## Reviewer's own break-the-code checks
- Remove the last two words → red: `removes the last word…`, `can undo the first move…`, `an undone word…`
- Drop the start-word guard → red: `cannot undo past the start word`
- Return `nothing-to-undo` for a won game → red: `undo is not available after the game has been won`
- No-op undo → red: `removes the last word…`, `can undo the first move…`, `an undone word…`
- Overwrite target → red: `removes the last word…`
- Swap check order → all green *(finding 1; testable from 1.8)*
- Game over from last word = target → all green *(finding 2; testable from 1.8)*
