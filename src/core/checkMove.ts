import { areWordsOneLetterApart } from "./areWordsOneLetterApart";
import type { Dictionary } from "./createDictionaryFromWords";
import type { Chain } from "./createGame";

export type CheckMoveResult =
  | { ok: true; word: string }
  | { ok: false; reason: "wrong-length" | "not-one-change" | "not-a-word" | "repeated-word" };

/**
 * Whether the next word is a legal move from the end of the chain, or the
 * reason it isn't (chunk 1.5). Reasons are checked in order: length, then a
 * one-letter change, then the dictionary, then repeats. On success the word
 * comes back trimmed and lowercase, ready to add to the chain.
 */
export function checkMove(chain: Chain, nextWord: string, dictionary: Dictionary): CheckMoveResult {
  // Before any move, the current word is the start word.
  const [startWord, ...laterWords] = chain;
  const currentWord = laterWords.at(-1) ?? startWord;
  const normalisedNextWord = nextWord.trim().toLowerCase();

  if (normalisedNextWord.length !== currentWord.length) {
    return { ok: false, reason: "wrong-length" };
  }

  if (!areWordsOneLetterApart(currentWord, normalisedNextWord)) {
    return { ok: false, reason: "not-one-change" };
  }

  if (!dictionary.containsWord(normalisedNextWord)) {
    return { ok: false, reason: "not-a-word" };
  }

  if (chain.includes(normalisedNextWord)) {
    return { ok: false, reason: "repeated-word" };
  }

  return { ok: true, word: normalisedNextWord };
}
