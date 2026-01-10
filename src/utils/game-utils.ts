import { Board, Position, Match, Figure } from "types";
import { BOARD_ROWS, BOARD_COLS, MIN_MATCH_LENGTH } from "consts";

export const willCreateMatch = (
  board: Board,
  pos1: Position,
  pos2: Position
): boolean => {
  if (!board[pos1.row][pos1.col] || !board[pos2.row][pos2.col]) {
    return false;
  }

  const testBoard = board.map((row) => [...row]);
  const temp = testBoard[pos1.row][pos1.col];
  testBoard[pos1.row][pos1.col] = testBoard[pos2.row][pos2.col];
  testBoard[pos2.row][pos2.col] = temp;

  const matches = findAllMatches(testBoard);

  return matches.length > 0;
};

export const isTeamImage = (figure: string | null): boolean => {
  if (!figure) return false;
  return figure === "teamImage0" || 
         figure === "teamImage1" || 
         figure === "teamImage2" || 
         figure === "teamImage3";
};

export const isBigFigure = (figure: Figure | null): boolean => {
  if (!figure) return false;
  return figure === "team" || isTeamImage(figure);
};

export const isSpecialFigure = (figure: Figure | null): boolean => {
  if (!figure) return false;
  return figure === "team" || 
         figure === "teamCell" ||
         figure === "goldenCell" ||
         figure === "diamond" ||
         figure === "star" ||
         isTeamImage(figure);
};

export const findAllMatches = (board: Board): Match[] => {
  const matches: Match[] = [];

  for (let row = 0; row < BOARD_ROWS; row++) {
    let col = 0;
    while (col < BOARD_COLS - 2) {
      const figure = board[row][col];
      if (!figure || figure === "star" || board[row][col] === "diamond" || figure === "team" || isTeamImage(figure)) {
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
      if (!figure || figure === "star" || board[row][col] === "diamond" || figure === "team" || isTeamImage(figure)) {
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

export const updateBoardAfterMatches = (board: Board): Board => {
  const newBoard = board.map((row) => [...row]);
  const matches = findAllMatches(newBoard);

  matches.forEach((match) => {
    match.positions.forEach(({ row, col }) => {
      const figure = newBoard[row][col];
      if (figure !== "teamCell") {
        newBoard[row][col] = null;
      }
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
      } else if (newBoard[row][col] === "team" || isTeamImage(newBoard[row][col])) {
        emptySlots = 0;
      } else if (emptySlots > 0) {
        newBoard[row + emptySlots][col] = newBoard[row][col];
        newBoard[row][col] = null;
      }
    }
  }

  return newBoard;
};

export const applyHorizontalGravity = (board: Board): {board: Board, isChanged: boolean} => {
  const newBoard: Board = board.map(row => [...row]);
  let isChanged = false;
  for (const rowIndex of [5, 4]) {
    if (rowIndex >= BOARD_ROWS) continue;

    const row = [...newBoard[rowIndex]];

    // Проходим слева направо, затем справа налево для корректного смещения
    for (let col = 3; col < BOARD_COLS; col++) {
      const cell = row[col];
      if (!cell || cell === "teamCell" || cell === "team" || isTeamImage(cell)) continue;

      let targetCol = 3;

      if (col === targetCol) continue;

      // Определяем шаг: +1 если двигаемся вправо, -1 если влево
      const step = -1;
      let currentCol = col;

      while (currentCol !== targetCol) {
        const nextCol = currentCol + step;

        if (!row[nextCol]) {
          row[nextCol] = row[currentCol];
          row[currentCol] = null;
          currentCol = nextCol;
          isChanged = true;
        } else {
          // следующая клетка занята — останавливаемся
          break;
        }
      }
    }

    for (let col = 2; col >=0; col--) {
      const cell = row[col];
      if (!cell || cell === "teamCell" || cell === "team" || isTeamImage(cell)) continue;

      let targetCol = 2;

      if (col === targetCol) continue;

      // Определяем шаг: +1 если двигаемся вправо, -1 если влево
      const step = 1;
      let currentCol = col;

      while (currentCol !== targetCol) {
        const nextCol = currentCol + step;

        if (!row[nextCol]) {
          row[nextCol] = row[currentCol];
          row[currentCol] = null;
          currentCol = nextCol;
          isChanged = true;
        } else {
          // следующая клетка занята — останавливаемся
          break;
        }
      }
    }

    newBoard[rowIndex] = row;
  }

  return {board: newBoard, isChanged};
};

export const isValidPosition = (position: Position): boolean => {
  return (
    position.row >= 0 &&
    position.row < BOARD_ROWS &&
    position.col >= 0 &&
    position.col < BOARD_COLS
  );
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
