import { render, screen, within } from "@testing-library/react";
import { userEvent, type UserEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  createGameDataFromText,
  type CreateGameDataResult,
} from "../../src/puzzles/createGameDataFromText";
import { App } from "../../src/ui/App";

// Chunk 3.1. With a launch on 15 January 2027, 16 January is puzzle #2, the
// schedule's second line: cold → warm (D15, D24). Its shortest path over the
// accepted words is cold → cord → card → ward → warm, 4 moves, so par is 6
// (D27). The puzzle words hold only start and target words, so par worked
// out over them would find no path (D8, D31). They also hold colt, which
// isn't an accepted word, so a move checked against them would be wrongly
// accepted (3.2).
const launchDate = { year: 2027, month: 1, day: 15 };
const dayAfterLaunch = { year: 2027, month: 1, day: 16 };
const gameDataResult = createGameDataFromText({
  acceptedWordsText: "cold\ncord\ncard\nward\nwarm\nlead\ngold\n",
  puzzleWordsText: "cold\nwarm\nlead\ngold\ncolt\n",
  scheduleText: "lead gold 3\ncold warm 4\n",
});
const noPuzzleMessage = "There's no puzzle today.";

describe("App", () => {
  it("shows the game's name as the page heading", () => {
    // Arrange
    const gameName = "Word Golf";

    // Act
    render(<App gameDataResult={gameDataResult} today={dayAfterLaunch} launchDate={launchDate} />);

    // Assert
    expect(screen.getByRole("heading", { level: 1, name: gameName })).toBeVisible();
  });

  it("shows today's puzzle number", () => {
    // Arrange
    const puzzleHeading = "Puzzle #2";

    // Act
    render(<App gameDataResult={gameDataResult} today={dayAfterLaunch} launchDate={launchDate} />);

    // Assert
    expect(screen.getByRole("heading", { level: 2, name: puzzleHeading })).toBeVisible();
  });

  it("shows the start and target words, start first", () => {
    // Arrange
    const startToTarget = "From cold to warm";

    // Act
    render(<App gameDataResult={gameDataResult} today={dayAfterLaunch} launchDate={launchDate} />);

    // Assert
    expect(screen.getByText(startToTarget)).toBeVisible();
  });

  it("shows par from the start of the game", () => {
    // Arrange
    const par = "Par 6";

    // Act
    render(<App gameDataResult={gameDataResult} today={dayAfterLaunch} launchDate={launchDate} />);

    // Assert
    expect(screen.getByText(par)).toBeVisible();
  });

  it("shows the chain so far as just the start word", () => {
    // Arrange
    const chainName = "Your chain";

    // Act
    render(<App gameDataResult={gameDataResult} today={dayAfterLaunch} launchDate={launchDate} />);

    // Assert
    const chain = screen.getByRole("list", { name: chainName });
    const chainWords = within(chain)
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(chainWords).toEqual(["cold"]);
  });

  it("doesn't say there's no puzzle when there is one", () => {
    // Arrange
    const today = dayAfterLaunch;

    // Act
    render(<App gameDataResult={gameDataResult} today={today} launchDate={launchDate} />);

    // Assert
    expect(screen.queryByText(noPuzzleMessage)).not.toBeInTheDocument();
  });

  it("tells the player there's no puzzle when the date is past the schedule", () => {
    // Arrange
    const thirdDay = { year: 2027, month: 1, day: 17 };

    // Act
    render(<App gameDataResult={gameDataResult} today={thirdDay} launchDate={launchDate} />);

    // Assert
    expect(screen.getByText(noPuzzleMessage)).toBeVisible();
  });

  it("tells the player there's no puzzle when the game data can't be read", () => {
    // Arrange
    // The accepted words link cold to warm, so the capital in the schedule
    // line is the only reason there's no puzzle.
    const unreadableGameData = createGameDataFromText({
      acceptedWordsText: "cold\ncord\ncard\nward\nwarm\n",
      puzzleWordsText: "cold\nwarm\n",
      scheduleText: "Cold warm 4\n",
    });

    // Act
    render(<App gameDataResult={unreadableGameData} today={launchDate} launchDate={launchDate} />);

    // Assert
    expect(screen.getByText(noPuzzleMessage)).toBeVisible();
  });
});

