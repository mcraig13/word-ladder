/**
 * Puts a word into the standard form used throughout the game: trimmed and
 * lowercase, containing only the letters a–z (chunk 1.1).
 *
 * Accented letters are rejected rather than converted, so a player's input is
 * never silently changed into a different word.
 */
export type NormaliseResult =
  { ok: true; word: string } | { ok: false; reason: "empty" | "not-letters" };

const LETTERS_ONLY = /^[a-z]+$/;

export function normaliseWord(input: string): NormaliseResult {
  const word = input.trim().toLowerCase();

  if (word === "") {
    return { ok: false, reason: "empty" };
  }

  if (!LETTERS_ONLY.test(word)) {
    return { ok: false, reason: "not-letters" };
  }

  return { ok: true, word };
}
