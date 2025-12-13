// hooks/use-input-handlers.ts
import { useRef } from "react";
import {
  Position,
  Bonus,
  Board,
  LevelState,
  GameBoardState,
  GameMovesState,
  ActiveBonus,
  Bonus as BonusType,
} from "types";
import { BONUS_EFFECTS } from "@utils/bonus-effects/effects-registry";

type UseInputHandlersProps = {
  levelState: LevelState;
  gameState: GameBoardState & GameMovesState;
  areAdjacent: (pos1: Position, pos2: Position) => boolean;
  swapFigures: (
    pos1: Position,
    pos2: Position,
    moves: number,
    setMoves: (updater: (moves: number) => number) => void
  ) => Promise<boolean>;
  handleBonus: (type: Bonus["type"], board: Board) => void;
  board: Board;

  // new props for targeted bonuses
  activeBonus: ActiveBonus | null;
  setActiveBonus: (b: ActiveBonus | null) => void;
  setBonuses: (updater: (bonuses: BonusType[]) => BonusType[]) => void;
  setBoard: (board: Board) => void;
  setIsAnimating: (animating: boolean) => void;
  setMoves: (updater: (moves: number) => number) => void;
};

export const useInputHandlers = ({
  levelState,
  gameState,
  areAdjacent,
  swapFigures,
  handleBonus,
  board,
  activeBonus,
  setActiveBonus,
  setBonuses,
  setBoard,
  setIsAnimating,
  setMoves,
}: UseInputHandlersProps) => {
  // для modernProducts двухшаговой логики
  const modernSourceRef = useRef<Position | null>(null);

  const applyAndFinalizeBonus = (type: string, newBoard: Board, effect: any) => {
    // уменьшить количество бонуса и закрыть активный
    setBonuses((prev) => {
      const next = [...prev];
      const idx = next.findIndex((b) => b.type === (type as any));
      if (idx !== -1 && next[idx].count > 0) {
        next[idx] = { ...next[idx], count: next[idx].count - 1 };
      }
      return next;
    });

    if (effect?.onApply) {
      effect.onApply(setMoves);
    }

    setIsAnimating(true);
    setTimeout(() => {
      setBoard(newBoard);
      setIsAnimating(false);
      setActiveBonus(null);
      modernSourceRef.current = null;
    }, 300);
  };

  const handleCellClick = (position: Position) => {
    if (
      levelState.isLevelTransition ||
      gameState.isSwapping ||
      gameState.isAnimating ||
      gameState.moves <= 0
    ) {
      return;
    }

    // --- TARGETED BONUS HANDLING ---
    if (activeBonus && activeBonus.isActive) {
      const effect = BONUS_EFFECTS[activeBonus.type];
      if (effect?.applyAt) {
        // remoteWork: однонажатие в точке
        if (activeBonus.type === "remoteWork") {
          const newBoard = effect.applyAt(board, position);
          applyAndFinalizeBonus(activeBonus.type, newBoard, effect);
          return;
        }

        // itSphere: однонажатие на фигуру — удаляет все такого типа
        if (activeBonus.type === "itSphere") {
          const newBoard = effect.applyAt(board, position);
          applyAndFinalizeBonus(activeBonus.type, newBoard, effect);
          return;
        }

        // modernProducts: двухшаговый - сначала выбираем исходную фигурку, затем цель
        if (activeBonus.type === "modernProducts") {
          // если не выбрана исходная — выбрать
          if (!modernSourceRef.current) {
            // только если на позиции есть допустимая фигура
            const fig = board[position.row][position.col];
            if (!fig) return;
            modernSourceRef.current = position;
            // визуальная подсветка — можно добавить state, сейчас просто сохраняем
            return;
          }

          // если уже выбран источник — применяем преобразование в указанную цель
          const sourcePos = modernSourceRef.current;
          const newBoard = effect.applyAt(board, sourcePos as Position, position);
          applyAndFinalizeBonus(activeBonus.type, newBoard, effect);
          return;
        }
      }
    }

    // --- EXISTING CLICK / SWAP LOGIC ---
    if (!gameState.selectedPosition) {
      gameState.setSelectedPosition(position);
    } else {
      if (areAdjacent(gameState.selectedPosition, position)) {
        swapFigures(
          gameState.selectedPosition,
          position,
          gameState.moves,
          gameState.setMoves
        );
      }
      gameState.setSelectedPosition(null);
    }
  };

  const handleDragStart = (position: Position) => {
    if (
      levelState.isLevelTransition ||
      gameState.isSwapping ||
      gameState.isAnimating ||
      gameState.moves <= 0
    ) {
      return;
    }

    // <-- New: если активен таргетный бонус — блокируем drag/swap
    if (activeBonus && activeBonus.isActive) {
      return;
    }

    gameState.setSelectedPosition(position);
  };

  const handleDragOver = (position: Position) => {
    if (
      levelState.isLevelTransition ||
      !gameState.selectedPosition ||
      gameState.isSwapping ||
      gameState.isAnimating ||
      gameState.moves <= 0
    ) {
      return;
    }

    // <-- New: если активен таргетный бонус — блокируем swap при наведении
    if (activeBonus && activeBonus.isActive) {
      return;
    }

    if (areAdjacent(gameState.selectedPosition, position)) {
      swapFigures(
        gameState.selectedPosition,
        position,
        gameState.moves,
        gameState.setMoves
      );
      gameState.setSelectedPosition(null);
    }
  };

  const handleUseBonus = (type: Bonus["type"]) => {
    if (levelState.isLevelTransition || gameState.isAnimating) {
      return;
    }
    handleBonus(type, board);
  };

  const resetSelection = () => {
    gameState.setSelectedPosition(null);
    modernSourceRef.current = null;
  };

  return {
    handleCellClick,
    handleDragStart,
    handleDragOver,
    handleUseBonus,
    resetSelection,
  };
};
