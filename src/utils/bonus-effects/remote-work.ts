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

const isRemovable = (f: Figure | null) => {
  if (!f) return false;
  if (forbidden.has(f)) return false;
  if (isTeamImage(f)) return false;
  return true;
};

/** случайное удаление */
export const applyRemoteWorkEffect = (board: Board): { board: Board, matchedPositions: Position[] } => {
  const positions: Position[] = [];

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (isRemovable(board[r][c])) {
        positions.push({ row: r, col: c });
      }
    }
  }

  if (positions.length === 0) return { board, matchedPositions: [] };

  const { row, col } =
    positions[Math.floor(Math.random() * positions.length)];

  const newBoard = board.map((r) => [...r]);
  newBoard[row][col] = null;

  return { board: newBoard, matchedPositions: [{ row, col }] };
};

/** удаление по выбранной клетке */
export const applyRemoteWorkAt = (
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

  if (!isRemovable(board[row][col])) return { board, matchedPositions: [] };

  const newBoard = board.map((r) => [...r]);
  newBoard[row][col] = null;

  return { board: newBoard, matchedPositions: [{ row, col }] };
};