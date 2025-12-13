import { Board, Figure, Level, Position } from "types";
import { BOARD_ROWS, BOARD_COLS } from "consts";
import {
  findAllMatches,
  updateBoardAfterMatches,
  applyGravity,
  willCreateMatch,
  applyHorizontalGravity,
  isTeamImage
} from "@utils/game-utils";
import { shuffleBoardWithoutMatches } from "@utils/board-utils";

export const createInitialBoard = (level?: Level): Board => {
  const board: Board = Array(BOARD_ROWS)
    .fill(null)
    .map(() => Array(BOARD_COLS).fill(null));

  const availableFigures = level?.availableFigures || [
    "pencil",
    "questionBook",
    "openBook",
    "briefcase",
    "bonnet",
  ];
  

  if (level?.starPositions) {
    level.starPositions.forEach((position: Position) => {
      if (position.row < BOARD_ROWS && position.col < BOARD_COLS) {
        board[position.row][position.col] = "star";
      }
    });
  }
  if (level?.diamondPositions) {
    level.diamondPositions.forEach((position: Position) => {
      if (position.row < BOARD_ROWS && position.col < BOARD_COLS) {
        board[position.row][position.col] = "diamond";
      }
    });
  }
  if (level?.teamPositions) {
    level.teamPositions.forEach((position: Position) => {
      if (position.row < BOARD_ROWS && position.col < BOARD_COLS) {
        board[position.row][position.col] = "team";
      }
    });
  }

  if (level?.teamImagePosition) {
        board[level.teamImagePosition.row][level.teamImagePosition.col] = "teamImage0";
  }

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      if (board[row][col] === "star" || board[row][col] === "diamond" || board[row][col] === "team" ||
          isTeamImage(board[row][col])) continue;

      let figure: Figure;
      let attempts = 0;
      let validFigure = false;

      while (!validFigure && attempts < 50) {
        figure =
          availableFigures[Math.floor(Math.random() * availableFigures.length)];
        attempts++;

        if (figure === "star" || board[row][col] === "diamond" ||  figure === "team" ||  isTeamImage(figure)) continue;

        const horizontalMatch =
          col >= 2 &&
          board[row][col - 1] === figure &&
          board[row][col - 2] === figure;

        const verticalMatch =
          row >= 2 &&
          board[row - 1]?.[col] === figure &&
          board[row - 2]?.[col] === figure;

        if (!horizontalMatch && !verticalMatch) {
          validFigure = true;
          board[row][col] = figure;
        }
      }

      if (!validFigure) {
        const randomFigure =
          availableFigures[Math.floor(Math.random() * availableFigures.length)];
        board[row][col] = randomFigure === "star" || randomFigure === "diamond" || randomFigure === "team" ||
                          isTeamImage(randomFigure) ? "pencil" : randomFigure;
      }
    }
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
        const figuresWithoutStarsAndDiamondsAndTeam = availableFigures.filter(
          (fig) => fig !== "star" && fig != "diamond" && fig !== "team" && !isTeamImage(fig)
        );
        const randomFigure =
          figuresWithoutStarsAndDiamondsAndTeam[
            Math.floor(Math.random() * figuresWithoutStarsAndDiamondsAndTeam.length)
          ];
        newBoard[row][col] = randomFigure;
      } else {
        break;
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
  applyHorizontalGravity,
};
