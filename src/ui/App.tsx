import type { CreateGameDataResult } from "../puzzles/createGameDataFromText";
import { findGameForDate } from "../puzzles/findGameForDate";
import type { CalendarDate } from "../puzzles/getPuzzleNumber";

export interface AppProps {
  gameDataResult: CreateGameDataResult;
  today: CalendarDate;
  launchDate: CalendarDate;
}

// The page the player sees: today's puzzle, or one plain message when there's
// none to show, whatever the reason. Moves arrive in 3.2.
export function App({ gameDataResult, today, launchDate }: AppProps) {
  const gameResult = gameDataResult.ok
    ? findGameForDate(today, launchDate, gameDataResult.gameData)
    : gameDataResult;

  return (
    <>
      <h1>Word Golf</h1>
      {gameResult.ok ? (
        <>
          <h2>Puzzle #{gameResult.puzzleNumber}</h2>
          <p>
            From {gameResult.game.start} to {gameResult.game.target}
          </p>
          <p>Par {gameResult.game.par}</p>
          <ol aria-label="Your chain">
            {gameResult.game.chain.map((word) => (
              <li key={word}>{word}</li>
            ))}
          </ol>
        </>
      ) : (
        <p>There&apos;s no puzzle today.</p>
      )}
    </>
  );
}
