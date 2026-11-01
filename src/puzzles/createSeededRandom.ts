/**
 * A random source that gives the same picks for the same seed (chunk 2.1), so
 * the daily puzzle is the same for everyone on a date (D5). Each pick moves
 * the sequence on; a generator is meant for one generation run, not shared.
 */
export interface SeededRandom {
  /** One item from the list, or undefined for an empty list. */
  pickFrom<Item>(items: readonly Item[]): Item | undefined;
}

/**
 * The seed is a whole number from 0 to 2³² − 1. Seeds outside that range wrap
 * into it (seed >>> 0); they aren't checked.
 *
 * Mulberry32: integer arithmetic only, so every device gives the same
 * sequence. Changing it would reshuffle every puzzle made from a seed (D24).
 */
export function createSeededRandom(seed: number): SeededRandom {
  let state = seed >>> 0;

  function getNextFraction(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 2 ** 32;
  }

  return {
    pickFrom(items) {
      return items[Math.floor(getNextFraction() * items.length)];
    },
  };
}
