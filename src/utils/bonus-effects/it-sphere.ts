import { Board, Figure, Position } from "types";
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

const isUsable = (f: Figure | null) => {
  if (!f) return false;
  if (forbidden.has(f)) return false;
  if (isTeamImage(f)) return false;
  return true;
};

/** legacy: удалить самый частый тип */
export const applyItSphereEffect = (board: Board): { board: Board, matchedPositions: Position[] } => {
  const freq = new Map<Figure, number>();

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const f = board[r][c];
      if (isUsable(f)) {
        freq.set(f as Figure, (freq.get(f as Figure) || 0) + 1);
      }
    }
  }

  let target: Figure | null = null;
  let max = -1;

  freq.forEach((count, fig) => {
    if (count > max) {
      max = count;
      target = fig;
    }
  });

  if (!target) return { board, matchedPositions: [] };

  const matchedPositions: Position[] = [];
  const newBoard = board.map((r) => [...r]);

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < newBoard[r].length; c++) {
      if (newBoard[r][c] === target) {
        matchedPositions.push({ row: r, col: c });
        newBoard[r][c] = null;
      }
    }
  }

  return { board: newBoard, matchedPositions };
};

/** удалить ВСЕ фигуры типа выбранной */
export const applyItSphereAt = (
  board: Board,
  pos: Position
): { board: Board, matchedPositions: Position[] } => {
  const { row, col } = pos;

  if (
    row < 0 ||
    col < 0 ||
    row >= BOARD_ROWS ||
    col >= (board[0]?.length ?? 0)
  ) {
    return { board, matchedPositions: [] };
  }

  const targetFig = board[row][col];
  if (!isUsable(targetFig)) return { board, matchedPositions: [] };

  const matchedPositions: Position[] = [];
  const newBoard = board.map((r) => [...r]);

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < newBoard[r].length; c++) {
      if (newBoard[r][c] === targetFig) {
        matchedPositions.push({ row: r, col: c });
        newBoard[r][c] = null;
      }
    }
  }

  return { board: newBoard, matchedPositions };
};