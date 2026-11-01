import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createGameDataFromText } from "../../src/puzzles/createGameDataFromText";
import { App } from "../../src/ui/App";

// Chunk 3.1. With a launch on 15 January 2027, 16 January is puzzle #2, the
// schedule's second line: cold → warm (D15, D24). Its shortest path over the
// accepted words is cold → cord → card → ward → warm, 4 moves, so par is 6
// (D27). The puzzle words hold only start and target words, so par worked
// out over them would find no path (D8, D31).
const launchDate = { year: 2027, month: 1, day: 15 };
const dayAfterLaunch = { year: 2027, month: 1, day: 16 };
const gameDataResult = createGameDataFromText({
  acceptedWordsText: "cold\ncord\ncard\nward\nwarm\nlead\ngold\n",
  puzzleWordsText: "cold\nwarm\nlead\ngold\n",
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
