import { createGame, type CreateGameResult, type Game } from "../core/createGame";
import type { GameData } from "./createGameDataFromText";
import { findPuzzleForDate, type FindPuzzleForDateResult } from "./findPuzzleForDate";
import type { CalendarDate } from "./getPuzzleNumber";

export type FindGameForDateResult =
  | { ok: true; puzzleNumber: number; game: Game }
  | Extract<FindPuzzleForDateResult, { ok: false }>
  | Extract<CreateGameResult, { ok: false }>;

/**
 * A new game of the puzzle everyone plays on this date (D5, D15, D24). Par
 * is worked out over the accepted words, which moves are checked against
 * (D8, D27). Either step's failure is returned with its reason.
 */
export function findGameForDate(
  date: CalendarDate,
  launchDate: CalendarDate,
  gameData: GameData,
): FindGameForDateResult {
  const puzzleResult = findPuzzleForDate(date, launchDate, gameData.schedule);
  if (!puzzleResult.ok) {
    return puzzleResult;
  }
  const { start, target } = puzzleResult.puzzle;
  const gameResult = createGame(start, target, gameData.acceptedWords);
  if (!gameResult.ok) {
    return gameResult;
  }
  return { ok: true, puzzleNumber: puzzleResult.puzzleNumber, game: gameResult.game };
}
