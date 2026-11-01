import { useState, type SubmitEvent } from "react";
import { applyMove, type ApplyMoveResult } from "../core/applyMove";
import type { Dictionary } from "../core/createDictionaryFromWords";
import type { Game } from "../core/createGame";
import { normaliseWord } from "../core/normaliseWord";
import type { CreateGameDataResult } from "../puzzles/createGameDataFromText";
import { findGameForDate } from "../puzzles/findGameForDate";
import type { CalendarDate } from "../puzzles/getPuzzleNumber";
import { cleanUpTypedWord } from "./cleanUpTypedWord";

export interface AppProps {
  gameDataResult: CreateGameDataResult;
  today: CalendarDate;
  launchDate: CalendarDate;
}

// The page the player sees: today's puzzle, or one plain message when there's
// none to show, whatever the reason.
export function App({ gameDataResult, today, launchDate }: AppProps) {
  // Finding the game searches for a shortest path, so it runs once, not on
  // every render (carried forward from 3.1).
  const [gameResult] = useState(() =>
    gameDataResult.ok
      ? findGameForDate(today, launchDate, gameDataResult.gameData)
      : gameDataResult,
  );

  return (
    <>
      <h1>Word Golf</h1>
      {gameResult.ok && gameDataResult.ok ? (
        <TodaysGame
          puzzleNumber={gameResult.puzzleNumber}
          firstGame={gameResult.game}
          acceptedWords={gameDataResult.gameData.acceptedWords}
        />
      ) : (
        <p>There&apos;s no puzzle today.</p>
      )}
    </>
  );
}

interface TodaysGameProps {
  puzzleNumber: number;
  firstGame: Game;
  acceptedWords: Dictionary;
}

type MoveRejection = Extract<ApplyMoveResult, { ok: false }>["reason"] | "not-letters";

function TodaysGame({ puzzleNumber, firstGame, acceptedWords }: TodaysGameProps) {
  const [game, setGame] = useState(firstGame);
  // The input starts as a copy of the last word, since a move changes one
  // letter of it (D36).
  const [typedWord, setTypedWord] = useState(firstGame.start);
  const [rejectionMessage, setRejectionMessage] = useState("");

  function playTypedWord(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalised = normaliseWord(cleanUpTypedWord(typedWord));
    if (!normalised.ok) {
      // An empty word isn't a move, and there's nothing to explain.
      if (normalised.reason === "not-letters") {
        setRejectionMessage(getRejectionMessage(normalised.reason, typedWord, game));
      }
      return;
    }
    // Moves are checked against the accepted words, never the puzzle words (D8).
    const move = applyMove(game, normalised.word, acceptedWords);
    if (!move.ok) {
      setRejectionMessage(getRejectionMessage(move.reason, normalised.word, game));
      return;
    }
    setGame(move.game);
    setTypedWord(normalised.word);
    setRejectionMessage("");
  }

  return (
    <>
      <h2>Puzzle #{puzzleNumber}</h2>
      <p>
        From {game.start} to {game.target}
      </p>
      <p>Par {game.par}</p>
      <p>Moves {game.chain.length - 1}</p>
      <ol aria-label="Your chain">
        {game.chain.map((word) => (
          <li key={word}>{word}</li>
        ))}
      </ol>
      <form onSubmit={playTypedWord}>
        <label>
          Next word{" "}
          <input
            value={typedWord}
            onChange={(event) => {
              setTypedWord(event.target.value);
            }}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        </label>
        <button type="submit">Play</button>
      </form>
      {/* On the page from the start, so screen readers announce text added to it. */}
      <p role="status">{rejectionMessage}</p>
    </>
  );
}

// One message per reason; a new reason fails the type-check until it has one.
function getRejectionMessage(reason: MoveRejection, word: string, game: Game): string {
  switch (reason) {
    case "wrong-length":
      // Word length comes from the puzzle, not a fixed 4 (D4).
      return `Use a ${String(game.start.length)}-letter word.`;
    case "not-one-change":
      return "Change exactly one letter.";
    case "not-a-word":
      return `${word} isn't in the word list.`;
    case "repeated-word":
      return `${word} is already in your chain.`;
    case "not-letters":
      return "Use letters only.";
    case "game-over":
      return "The game is over.";
  }
}
