/**
 * Whether two words differ by exactly one letter in the same position, which
 * is the move rule of the game (chunk 1.3). Adding, removing or reordering
 * letters doesn't count. Case is ignored.
 */
export function areWordsOneLetterApart(firstWord: string, secondWord: string): boolean {
  if (firstWord.length !== secondWord.length) {
    return false;
  }

  const first = firstWord.toLowerCase();
  const second = secondWord.toLowerCase();
  let differences = 0;

  for (let position = 0; position < first.length; position++) {
    if (first[position] !== second[position]) {
      differences++;
      if (differences > 1) {
        return false;
      }
    }
  }

  return differences === 1;
}
