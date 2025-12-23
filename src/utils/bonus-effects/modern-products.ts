import { Board, Figure, Position } from "types";
import { BOARD_ROWS, BOARD_COLS } from "consts";
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

/** запасной: заменяет случайную обычную клетку на случайную обычную фигуру */
export const applyModernProductsEffect = (board: Board): Board => {
  const newBoard = board.map((r) => [...r]);
  const positions: Position[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (isUsable(newBoard[r][c])) positions.push({ row: r, col: c });
    }
  }
  if (positions.length === 0) return board;
  const pos = positions[Math.floor(Math.random() * positions.length)];
  // choose a different usable figure from somewhere else
  const otherPositions = positions.filter((p) => p.row !== pos.row || p.col !== pos.col);
  if (otherPositions.length === 0) return board;
  const source = otherPositions[Math.floor(Math.random() * otherPositions.length)];
  newBoard[pos.row][pos.col] = newBoard[source.row][source.col];

  // Возвращаем доску без обработки матчей
  return newBoard;
};

/**
 * modernProducts two-step:
 * - если передан только sourcePos: ничего не меняет (логика выбора в hook)
 * - если передан sourcePos и targetPos: превращает фигуру в sourcePos в тип фигуры targetPos.
 */
export const applyModernProductsAt = (
  board: Board,
  sourcePos: Position,
  targetPos?: Position
): Board => {
  if (!targetPos) return board;

  const { row: sr, col: sc } = sourcePos;
  const { row: tr, col: tc } = targetPos;

  // валидность позиций
  if (
    sr < 0 || sc < 0 || tr < 0 || tc < 0 ||
    sr >= BOARD_ROWS || sc >= BOARD_COLS || tr >= BOARD_ROWS || tc >= BOARD_COLS
  ) {
    return board;
  }

  const sourceFig = board[sr][sc];
  const targetFig = board[tr][tc];

  // обе фигуры должны быть "обычными"
  if (!isUsable(sourceFig) || !isUsable(targetFig)) return board;

  // если то же место — ничего не делаем
  if (sr === tr && sc === tc) return board;

  const newBoard = board.map((r) => [...r]);
  newBoard[sr][sc] = targetFig; // превращаем исходную в тип целевой

  // Возвращаем доску без обработки матчей
  return newBoard;
};