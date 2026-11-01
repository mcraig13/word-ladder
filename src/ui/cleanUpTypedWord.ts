// Unicode format characters: zero-width spaces and joiners, byte order marks,
// soft hyphens. They're invisible, so a player can't see or delete them.
const FORMAT_CHARACTERS = /\p{Cf}/gu;

/**
 * The typed word without invisible characters, so they can't make a word the
 * wrong length (chunk 3.2, carried forward from 1.5 review 6). Nothing else
 * changes: checking the word is left to normaliseWord and checkMove.
 */
export function cleanUpTypedWord(typedWord: string): string {
  return typedWord.replace(FORMAT_CHARACTERS, "");
}
