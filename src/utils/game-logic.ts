import { Board, Figure } from "types";
import { BOARD_ROWS, BOARD_COLS } from "consts";
import {
  getRandomFigure,
  findAllMatches,
  updateBoardAfterMatches,
  applyGravity,
  fillEmptySlots,
  willCreateMatch,
} from "./game-utils";

export const createInitialBoard = (): Board => {
  const board: Board = [];

  for (let row = 0; row < BOARD_ROWS; row++) {
    const boardRow: (Figure | null)[] = [];
    for (let col = 0; col < BOARD_COLS; col++) {
      let figure: Figure;
      let attempts = 0;
      let validFigure = false;

      while (!validFigure && attempts < 50) {
        figure = getRandomFigure();
        attempts++;

        const horizontalMatch =
          col >= 2 &&
          boardRow[col - 1] === figure &&
          boardRow[col - 2] === figure;

        const verticalMatch =
          row >= 2 &&
          board[row - 1]?.[col] === figure &&
          board[row - 2]?.[col] === figure;

        if (!horizontalMatch && !verticalMatch) {
          validFigure = true;
          boardRow.push(figure);
        }
      }

      if (!validFigure) {
        boardRow.push(getRandomFigure());
      }
    }
    board.push(boardRow);
  }

  return board;
};

export {
  getRandomFigure,
  findAllMatches,
  updateBoardAfterMatches,
  applyGravity,
  fillEmptySlots,
  willCreateMatch,
};
