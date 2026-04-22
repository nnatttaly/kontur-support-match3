import {
  Board,
  Figure,
  FigureType,
  Level,
  Position,
  createFigure,
} from "types";
import { BOARD_ROWS, BOARD_COLS } from "consts";
import {
  applyGravity,
  findAllMatches,
  getUniquePositions,
  isBigFigure,
  isSpecialFigure,
  isTeamImage,
  isValidPosition,
  updateBoardAfterMatches,
} from "@utils/game-utils";

export {
  applyGravity,
  findAllMatches,
  getUniquePositions,
  isBigFigure,
  isSpecialFigure,
  isTeamImage,
  isValidPosition,
  updateBoardAfterMatches,
};

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

const SPECIAL_FIGURES: FigureType[] = [
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

const isFixedFigure = (figure: Figure | null): boolean => {
  if (!figure) return false;
  return SPECIAL_FIGURES.includes(figure.type);
};

const makeStableFigure = (type: FigureType, row: number, col: number) =>
  createFigure(type, `${type}-${row}-${col}`);

export const createInitialBoard = (level?: Level): Board => {
  const availableFigures = level?.availableFigures || [
    "pencil",
    "questionBook",
    "openBook",
    "briefcase",
    "bonnet",
  ];

  const normalizedFigures = availableFigures.filter(
    (fig) => !SPECIAL_FIGURES.includes(fig)
  );

  const generateBoard = (): Board => {
    const board: Board = Array.from({ length: BOARD_ROWS }, () =>
      Array.from({ length: BOARD_COLS }, () => null)
    );

    if (level?.starPositions) {
      level.starPositions.forEach((position: Position) => {
        if (position.row < BOARD_ROWS && position.col < BOARD_COLS) {
          board[position.row][position.col] = makeStableFigure(
            "star",
            position.row,
            position.col
          );
        }
      });
    }

    if (level?.diamondPositions) {
      level.diamondPositions.forEach((position: Position) => {
        if (position.row < BOARD_ROWS && position.col < BOARD_COLS) {
          board[position.row][position.col] = makeStableFigure(
            "diamond",
            position.row,
            position.col
          );
        }
      });
    }

    if (level?.teamPositions) {
      level.teamPositions.forEach((position: Position) => {
        if (position.row < BOARD_ROWS && position.col < BOARD_COLS) {
          board[position.row][position.col] = makeStableFigure(
            "team",
            position.row,
            position.col
          );
        }
      });
    }

    if (level?.teamImagePosition) {
      if (
        level.teamImagePosition.row < BOARD_ROWS &&
        level.teamImagePosition.col < BOARD_COLS
      ) {
        board[level.teamImagePosition.row][level.teamImagePosition.col] =
          makeStableFigure(
            "teamImage0",
            level.teamImagePosition.row,
            level.teamImagePosition.col
          );
      }
    }

    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        if (board[row][col] !== null) continue;

        let chosen: FigureType | null = null;
        const candidates = [...normalizedFigures];
        let safety = 0;

        while (chosen === null && candidates.length > 0 && safety < 100) {
          safety++;
          const index = Math.floor(Math.random() * candidates.length);
          const candidate = candidates[index];

          const horizontalMatch =
            col >= 2 &&
            board[row][col - 1]?.type === candidate &&
            board[row][col - 2]?.type === candidate;

          const verticalMatch =
            row >= 2 &&
            board[row - 1][col]?.type === candidate &&
            board[row - 2][col]?.type === candidate;

          if (!horizontalMatch && !verticalMatch) {
            chosen = candidate;
            break;
          }

          candidates.splice(index, 1);
        }

        board[row][col] = chosen
          ? createFigure(chosen)
          : createFigure(
              normalizedFigures[Math.floor(Math.random() * normalizedFigures.length)]
            );
      }
    }

    return board;
  };

  let newBoard = generateBoard();

  let matches = findAllMatches(newBoard);
  if (matches.length > 0) {
    for (let attempt = 0; attempt < 30 && matches.length > 0; attempt++) {
      newBoard = generateBoard();
      matches = findAllMatches(newBoard);
    }
  }

  if (findAllMatches(newBoard).length > 0) {
    newBoard = shuffleBoardWithoutMatches(newBoard, level);
  }

  if (findAllMatches(newBoard).length > 0) {
    return createInitialBoard(level);
  }

  return normalizeBoard(newBoard);
};

export const fillEmptySlots = (board: Board, level?: Level): Board => {
  const newBoard = normalizeBoard(board);

  const availableFigures = level?.availableFigures || [
    "pencil",
    "questionBook",
    "openBook",
    "briefcase",
    "bonnet",
  ];

  const figuresWithoutSpecials = availableFigures.filter(
    (fig) =>
      fig !== "star" &&
      fig !== "diamond" &&
      fig !== "team" &&
      !isTeamImage(fig)
  );

  for (let col = 0; col < BOARD_COLS; col++) {
    if (newBoard[0][col] === null) {
      const randomFigure =
        figuresWithoutSpecials[
          Math.floor(Math.random() * figuresWithoutSpecials.length)
        ];
      newBoard[0][col] = createFigure(randomFigure);
    }
  }

  return normalizeBoard(newBoard);
};

