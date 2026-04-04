import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Cell } from "@components/game-field/cell/cell";
import { Board, Position, Match, SpecialCell, Figure } from "types";
import { isBigFigure } from "@utils/game-utils";
import { BOARD_ROWS, BOARD_COLS, ANIMATION_DURATION } from "consts";
import "./game-field.styles.css";

type GameFieldProps = {
  board: Board;
  selectedPosition: Position | null;
  modernProductsSourcePos: Position | null;
  activeBonusType?: string;
  matches: Match[];
  specialCells: SpecialCell[];
  onCellClick: (position: Position) => void;
  onDragStart: (position: Position) => void;
  onDragOver: (position: Position) => void;
};

type CellOffset = { x: number; y: number };
type MotionAxis = "x" | "y" | "xy" | "none";

type SourceCell = {
  row: number;
  col: number;
  id: string;
  figure: Figure;
};

type TargetCell = {
  row: number;
  col: number;
  figure: Figure;
};

const STEP = 60;
const DEBUG_ANIMATION = false;

const debugLog = (...args: unknown[]) => {
  if (DEBUG_ANIMATION && typeof console !== "undefined") {
    console.log("[GameField]", ...args);
  }
};

const createFigureId = () =>
  `figure-${Math.random().toString(36).slice(2)}-${Date.now()}`;

const createMotionKey = (
  sequence: number,
  kind: MotionAxis,
  from?: Position | null,
  to?: Position | null
) =>
  [
    kind,
    sequence,
    from ? `${from.row}-${from.col}` : "na",
    to ? `${to.row}-${to.col}` : "na",
  ].join(":");

const normalizeBoard = (inputBoard: Board): Board => {
  return Array.from({ length: BOARD_ROWS }, (_, row) => {
    const rowData = inputBoard[row] || [];
    const normalized = rowData.slice(0, BOARD_COLS);
    while (normalized.length < BOARD_COLS) normalized.push(null);
    return normalized;
  });
};

const boardsEqual = (a: Board, b: Board) => {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const prev = a[r]?.[c] ?? null;
      const next = b[r]?.[c] ?? null;
      if (prev !== next) return false;
    }
  }
  return true;
};

