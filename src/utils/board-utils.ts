import { Board, Figure, FigureType, Level } from "types";
import { BOARD_ROWS, BOARD_COLS } from "consts";
import { findAllMatches } from "@utils/game-utils";

const SPECIAL_FIGURES: readonly FigureType[] = [
  "goldenCell",
  "star",
  "diamond",
  "teamCell",
  "teamImage0",
  "teamImage1",
  "teamImage2",
  "teamImage3",
  "team",
];

const normalizeBoard = (inputBoard: Board): Board => {
  const normalized: Board = [];

  for (let row = 0; row < BOARD_ROWS; row++) {
    const rowData = inputBoard[row] || [];
    const normalizedRow = rowData.slice(0, BOARD_COLS);

    while (normalizedRow.length < BOARD_COLS) {
      normalizedRow.push(null);
    }

    normalized.push(normalizedRow);
  }

  return normalized;
};

export const shuffleBoardWithoutMatches = (
  originalBoard: Board,
  level?: Level
): Board => {
  const safeBoard = normalizeBoard(originalBoard).map((row) => [...row]);

  const movablePositions: Array<{ row: number; col: number }> = [];
  const movableFigures: Figure[] = [];

  const availableFigures =
    level?.availableFigures || [
      "roundMessage",
      "letter",
      "microphone",
      "star",
      "phone",
    ];

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const figure = safeBoard[row][col];
      if (!figure) continue;

      if (
        availableFigures.includes(figure.type) &&
        !SPECIAL_FIGURES.includes(figure.type)
      ) {
        movablePositions.push({ row, col });
        movableFigures.push(figure);
      }
    }
  }

  if (movableFigures.length <= 1) {
    return safeBoard;
  }

  const maxAttempts = 50;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const shuffledFigures = [...movableFigures];

    for (let i = shuffledFigures.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledFigures[i], shuffledFigures[j]] = [
        shuffledFigures[j],
        shuffledFigures[i],
      ];
    }

    const newBoard: Board = originalBoard.map((row) => [...row]);

    movablePositions.forEach((pos, index) => {
      newBoard[pos.row][pos.col] = shuffledFigures[index];
    });

    if (findAllMatches(newBoard).length === 0) {
      return newBoard;
    }

    attempts++;
  }

  return originalBoard;
};