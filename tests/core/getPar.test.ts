import { describe, expect, it } from "vitest";
import { getPar } from "../../src/core/getPar";

// Chunk 1.10. Rule: par is 1.5 × the moves in a shortest path, rounded up
// (D27). cold → cord → card → ward → warm is a shortest path of 4 moves.

describe("getPar", () => {
  it("par is 1.5 × the moves in a shortest path", () => {
    // Arrange
    const shortestPathMoves = 4;

    // Act
    const par = getPar(shortestPathMoves);

    // Assert
    expect(par).toBe(6);
  });

  it("par rounds up when the shortest path is odd", () => {
    // Arrange
    // 1.5 × 5 is 7.5.
    const shortestPathMoves = 5;

    // Act
    const par = getPar(shortestPathMoves);

    // Assert
    expect(par).toBe(8);
  });

  it("a one-move shortest path still leaves a move under par", () => {
    // Arrange
    // 1.5 × 1 is 1.5, the smallest puzzle there can be.
    const shortestPathMoves = 1;

    // Act
    const par = getPar(shortestPathMoves);

    // Assert
    expect(par).toBe(2);
  });
});
