import { areWordsOneLetterApart } from "./areWordsOneLetterApart";
import type { Dictionary } from "./createDictionaryFromWords";
import { normaliseWord } from "./normaliseWord";

/**
 * Every dictionary word that is one move away from the given word, in
 * alphabetical order (chunk 1.4). The order is stable so the solver, and so
 * the daily puzzle, behave the same on every device.
 *
 * The given word is normalised first; if it isn't a valid word, there are no
 * moves from it. It doesn't need to be in the dictionary itself.
 */
export function getWordsOneLetterAway(word: string, dictionary: Dictionary): readonly string[] {
  const normalised = normaliseWord(word);
  if (!normalised.ok) {
    return [];
  }

  return dictionary
    .getWordsOfLength(normalised.word.length)
    .filter((candidate) => areWordsOneLetterApart(normalised.word, candidate));
}
