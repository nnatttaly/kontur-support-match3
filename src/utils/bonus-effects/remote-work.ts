import { Board, Figure, Position } from "types";
import { BOARD_ROWS } from "consts";
import { isTeamImage } from "@utils/game-utils";
import {
  findAllMatches,
  updateBoardAfterMatches,
  applyGravity,
  fillEmptySlots,
} from "@utils/game-logic";

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

const processBoardAfterChanges = (board: Board): Board => {
  let b = board;
  b = applyGravity(b);
  b = fillEmptySlots(b);
  // цикл: пока есть матчи — удаляем их, гравитация, заполнение
  while (findAllMatches(b).length > 0) {
    b = updateBoardAfterMatches(b);
    b = applyGravity(b);
    b = fillEmptySlots(b);
  }
  return b;
};

/** случайное удаление (backwards compat) */
export const applyRemoteWorkEffect = (board: Board): Board => {
  const positions: Position[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (isRemovable(board[r][c])) positions.push({ row: r, col: c });
    }
  }
  if (positions.length === 0) return board;
  const idx = Math.floor(Math.random() * positions.length);
  const { row, col } = positions[idx];
  const newBoard = board.map((r) => [...r]);
  newBoard[row][col] = null;

  return processBoardAfterChanges(newBoard);
};

/** удаление по выбранной клетке */
export const applyRemoteWorkAt = (board: Board, pos: Position): Board => {
  const { row, col } = pos;
  if (
    row < 0 ||
    col < 0 ||
    row >= BOARD_ROWS ||
    col >= (board[0] ? board[0].length : 0)
  )
    return board;
  if (!isRemovable(board[row][col])) return board;
  const newBoard = board.map((r) => [...r]);
  newBoard[row][col] = null;

  return processBoardAfterChanges(newBoard);
};