// Chunk 3.2. Today is puzzle #2, cold → warm. From cold, cord is one letter
// away and an accepted word; card is two letters away until cord is played.
// The input starts out holding the start word, so each move clears it first,
// as a player replaces the word (D36).
function renderTodaysPuzzle(todaysGameData: CreateGameDataResult = gameDataResult) {
  const user = userEvent.setup();
  render(<App gameDataResult={todaysGameData} today={dayAfterLaunch} launchDate={launchDate} />);
  const input = screen.getByRole("textbox", { name: "Next word" });
  return { user, input };
}

// Replaces the word in the input and presses Enter, as a player does.
async function playWord(user: UserEvent, input: HTMLElement, word: string) {
  await user.clear(input);
  await user.type(input, `${word}{Enter}`);
}

function getChainWords() {
  const chain = screen.getByRole("list", { name: "Your chain" });
  return within(chain)
    .getAllByRole("listitem")
    .map((item) => item.textContent);
}

describe("App: valid moves", () => {
  it("shows the move count as 0 before any move", () => {
    // Arrange
    const moveCount = "Moves 0";

    // Act
    renderTodaysPuzzle();

    // Assert
    expect(screen.getByText(moveCount)).toBeVisible();
  });

  it("adds a valid word to the chain", async () => {
    // Arrange
    const { user, input } = renderTodaysPuzzle();

    // Act
    await playWord(user, input, "cord");

    // Assert
    expect(getChainWords()).toEqual(["cold", "cord"]);
  });

  it("counts a valid word as a move", async () => {
    // Arrange
    const { user, input } = renderTodaysPuzzle();

    // Act
    await playWord(user, input, "cord");

    // Assert
    expect(screen.getByText("Moves 1")).toBeVisible();
  });

  it("adds each valid word after the one before", async () => {
    // Arrange
    // card is two letters from cold, so it's only valid after cord.
    const { user, input } = renderTodaysPuzzle();
    await playWord(user, input, "cord");

    // Act
    await playWord(user, input, "card");

    // Assert
    expect(getChainWords()).toEqual(["cold", "cord", "card"]);
  });

  it("plays a word typed in capitals as lowercase", async () => {
    // Arrange
    const { user, input } = renderTodaysPuzzle();

    // Act
    await playWord(user, input, "CORD");

    // Assert
    expect(getChainWords()).toEqual(["cold", "cord"]);
  });

  it("plays a word with a zero-width space in it", async () => {
    // Arrange
    const { user, input } = renderTodaysPuzzle();

    // Act
    await playWord(user, input, "co​rd");

    // Assert
    expect(getChainWords()).toEqual(["cold", "cord"]);
  });

  it("plays the word when the player clicks Play", async () => {
    // Arrange
    const { user, input } = renderTodaysPuzzle();
    await user.clear(input);
    await user.type(input, "cord");

    // Act
    await user.click(screen.getByRole("button", { name: "Play" }));

    // Assert
    expect(getChainWords()).toEqual(["cold", "cord"]);
  });

  it("starts the input holding the start word", () => {
    // Arrange
    const startWord = "cold";

    // Act
    const { input } = renderTodaysPuzzle();

    // Assert
    expect(input).toHaveValue(startWord);
  });

  it("shows the new word in the input after a valid move", async () => {
    // Arrange
    const { user, input } = renderTodaysPuzzle();

    // Act
    await playWord(user, input, "CORD");

    // Assert
    expect(input).toHaveValue("cord");
  });

  it("clears the reason for a rejected word after a valid move", async () => {
    // Arrange
    const { user, input } = renderTodaysPuzzle();
    await playWord(user, input, "card");

    // Act
    await playWord(user, input, "cord");

    // Assert
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});

describe("App: rejected words", () => {
  it("explains that the word must have as many letters as the start word", async () => {
    // Arrange
    // A 5-letter puzzle, so a message that always says 4 letters fails (D4).
    const fiveLetterGameData = createGameDataFromText({
      acceptedWordsText: "flame\nblame\n",
      puzzleWordsText: "flame\nblame\n",
      scheduleText: "flame blame 1\nflame blame 1\n",
    });
    const { user, input } = renderTodaysPuzzle(fiveLetterGameData);

    // Act
    await playWord(user, input, "flam");

    // Assert
    expect(screen.getByText("Use a 5-letter word.")).toBeVisible();
  });

  it("explains that only one letter can change", async () => {
    // Arrange
    const { user, input } = renderTodaysPuzzle();

    // Act
    await playWord(user, input, "card");

    // Assert
    expect(screen.getByText("Change exactly one letter.")).toBeVisible();
  });

  it("explains that a word isn't in the word list, even if it's a puzzle word", async () => {
    // Arrange
    // colt is a puzzle word but not an accepted word (D8).
    const { user, input } = renderTodaysPuzzle();

    // Act
    await playWord(user, input, "colt");

    // Assert
    expect(screen.getByText("colt isn't in the word list.")).toBeVisible();
  });

  it("explains that a word is already in the chain", async () => {
    // Arrange
    // From cord, cold is one letter away and an accepted word, but it's the start.
    const { user, input } = renderTodaysPuzzle();
    await playWord(user, input, "cord");

    // Act
    await playWord(user, input, "cold");

    // Assert
    expect(screen.getByText("cold is already in your chain.")).toBeVisible();
  });

  it("explains that only letters can be used, so a dotted capital I is rejected", async () => {
    // Arrange
    // İ lowercases to i plus a combining dot: two characters, which checkMove
    // alone would call the wrong length (1.5 review 6).
    const { user, input } = renderTodaysPuzzle();

    // Act
    await playWord(user, input, "cİrd");

    // Assert
    expect(screen.getByText("Use letters only.")).toBeVisible();
  });

  it("explains that the game is over once the target is reached", async () => {
    // Arrange
    // A one-move puzzle, cold → cord, won before the Act.
    const oneMoveGameData = createGameDataFromText({
      acceptedWordsText: "cold\ncord\n",
      puzzleWordsText: "cold\ncord\n",
      scheduleText: "cold cord 1\ncold cord 1\n",
    });
    const { user, input } = renderTodaysPuzzle(oneMoveGameData);
    await playWord(user, input, "cord");

    // Act
    await playWord(user, input, "cold");

    // Assert
    expect(screen.getByText("The game is over.")).toBeVisible();
  });

  it("doesn't change the chain or move count for a rejected word", async () => {
    // Arrange
    const { user, input } = renderTodaysPuzzle();

    // Act
    await playWord(user, input, "card");

    // Assert
    expect(getChainWords()).toEqual(["cold"]);
    expect(screen.getByText("Moves 0")).toBeVisible();
  });

  it("keeps a rejected word in the input to edit", async () => {
    // Arrange
    const { user, input } = renderTodaysPuzzle();

    // Act
    await playWord(user, input, "card");

    // Assert
    expect(input).toHaveValue("card");
  });

  it("ignores an empty submission", async () => {
    // Arrange
    const { user, input } = renderTodaysPuzzle();
    await user.clear(input);

    // Act
    await user.keyboard("{Enter}");

    // Assert
    expect(getChainWords()).toEqual(["cold"]);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});

describe("App: screen readers", () => {
  it("has a status region on the page before any word is rejected", () => {
    // Arrange
    const todaysGameData = gameDataResult;

    // Act
    renderTodaysPuzzle(todaysGameData);

    // Assert
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("announces the reason for a rejected word in the status region", async () => {
    // Arrange
    const { user, input } = renderTodaysPuzzle();

    // Act
    await playWord(user, input, "card");

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent("Change exactly one letter.");
  });
});
