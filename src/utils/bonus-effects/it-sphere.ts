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

const isUsable = (f: Figure | null) => {
  if (!f) return false;
  if (forbidden.has(f)) return false;
  if (isTeamImage(f)) return false;
  return true;
};

const processBoardAfterChanges = (board: Board): Board => {
  let b = board;
  b = applyGravity(b);
  b = fillEmptySlots(b);
  while (findAllMatches(b).length > 0) {
    b = updateBoardAfterMatches(b);
    b = applyGravity(b);
    b = fillEmptySlots(b);
  }
  return b;
};

/** запасной: instant remove most frequent (compatible) */
export const applyItSphereEffect = (board: Board): Board => {
  const freq = new Map<Figure, number>();
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const f = board[r][c];
      if (isUsable(f)) freq.set(f as Figure, (freq.get(f as Figure) || 0) + 1);
    }
  }
  if (freq.size === 0) return board;
  let target: Figure | null = null;
  let max = -1;
  freq.forEach((v, k) => {
    if (v > max) {
      max = v;
      target = k;
    }
  });
  if (!target) return board;

  const newBoard = board.map((r) => [...r]);
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < newBoard[r].length; c++) {
      if (newBoard[r][c] === target) newBoard[r][c] = null;
    }
  }
  
  return processBoardAfterChanges(newBoard);
};

/** удаляет все фигурки типа фигуры в выбранной клетке */
export const applyItSphereAt = (board: Board, pos: Position): Board => {
  const { row, col } = pos;
  if (
    row < 0 ||
    col < 0 ||
    row >= BOARD_ROWS ||
    col >= (board[0] ? board[0].length : 0)
  )
    return board;
  const targetFig = board[row][col];
  if (!isUsable(targetFig)) return board;
  const newBoard = board.map((r) => [...r]);
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < newBoard[r].length; c++) {
      if (newBoard[r][c] === targetFig) newBoard[r][c] = null;
    }
  }

  return processBoardAfterChanges(newBoard);
};
