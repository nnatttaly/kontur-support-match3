import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Cell } from "@components/game-field/cell/cell";
import { Board, Position, Match, SpecialCell } from "types";
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
  onCellPositionsChange?: (positions: Record<string, { x: number; y: number; width: number; height: number; row: number; col: number }>) => void;
};

type CellOffset = { x: number; y: number };
type MotionAxis = "x" | "y" | "xy" | "none";

const STEP = 60;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const normalizeBoard = (inputBoard: Board): Board =>
  Array.from({ length: BOARD_ROWS }, (_, row) => {
    const rowData = inputBoard[row] || [];
    const normalized = rowData.slice(0, BOARD_COLS);
    while (normalized.length < BOARD_COLS) normalized.push(null);
    return normalized;
  });

const boardsEqual = (a: Board, b: Board) => {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const prev = a[r]?.[c] ?? null;
      const next = b[r]?.[c] ?? null;
      const prevKey = prev ? `${prev.id}:${prev.type}` : "";
      const nextKey = next ? `${next.id}:${next.type}` : "";
      if (prevKey !== nextKey) return false;
    }
  }
  return true;
};

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
  onCellPositionsChange,
}: GameFieldProps) => {
  const safeBoard = useMemo(() => normalizeBoard(board), [board]);

  const [cellOffsets, setCellOffsets] = useState<Record<string, CellOffset>>({});
  const [cellMotionKeys, setCellMotionKeys] = useState<Record<string, string>>({});
  const [cellMotionAxes, setCellMotionAxes] = useState<Record<string, MotionAxis>>({});
  const [swapIds, setSwapIds] = useState<Set<string>>(new Set());

  const prevBoardRef = useRef<Board>(safeBoard);
  const prevMotionKeysRef = useRef<Record<string, string>>({});
  const isAnimatingRef = useRef(false);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const motionSequenceRef = useRef(0);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (boardsEqual(prevBoardRef.current, safeBoard)) return;

    isAnimatingRef.current = true;
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);

    const prevBoard = prevBoardRef.current;
    const prevMotionKeys = prevMotionKeysRef.current;

    const nextOffsets: Record<string, CellOffset> = {};
    const nextMotionKeys: Record<string, string> = {};
    const nextMotionAxes: Record<string, MotionAxis> = {};
    const nextSwapIds = new Set<string>();

    const prevPosById = new Map<string, Position>();
    const nextPosById = new Map<string, Position>();

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const prev = prevBoard[r]?.[c];
        if (prev) prevPosById.set(prev.id, { row: r, col: c });

        const next = safeBoard[r]?.[c];
        if (next) nextPosById.set(next.id, { row: r, col: c });
      }
    }

    const movedIds: string[] = [];

    const setStatic = (id: string) => {
      nextMotionAxes[id] = "none";
      nextMotionKeys[id] = prevMotionKeys[id] ?? id;
      nextOffsets[id] = { x: 0, y: 0 };
    };

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

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const figure = safeBoard[r][c];
        if (!figure) continue;

        const prevPos = prevPosById.get(figure.id);

        if (!prevPos) {
          nextOffsets[figure.id] = r === 0 ? { x: 0, y: -STEP } : { x: 0, y: 0 };
          nextMotionAxes[figure.id] = r === 0 ? "y" : "none";
          pushMotionKey(figure.id, r === 0 ? "y" : "none", null, { row: r, col: c });
          continue;
        }

        const dx = prevPos.col - c;
        const dy = prevPos.row - r;

        if (dx === 0 && dy === 0) {
          setStatic(figure.id);
          continue;
        }

        movedIds.push(figure.id);
        nextOffsets[figure.id] = { x: dx * STEP, y: dy * STEP };
        const kind: MotionAxis = dx !== 0 && dy !== 0 ? "xy" : dx !== 0 ? "x" : "y";
        nextMotionAxes[figure.id] = kind;
        pushMotionKey(figure.id, kind, prevPos, { row: r, col: c });
      }
    }

    if (movedIds.length === 2) {
      const [a, b] = movedIds;
      const prevA = prevPosById.get(a);
      const prevB = prevPosById.get(b);
      const nextA = nextPosById.get(a);
      const nextB = nextPosById.get(b);

      if (
        prevA &&
        prevB &&
        nextA &&
        nextB &&
        prevA.row === nextB.row &&
        prevA.col === nextB.col &&
        prevB.row === nextA.row &&
        prevB.col === nextA.col
      ) {
        nextSwapIds.add(a);
        nextSwapIds.add(b);
      }
    }

    setCellOffsets(nextOffsets);
    setCellMotionKeys(nextMotionKeys);
    setCellMotionAxes(nextMotionAxes);
    setSwapIds(nextSwapIds);

    prevBoardRef.current = safeBoard;
    prevMotionKeysRef.current = nextMotionKeys;

    animationTimeoutRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
      setSwapIds(new Set());
    }, ANIMATION_DURATION + 30);
  }, [safeBoard, matches]);

  const isPartOfMatch = (r: number, c: number) =>
    matches.some((m) => m.positions.some((p) => p.row === r && p.col === c));

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

  // refs для всех клеток
  const cellRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fieldRef = useRef<HTMLDivElement | null>(null);

  // Собираем координаты клеток после рендера
  useLayoutEffect(() => {
    if (!onCellPositionsChange) return;
    const positions: Record<string, { x: number; y: number; width: number; height: number; row: number; col: number }> = {};
    Object.entries(cellRefs.current).forEach(([id, el]) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        positions[id] = {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
          row: Number(el.dataset.row),
          col: Number(el.dataset.col),
        };
      }
    });
    onCellPositionsChange(positions);
  }, [safeBoard, onCellPositionsChange]);

  return (
    <div className="field-wrapper" ref={fieldRef}>
      <div className="field">
        {safeBoard.map((row, r) =>
          row.map((figure, c) => {
            const id = figure?.id || "";
            const offset = cellOffsets[id] || { x: 0, y: 0 };
            const hasRealOffset = offset.x !== 0 || offset.y !== 0;
            const motionKey = cellMotionKeys[id] || id;
            const motionAxis = cellMotionAxes[id] || "none";
            const disableAnimation = !!figure && isBigFigure(figure);

            return (
              <Cell
                key={`cell-${r}-${c}`}
                innerRef={el => {
                  if (figure && id) cellRefs.current[id] = el;
                }}
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