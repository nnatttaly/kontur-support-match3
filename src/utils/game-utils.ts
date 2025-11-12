import { Board, Position, Match } from "types";
import { BOARD_ROWS, BOARD_COLS, MIN_MATCH_LENGTH } from "consts";
import { getRandomFigure } from "@utils/common-utils";

export const isValidPosition = (position: Position): boolean => {
  return (
    position.row >= 0 &&
    position.row < BOARD_ROWS &&
    position.col >= 0 &&
    position.col < BOARD_COLS
  );
};

export const findAllMatches = (board: Board): Match[] => {
  const matches: Match[] = [];

  for (let row = 0; row < BOARD_ROWS; row++) {
    let col = 0;
    while (col < BOARD_COLS - 2) {
      const figure = board[row][col];
      if (!figure) {
        col++;
        continue;
      }

      let matchLength = 1;
      while (
        col + matchLength < BOARD_COLS &&
        board[row][col + matchLength] === figure
      ) {
        matchLength++;
      }

      if (matchLength >= MIN_MATCH_LENGTH) {
        const positions: Position[] = [];
        for (let i = 0; i < matchLength; i++) {
          positions.push({ row, col: col + i });
        }
        matches.push({ positions, figure });
        col += matchLength;
      } else {
        col++;
      }
    }
  }

  for (let col = 0; col < BOARD_COLS; col++) {
    let row = 0;
    while (row < BOARD_ROWS - 2) {
      const figure = board[row][col];
      if (!figure) {
        row++;
        continue;
      }

      let matchLength = 1;
      while (
        row + matchLength < BOARD_ROWS &&
        board[row + matchLength][col] === figure
      ) {
        matchLength++;
      }

      if (matchLength >= MIN_MATCH_LENGTH) {
        const positions: Position[] = [];
        for (let i = 0; i < matchLength; i++) {
          positions.push({ row: row + i, col });
        }
        matches.push({ positions, figure });
        row += matchLength; 
      } else {
        row++;
      }
    }
  }

  return matches;
};

export const getUniquePositions = (matches: Match[]): Position[] => {
  const uniquePositions = new Set<string>();
  const positions: Position[] = [];

  matches.forEach((match) => {
    match.positions.forEach((position) => {
      const key = `${position.row}-${position.col}`;
      if (!uniquePositions.has(key)) {
        uniquePositions.add(key);
        positions.push(position);
      }
    });
  });

  return positions;
};

export const willCreateMatch = (board: Board, pos1: Position, pos2: Position): boolean => {
  if (!board[pos1.row][pos1.col] || !board[pos2.row][pos2.col]) {
    return false;
  }

  const testBoard = board.map(row => [...row]);
  const temp = testBoard[pos1.row][pos1.col];
  testBoard[pos1.row][pos1.col] = testBoard[pos2.row][pos2.col];
  testBoard[pos2.row][pos2.col] = temp;

  const matches = findAllMatches(testBoard);
  
  return matches.length > 0;
};

export const updateBoardAfterMatches = (board: Board): Board => {
  const newBoard = board.map(row => [...row]);
  const matches = findAllMatches(newBoard);
  
  
  matches.forEach(match => {
    match.positions.forEach(({ row, col }) => {
      newBoard[row][col] = null;
    });
  });

  return newBoard;
};

export const applyGravity = (board: Board): Board => {
  const newBoard = board.map((row) => [...row]);

  for (let col = 0; col < BOARD_COLS; col++) {
    let emptySlots = 0;

    for (let row = BOARD_ROWS - 1; row >= 0; row--) {
      if (newBoard[row][col] === null) {
        emptySlots++;
      } else if (emptySlots > 0) {
        newBoard[row + emptySlots][col] = newBoard[row][col];
        newBoard[row][col] = null;
      }
    }
  }

  return newBoard;
};

export const fillEmptySlots = (board: Board): Board => {
  const newBoard = board.map((row) => [...row]);

  for (let col = 0; col < BOARD_COLS; col++) {
    for (let row = 0; row < BOARD_ROWS; row++) {
      if (newBoard[row][col] === null) {
        newBoard[row][col] = getRandomFigure();
      }
    }
  }

  return newBoard;
};
