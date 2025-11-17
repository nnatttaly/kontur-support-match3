import { Board, Figure, Level } from "types";
import { BOARD_ROWS, BOARD_COLS } from "consts";
import {
  findAllMatches,
  updateBoardAfterMatches,
  applyGravity,
  willCreateMatch,
} from "@utils/game-utils";
import { shuffleBoardWithoutMatches } from "@utils/board-utils";

export const createInitialBoard = (level?: Level): Board => {
  const board: Board = [];
  const availableFigures = level?.availableFigures || [
    "pencil",
    "questionBook",
    "openBook",
    "briefcase",
    "bonnet",
  ];


  for (let row = 0; row < BOARD_ROWS; row++) {
    const boardRow: (Figure | null)[] = [];
    for (let col = 0; col < BOARD_COLS; col++) {
      let figure: Figure;
      let attempts = 0;
      let validFigure = false;

      while (!validFigure && attempts < 50) {
        figure =
          availableFigures[Math.floor(Math.random() * availableFigures.length)];
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
        const randomFigure =
          availableFigures[Math.floor(Math.random() * availableFigures.length)];
        boardRow.push(randomFigure);

      }
    }
    board.push(boardRow);
  }

  const matches = findAllMatches(board);
  if (matches.length > 0) {
    return shuffleBoardWithoutMatches(board);
  }

  return board;
};

export const fillEmptySlots = (board: Board, level?: Level): Board => {
  const newBoard = board.map((row) => [...row]);
  const availableFigures = level?.availableFigures || [
    "pencil",
    "questionBook",
    "openBook",
    "briefcase",
    "bonnet",
  ];

  for (let col = 0; col < BOARD_COLS; col++) {
    for (let row = 0; row < BOARD_ROWS; row++) {
      if (newBoard[row][col] === null) {
        const randomFigure =
          availableFigures[Math.floor(Math.random() * availableFigures.length)];
        newBoard[row][col] = randomFigure;
      }
    }
  }

  return newBoard;
};

export {
  findAllMatches,
  updateBoardAfterMatches,
  applyGravity,
  willCreateMatch,
  shuffleBoardWithoutMatches,
};
