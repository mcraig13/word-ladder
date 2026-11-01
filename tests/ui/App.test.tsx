import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../../src/ui/App";

describe("App", () => {
  it("shows the game's name as the page heading", () => {
    // Arrange
    const gameName = "Word Golf";

    // Act
    render(<App />);

    // Assert
    expect(screen.getByRole("heading", { level: 1, name: gameName })).toBeVisible();
  });

  it("tells the player the game is coming soon", () => {
    // Arrange
    const message = "Coming soon.";

    // Act
    render(<App />);

    // Assert
    expect(screen.getByText(message)).toBeVisible();
  });
});
