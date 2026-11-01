import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import indexHtml from "../../index.html?raw";

// Browser mode runs tests in its own page, not index.html, so the tests read
// index.html itself: a renamed root or a wrong script path fails (3.0 review, 1).
function parseIndexHtml() {
  return new DOMParser().parseFromString(indexHtml, "text/html");
}

describe("main", () => {
  it("shows the heading once the entry file mounts the app", async () => {
    // Arrange
    const indexPage = parseIndexHtml();
    document.body.innerHTML = indexPage.body.innerHTML;
    const entryFile = indexPage.querySelector("script[type=module]")?.getAttribute("src") ?? "";

    // Act
    await import(/* @vite-ignore */ entryFile);

    // Assert
    await expect.element(page.getByRole("heading", { level: 1, name: "Word Golf" })).toBeVisible();
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
