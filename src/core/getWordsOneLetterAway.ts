import { areWordsOneLetterApart } from "./areWordsOneLetterApart";
import type { Dictionary } from "./createDictionaryFromWords";

/**
 * Every dictionary word that is one move away from the given word, in
 * alphabetical order (chunk 1.4). The order is stable so the solver, and so
 * the daily puzzle, behave the same on every device.
 */
export function getWordsOneLetterAway(word: string, dictionary: Dictionary): readonly string[] {
  return dictionary
    .getWordsOfLength(word.length)
    .filter((candidate) => areWordsOneLetterApart(word, candidate));
}
