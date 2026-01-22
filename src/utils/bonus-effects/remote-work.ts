import { Board, Figure, Position, SpecialCell } from "types";
import { BOARD_ROWS } from "consts";
import { isTeamImage } from "@utils/game-utils";

const forbidden = new Set<Figure>([
  "star",
  "diamond",
  "goldenCell",
  "team",
  "teamCell",
  "teamImage0",
  "teamImage1",
  "teamImage2",
  "teamImage3",
] as Figure[]);

const isRemovable = (f: Figure | null) => {
  if (!f) return false;
  if (forbidden.has(f)) return false;
  if (isTeamImage(f)) return false;
  return true;
};

/** случайное удаление */
export const applyRemoteWorkEffect = (
  board: Board,
  specialCells: SpecialCell[] = []
): {
  board: Board;
  matchedPositions: Position[];
  removedFigures: Array<{ position: Position; figure: Figure }>;
  removedGoldenCells: Position[];
} => {
  const positions: Position[] = [];

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (isRemovable(board[r][c])) {
        positions.push({ row: r, col: c });
      }
    }
  }

  if (positions.length === 0) {
    return {
      board,
      matchedPositions: [],
      removedFigures: [],
      removedGoldenCells: [],
    };
  }

  const { row, col } = positions[Math.floor(Math.random() * positions.length)];
  const figure = board[row][col];

  const removedFigures: Array<{ position: Position; figure: Figure }> = [
    { position: { row, col }, figure: figure! },
  ];

  const removedGoldenCells: Position[] = [];

  for (let i = 0; i < specialCells.length; i++) {
    const sc = specialCells[i];
    if (
      sc.row === row &&
      sc.col === col &&
      sc.type === "golden" &&
      sc.isActive !== false
    ) {
      removedGoldenCells.push({ row, col });
      break;
    }
  }

  const newBoard = board.map((r) => [...r]);
  newBoard[row][col] = null;

  return {
    board: newBoard,
    matchedPositions: [{ row, col }],
    removedFigures,
    removedGoldenCells,
  };
};

/** удаление по выбранной клетке */
export const applyRemoteWorkAt = (
  board: Board,
  pos: Position,
  _secondPos?: Position,
  specialCells: SpecialCell[] = []
): {
  board: Board;
  matchedPositions: Position[];
  removedFigures: Array<{ position: Position; figure: Figure }>;
  removedGoldenCells: Position[];
} => {
  const { row, col } = pos;

  if (
    row < 0 ||
    col < 0 ||
    row >= BOARD_ROWS ||
    col >= (board[0]?.length ?? 0)
  ) {
    return {
      board,
      matchedPositions: [],
      removedFigures: [],
      removedGoldenCells: [],
    };
  }

  const figure = board[row][col];
  if (!isRemovable(figure)) {
    return {
      board,
      matchedPositions: [],
      removedFigures: [],
      removedGoldenCells: [],
    };
  }

  const removedFigures: Array<{ position: Position; figure: Figure }> = [
    { position: { row, col }, figure: figure! },
  ];

  const removedGoldenCells: Position[] = [];

  for (let i = 0; i < specialCells.length; i++) {
    const sc = specialCells[i];
    if (
      sc.row === row &&
      sc.col === col &&
      sc.type === "golden" &&
      sc.isActive !== false
    ) {
      removedGoldenCells.push({ row, col });
      break;
    }
  }

  const newBoard = board.map((r) => [...r]);
  newBoard[row][col] = null;

  return {
    board: newBoard,
    matchedPositions: [{ row, col }],
    removedFigures,
    removedGoldenCells,
  };
};
