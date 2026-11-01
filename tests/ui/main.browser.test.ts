import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";

describe("main", () => {
  it("shows the heading once the entry file mounts the app", async () => {
    // Arrange
    // Browser mode runs tests in its own page, not index.html, so the test
    // adds the root that index.html provides (intent, least sure 1).
    const root = document.createElement("main");
    root.id = "app";
    document.body.append(root);

    // Act
    await import("../../src/main");

    // Assert
    await expect.element(page.getByRole("heading", { level: 1, name: "Word Golf" })).toBeVisible();
  });
});
