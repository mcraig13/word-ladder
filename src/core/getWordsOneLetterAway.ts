import type { Dictionary } from "./createDictionaryFromWords";
import { normaliseWord } from "./normaliseWord";

// Normalised words are letters a–z only (chunk 1.2).
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

/**
 * Every dictionary word that is one move away from the given word, in
 * alphabetical order (chunk 1.4). The order is stable so the solver, and so
 * the daily puzzle, behave the same on every device.
 *
 * The given word is normalised first; if it isn't a valid word, there are no
 * moves from it. It doesn't need to be in the dictionary itself.
 *
 * Each one-letter change is looked up in the dictionary, rather than every
 * word compared with this one, so a search over the full lists stays fast
 * (chunk 2.6c checks every scheduled puzzle).
 */
export function getWordsOneLetterAway(word: string, dictionary: Dictionary): readonly string[] {
  const normalised = normaliseWord(word);
  if (!normalised.ok) {
    return [];
  }

  const original = normalised.word;
  const wordsOneLetterAway: string[] = [];
  for (let position = 0; position < original.length; position++) {
    for (const letter of ALPHABET) {
      const candidate = original.slice(0, position) + letter + original.slice(position + 1);
      if (letter !== original[position] && dictionary.containsWord(candidate)) {
        wordsOneLetterAway.push(candidate);
      }
    }
  }

  // Default sort compares character codes, which is alphabetical for a–z.
  return wordsOneLetterAway.sort();
}
