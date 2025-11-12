import { Board, Figure } from "types";
import { BOARD_ROWS, BOARD_COLS } from "consts";
import { findAllMatches } from "@utils/game-logic";

export const shuffleBoardWithoutMatches = (originalBoard: Board): Board => {
  const allFigures: Figure[] = [];

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const figure = originalBoard[row][col];
      if (figure) {
        allFigures.push(figure);
      }
    }
  }

  const shuffledFigures = [...allFigures];
  for (let i = shuffledFigures.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledFigures[i], shuffledFigures[j]] = [
      shuffledFigures[j],
      shuffledFigures[i],
    ];
  }

  const maxAttempts = 50;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const newBoard: Board = originalBoard.map((row) => [...row]);
    let figureIndex = 0;

    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        if (originalBoard[row][col] && figureIndex < shuffledFigures.length) {
          newBoard[row][col] = shuffledFigures[figureIndex];
          figureIndex++;
        }
      }
    }

    const matches = findAllMatches(newBoard);
    if (matches.length === 0) {
      return newBoard;
    }

    attempts++;

    for (let i = shuffledFigures.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledFigures[i], shuffledFigures[j]] = [
        shuffledFigures[j],
        shuffledFigures[i],
      ];
    }
  }

  return originalBoard;
};