const findDirectSwap = (
  prevBoard: Board,
  nextBoard: Board
): {
  first: {
    row: number;
    col: number;
    prev: Board[number][number];
    next: Board[number][number];
  };
  second: {
    row: number;
    col: number;
    prev: Board[number][number];
    next: Board[number][number];
  };
} | null => {
  const diffs: Array<{
    row: number;
    col: number;
    prev: Board[number][number];
    next: Board[number][number];
  }> = [];

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const prev = prevBoard[r]?.[c] ?? null;
      const next = nextBoard[r]?.[c] ?? null;
      if (prev !== next) {
        diffs.push({ row: r, col: c, prev, next });
      }
    }
  }

  if (diffs.length !== 2) return null;

  const [a, b] = diffs;
  if (!a.prev || !b.prev || !a.next || !b.next) return null;
  if (a.prev === b.next && b.prev === a.next) {
    return { first: a, second: b };
  }
  return null;
};

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const GameField = ({
  board,
  selectedPosition,
  modernProductsSourcePos,
  activeBonusType,
  matches,
  specialCells,
  onCellClick,
  onDragStart,
  onDragOver,
}: GameFieldProps) => {
  const safeBoard = useMemo(() => normalizeBoard(board), [board]);

  const [cellIds, setCellIds] = useState<string[][]>(() =>
    Array.from({ length: BOARD_ROWS }, (_, r) =>
      Array.from({ length: BOARD_COLS }, (_, c) =>
        safeBoard[r][c] ? createFigureId() : ""
      )
    )
  );

  const [cellOffsets, setCellOffsets] = useState<Record<string, CellOffset>>(
    {}
  );
  const [cellMotionKeys, setCellMotionKeys] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      cellIds.flat().filter(Boolean).map((id) => [id, id])
    )
  );
  const [cellMotionAxes, setCellMotionAxes] = useState<
    Record<string, MotionAxis>
  >({});
  const [swapIds, setSwapIds] = useState<Set<string>>(new Set());

  const prevBoardRef = useRef<Board>(safeBoard);
  const prevCellIdsRef = useRef<string[][]>(cellIds);
  const prevMotionKeysRef = useRef<Record<string, string>>(cellMotionKeys);
  const isAnimatingRef = useRef(false);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const motionSequenceRef = useRef(0);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    // Ключевой фикс: если содержимое поля не изменилось,
    // не запускаем анимационный разбор вообще.
    if (boardsEqual(prevBoardRef.current, safeBoard)) {
      if (DEBUG_ANIMATION) {
        debugLog("skip animation: board content unchanged");
      }
      return;
    }

    isAnimatingRef.current = true;
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    const prevBoard = prevBoardRef.current;
    const prevCellIds = prevCellIdsRef.current;
    const prevMotionKeys = prevMotionKeysRef.current;

    const nextIds: string[][] = Array.from(
      { length: BOARD_ROWS },
      () => Array.from({ length: BOARD_COLS }, () => "")
    );
    const nextOffsets: Record<string, CellOffset> = {};
    const nextMotionKeys: Record<string, string> = {};
    const nextMotionAxes: Record<string, MotionAxis> = {};
    const usedSourceIds = new Set<string>();
    const nextSwapIds = new Set<string>();

    const pushMotionKey = (
      id: string,
      kind: MotionAxis,
      from?: Position | null,
      to?: Position | null
    ) => {
      motionSequenceRef.current += 1;
      nextMotionKeys[id] = createMotionKey(
        motionSequenceRef.current,
        kind,
        from,
        to
      );
    };

    const setStatic = (id: string) => {
      nextMotionAxes[id] = "none";
      nextMotionKeys[id] = prevMotionKeys[id] ?? id;
      nextOffsets[id] = { x: 0, y: 0 };
    };

    const assign = (
      source: SourceCell,
      target: TargetCell,
      kind: MotionAxis
    ) => {
      nextIds[target.row][target.col] = source.id;
      usedSourceIds.add(source.id);

      const dx = source.col - target.col;
      const dy = source.row - target.row;
      nextOffsets[source.id] = { x: dx * STEP, y: dy * STEP };

      if (dx !== 0 || dy !== 0) {
        nextMotionAxes[source.id] = kind;
        pushMotionKey(
          source.id,
          kind,
          { row: source.row, col: source.col },
          { row: target.row, col: target.col }
        );
      } else {
        setStatic(source.id);
      }

      if (DEBUG_ANIMATION) {
        debugLog("assign", {
          id: source.id,
          figure: source.figure,
          from: { row: source.row, col: source.col },
          to: { row: target.row, col: target.col },
          kind,
          offset: nextOffsets[source.id],
        });
      }
    };

    const isMatchedPos = (r: number, c: number) =>
      matches.some((m) =>
        m.positions.some((p) => p.row === r && p.col === c)
      );

    const sourceCells: SourceCell[] = [];
    const targetCells: TargetCell[] = [];

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const prevFigure = prevBoard[r]?.[c] ?? null;
        const prevId = prevCellIds[r]?.[c] ?? "";
        const nextFigure = safeBoard[r][c];

        if (prevFigure && prevId && !isMatchedPos(r, c)) {
          sourceCells.push({ row: r, col: c, id: prevId, figure: prevFigure });
        }
        if (nextFigure) {
          targetCells.push({ row: r, col: c, figure: nextFigure });
        }
      }
    }

    if (DEBUG_ANIMATION) {
      debugLog("diff", {
        sourceCells: sourceCells.length,
        targetCells: targetCells.length,
      });
    }

    // 1) Прямой swap
    const directSwap = findDirectSwap(prevBoard, safeBoard);
    if (directSwap) {
      const { first, second } = directSwap;
      const firstId = prevCellIds[first.row]?.[first.col];
      const secondId = prevCellIds[second.row]?.[second.col];

      if (firstId && secondId) {
        const sourceA: SourceCell = {
          row: first.row,
          col: first.col,
          id: firstId,
          figure: first.prev as Figure,
        };
        const sourceB: SourceCell = {
          row: second.row,
          col: second.col,
          id: secondId,
          figure: second.prev as Figure,
        };
        const targetA: TargetCell = {
          row: first.row,
          col: first.col,
          figure: first.next as Figure,
        };
        const targetB: TargetCell = {
          row: second.row,
          col: second.col,
          figure: second.next as Figure,
        };

        assign(sourceA, targetB, "xy");
        assign(sourceB, targetA, "xy");
        nextSwapIds.add(firstId);
        nextSwapIds.add(secondId);

        if (DEBUG_ANIMATION) {
          debugLog("direct swap", {
            first: {
              id: firstId,
              from: { row: first.row, col: first.col },
              to: { row: second.row, col: second.col },
            },
            second: {
              id: secondId,
              from: { row: second.row, col: second.col },
              to: { row: first.row, col: first.col },
            },
          });
        }
      }
    }

    // 2) Вертикальные падения
    for (let c = 0; c < BOARD_COLS; c++) {
      const columnSources = sourceCells
        .filter((s) => s.col === c && !usedSourceIds.has(s.id))
        .sort((a, b) => a.row - b.row);
      const columnTargets = targetCells
        .filter((t) => t.col === c && !nextIds[t.row][t.col])
        .sort((a, b) => a.row - b.row);

      const pairCount = Math.min(
        columnSources.length,
        columnTargets.length
      );
      const sourceStart = columnSources.length - pairCount;
      const targetStart = columnTargets.length - pairCount;

      for (let i = 0; i < pairCount; i++) {
        const source = columnSources[sourceStart + i];
        const target = columnTargets[targetStart + i];
        if (source.figure !== target.figure) continue;
        assign(
          source,
          target,
          source.row === target.row ? "none" : "y"
        );
      }
    }

    // 3) Фиксация статичных фигур
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (nextIds[r][c]) continue;
        const prevFigure = prevBoard[r]?.[c] ?? null;
        const nextFigure = safeBoard[r][c];
        const prevId = prevCellIds[r]?.[c] ?? "";

        if (
          prevFigure &&
          nextFigure &&
          prevFigure === nextFigure &&
          prevId &&
          !usedSourceIds.has(prevId)
        ) {
          const source: SourceCell = {
            row: r,
            col: c,
            id: prevId,
            figure: prevFigure,
          };
          const target: TargetCell = { row: r, col: c, figure: nextFigure };
          assign(source, target, "none");
        }
      }
    }

    // 4) Горизонтальные перемещения
    const rowSourceGroups = new Map<string, SourceCell[]>();
    const rowTargetGroups = new Map<string, TargetCell[]>();

    for (const source of sourceCells) {
      if (usedSourceIds.has(source.id)) continue;
      const key = `${source.row}:${source.figure}`;
      const list = rowSourceGroups.get(key) ?? [];
      list.push(source);
      rowSourceGroups.set(key, list);
    }

    for (const target of targetCells) {
      if (nextIds[target.row][target.col]) continue;
      const key = `${target.row}:${target.figure}`;
      const list = rowTargetGroups.get(key) ?? [];
      list.push(target);
      rowTargetGroups.set(key, list);
    }

    const rowKeys = new Set([
      ...rowSourceGroups.keys(),
      ...rowTargetGroups.keys(),
    ]);

    for (const key of rowKeys) {
      const sourceList = (rowSourceGroups.get(key) ?? []).sort(
        (a, b) => a.col - b.col
      );
      const targetList = (rowTargetGroups.get(key) ?? []).sort(
        (a, b) => a.col - b.col
      );
      const count = Math.min(sourceList.length, targetList.length);

      for (let i = 0; i < count; i++) {
        const source = sourceList[i];
        const target = targetList[i];
        if (source.col === target.col) continue;
        if (
          !usedSourceIds.has(source.id) &&
          !nextIds[target.row][target.col]
        ) {
          assign(source, target, "x");
        }
      }
    }

    // 5) Новые фигуры
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (!safeBoard[r][c] || nextIds[r][c]) continue;
        const id = createFigureId();
        nextIds[r][c] = id;

        if (r === 0) {
          nextOffsets[id] = { x: 0, y: -STEP };
          nextMotionAxes[id] = "y";
          pushMotionKey(id, "y", null, { row: r, col: c });
        } else {
          nextOffsets[id] = { x: 0, y: 0 };
          nextMotionAxes[id] = "none";
          nextMotionKeys[id] = id;
        }
      }
    }

    setCellIds(nextIds);
    setCellOffsets(nextOffsets);
    setCellMotionKeys(nextMotionKeys);
    setCellMotionAxes(nextMotionAxes);
    setSwapIds(nextSwapIds);

    prevBoardRef.current = safeBoard;
    prevCellIdsRef.current = nextIds;
    prevMotionKeysRef.current = nextMotionKeys;

    animationTimeoutRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
      setSwapIds(new Set());
      if (DEBUG_ANIMATION) {
        debugLog("animation finished");
      }
    }, ANIMATION_DURATION + 30);
  }, [safeBoard, matches]);

  const isPartOfMatch = (r: number, c: number) =>
    matches.some((m) =>
      m.positions.some((p) => p.row === r && p.col === c)
    );

  const getSpecialCell = (r: number, c: number) =>
    specialCells.find(
      (cell) => cell.row === r && cell.col === c && cell.isActive
    );

  const isBlocked = (r: number, c: number) => {
    const f = safeBoard[r][c];
    return !!(f && isBigFigure(f));
  };

  const safeDragOver = (pos: Position) => {
    if (isAnimatingRef.current) return;
    onDragOver(pos);
  };

  return (
    <div className="field-wrapper">
      <div className="field">
        {safeBoard.map((row, r) =>
          row.map((figure, c) => {
            const id = cellIds[r]?.[c] || "";
            const offset = cellOffsets[id] || { x: 0, y: 0 };
            const hasRealOffset = offset.x !== 0 || offset.y !== 0;
            const motionKey = cellMotionKeys[id] || id;
            const motionAxis = cellMotionAxes[id] || "none";
            const disableAnimation = !!figure && isBigFigure(figure);

            return (
              <Cell
                key={`cell-${r}-${c}`}
                figure={figure}
                figureId={id}
                motionKey={motionKey}
                motionAxis={motionAxis}
                disableAnimation={disableAnimation}
                offset={offset}
                hasRealOffset={hasRealOffset}
                isSwapping={swapIds.has(id)}
                position={{ row: r, col: c }}
                isSelected={
                  selectedPosition?.row === r &&
                  selectedPosition?.col === c
                }
                isModernProductsSource={
                  activeBonusType === "modernProducts" &&
                  modernProductsSourcePos?.row === r &&
                  modernProductsSourcePos?.col === c
                }
                isMatched={isPartOfMatch(r, c)}
                isBlocked={isBlocked(r, c)}
                specialCell={getSpecialCell(r, c)}
                onClick={onCellClick}
                onDragStart={onDragStart}
                onDragOver={safeDragOver}
              />
            );
          })
        )}
      </div>
    </div>
  );
};