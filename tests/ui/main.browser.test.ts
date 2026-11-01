import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import indexHtml from "../../index.html?raw";
import { launchDate } from "../../src/puzzles/launchDate";

// Browser mode runs tests in its own page, not index.html, so the tests read
// index.html itself: a renamed root or a wrong script path fails (3.0 review, 1).
function parseIndexHtml() {
  return new DOMParser().parseFromString(indexHtml, "text/html");
}

// The entry file mounts the app once per page, so it's imported once, here,
// with the clock set to noon on the day after launch: today is then puzzle #2
// whatever the real date (D15). Not the launch date itself, where passing the
// launch date as today would pass too. Noon keeps it the same day in any
// timezone.
const dayAfterLaunchNoon = new Date(launchDate.year, launchDate.month - 1, launchDate.day + 1, 12);

beforeAll(async () => {
  vi.setSystemTime(dayAfterLaunchNoon);
  const indexPage = parseIndexHtml();
  document.body.innerHTML = indexPage.body.innerHTML;
  const entryFile = indexPage.querySelector("script[type=module]")?.getAttribute("src") ?? "";
  await import(/* @vite-ignore */ entryFile);
});

afterAll(() => {
  vi.useRealTimers();
});

describe("main", () => {
  it("shows the heading once the entry file mounts the app", async () => {
    // Arrange
    const gameName = "Word Golf";

    // Act
    const heading = page.getByRole("heading", { level: 1, name: gameName });

    // Assert
    await expect.element(heading).toBeVisible();
  });

  it("shows puzzle #2 when the entry file mounts the app the day after launch", async () => {
    // Arrange
    const puzzleHeading = "Puzzle #2";

    // Act
    const heading = page.getByRole("heading", { level: 2, name: puzzleHeading });

    // Assert
    await expect.element(heading).toBeVisible();
  });

  it("shows the game's name in the browser tab", () => {
    // Arrange
    const gameName = "Word Golf";

    // Act
    const indexPage = parseIndexHtml();

    // Assert
    expect(indexPage.title).toBe(gameName);
  });
});