export const applyHorizontalGravity = (
  board: Board
): { board: Board; isChanged: boolean } => {
  const newBoard: Board = normalizeBoard(board).map((row) => [...row]);
  let isChanged = false;

  const TARGET_LEFT = 2;
  const TARGET_RIGHT = 3;
  const ROWS_TO_PROCESS = [BOARD_ROWS - 1, BOARD_ROWS - 2];

  for (const rowIndex of ROWS_TO_PROCESS) {
    if (rowIndex < 0 || rowIndex >= BOARD_ROWS) continue;

    const row = [...newBoard[rowIndex]];
    const cellsInvolved = new Set<number>();

    type Move = { from: number; to: number; figure: Figure };
    const moves: Move[] = [];

    for (let col = TARGET_RIGHT + 1; col < BOARD_COLS - 1; col++) {
      const cell = row[col];
      if (
        !cell ||
        cell.type === "teamCell" ||
        cell.type === "team" ||
        cell.type === "goldenCell" ||
        isTeamImage(cell)
      ) {
        continue;
      }

      const targetCol = col - 1;
      if (!row[targetCol] && !cellsInvolved.has(col) && !cellsInvolved.has(targetCol)) {
        moves.push({ from: col, to: targetCol, figure: cell });
      }
    }

    for (let col = TARGET_LEFT - 1; col >= 1; col--) {
      const cell = row[col];
      if (
        !cell ||
        cell.type === "teamCell" ||
        cell.type === "team" ||
        cell.type === "goldenCell" ||
        isTeamImage(cell)
      ) {
        continue;
      }

      const targetCol = col + 1;
      if (!row[targetCol] && !cellsInvolved.has(col) && !cellsInvolved.has(targetCol)) {
        moves.push({ from: col, to: targetCol, figure: cell });
      }
    }

    for (const move of moves) {
      if (cellsInvolved.has(move.from) || cellsInvolved.has(move.to)) continue;
      if (row[move.to] !== null) continue;

      row[move.to] = move.figure;
      row[move.from] = null;

      cellsInvolved.add(move.from);
      cellsInvolved.add(move.to);
      isChanged = true;
    }

    newBoard[rowIndex] = row;
  }

  return { board: normalizeBoard(newBoard), isChanged };
};

export const applyGravityFillLoop = (inputBoard: Board, level?: Level): Board => {
  let board = normalizeBoard(inputBoard);
  let iterations = 0;
  const maxIterations = 50;

  while (
    board.some((row) => row.some((cell) => cell === null)) &&
    iterations < maxIterations
  ) {
    board = applyGravity(board);
    board = fillEmptySlots(board, level);
    iterations++;
  }

  return normalizeBoard(board);
};

export const hasPossibleMoves = (board: Board): boolean => {
  const safeBoard = normalizeBoard(board);
  const rows = safeBoard.length;
  const cols = safeBoard[0].length;

  const UNMOVABLE_FIGURES: FigureType[] = [
    "team",
    "teamImage0",
    "teamImage1",
    "teamImage2",
    "teamImage3",
    "goldenCell",
  ];

  const canSwapFigure = (figure: Figure | null): boolean => {
    if (!figure) return false;
    if (UNMOVABLE_FIGURES.includes(figure.type)) return false;
    return true;
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const currentFigure = safeBoard[row][col];
      if (!canSwapFigure(currentFigure)) continue;

      if (col < cols - 1) {
        const rightFigure = safeBoard[row][col + 1];
        if (canSwapFigure(rightFigure)) {
          if (currentFigure?.type === "star" && rightFigure?.type === "star") continue;
          if (currentFigure?.type === "diamond" && rightFigure?.type === "diamond") continue;

          const tempBoard = safeBoard.map((r) => [...r]);
          tempBoard[row][col] = rightFigure;
          tempBoard[row][col + 1] = currentFigure;

          if (findAllMatches(tempBoard).length > 0) return true;
        }
      }

      if (row < rows - 1) {
        const bottomFigure = safeBoard[row + 1][col];
        if (canSwapFigure(bottomFigure)) {
          if (currentFigure?.type === "star" && bottomFigure?.type === "star") continue;
          if (currentFigure?.type === "diamond" && bottomFigure?.type === "diamond") continue;

          const tempBoard = safeBoard.map((r) => [...r]);
          tempBoard[row][col] = bottomFigure;
          tempBoard[row + 1][col] = currentFigure;

          if (findAllMatches(tempBoard).length > 0) return true;
        }
      }
    }
  }

  return false;
};

export const shuffleBoardWithoutMatches = (
  board: Board,
  _level?: Level
): Board => {
  const safeBoard = normalizeBoard(board).map((row) => [...row]);

  const movablePositions: Position[] = [];
  const movableFigures: Figure[] = [];

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const cell = safeBoard[row][col];
      if (!cell) continue;
      if (isFixedFigure(cell)) continue;

      movablePositions.push({ row, col });
      movableFigures.push(cell);
    }
  }

  if (movableFigures.length <= 1) {
    return safeBoard;
  }

  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shuffled = [...movableFigures];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const nextBoard = normalizeBoard(safeBoard).map((row) => [...row]);
    movablePositions.forEach((pos, index) => {
      nextBoard[pos.row][pos.col] = shuffled[index];
    });

    if (findAllMatches(nextBoard).length === 0) {
      return nextBoard;
    }
  }

  return safeBoard;
};

export const willCreateMatch = (
  board: Board,
  pos1: Position,
  pos2: Position,
  _level?: Level
): boolean => {
  const safeBoard = normalizeBoard(board);

  if (!safeBoard[pos1.row]?.[pos1.col] || !safeBoard[pos2.row]?.[pos2.col]) {
    return false;
  }

  const testBoard = safeBoard.map((row) => [...row]);
  const temp = testBoard[pos1.row][pos1.col];
  testBoard[pos1.row][pos1.col] = testBoard[pos2.row][pos2.col];
  testBoard[pos2.row][pos2.col] = temp;

  return findAllMatches(testBoard).length > 0;
};