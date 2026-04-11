import { useState, useRef } from "react";
import {
  Position,
  Bonus,
  Board,
  LevelState,
  ActiveBonus,
  Match,
  Figure,
  FigureType,
  SpecialCell,
  Goal,
} from "types";
import { BONUS_EFFECTS } from "@utils/bonus-effects/effects-registry";
import { applyGravity, fillEmptySlots, applyHorizontalGravity } from "@utils/game-logic";
import { ANIMATION_DURATION, BOARD_ROWS, LEVELS } from "consts";
import { applyModernProductsAt } from "@utils/bonus-effects/modern-products";

type GameBoardState = {
  selectedPosition: Position | null;
  setSelectedPosition: (pos: Position | null) => void;
  isSwapping: boolean;
  setIsSwapping: (swapping: boolean) => void;
  isAnimating: boolean;
  setIsAnimating: (animating: boolean) => void;
  moves: number;
  setMoves: (updater: (moves: number) => number) => void;
  setMatches: (matches: Match[]) => void;
};

type UseInputHandlersProps = {
  levelState: LevelState;
  gameState: GameBoardState;
  areAdjacent: (pos1: Position, pos2: Position) => boolean;
  swapFigures: (
    pos1: Position,
    pos2: Position,
    moves: number,
    setMoves: (updater: (moves: number) => number) => void,
    specialCells: SpecialCell[]
  ) => Promise<boolean>;
  handleBonus: (type: Bonus["type"], board: Board) => void;
  board: Board;
  activeBonus: ActiveBonus | null;
  setActiveBonus: (b: ActiveBonus | null) => void;
  setBonuses: (updater: (bonuses: Bonus[]) => Bonus[]) => void;
  setBoard: (board: Board) => void;
  setIsAnimating: (animating: boolean) => void;
  setMoves: (updater: (moves: number) => number) => void;
  setGoals: (updater: (goals: Goal[]) => Goal[]) => void;
  setMatches: (matches: Match[]) => void;
  goals: Goal[];
  processMatches?: (
    board: Board,
    specialCells: SpecialCell[],
    options?: { skipGoldenRestore: boolean }
  ) => Promise<Board>;
  specialCells?: SpecialCell[];
  setSpecialCells?: (cells: SpecialCell[]) => void;
  onGoalCollected?: (position: Position, figureType: FigureType, goalIndex: number) => void;
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
  setGoals,
  setMatches,
  goals,
  processMatches,
  specialCells = [],
  setSpecialCells,
  onGoalCollected,
}: UseInputHandlersProps) => {
  const [modernProductsSourcePos, setModernProductsSourcePos] = useState<Position | null>(null);
  const isProcessingClick = useRef(false);
  const isProcessingSpecialFigures = useRef(false);

  const applyGravityAndFillStepwise = async (
    boardState: Board,
    level: typeof LEVELS[number]
  ): Promise<Board> => {
    let nextBoard = boardState;

    while (nextBoard.some((row) => row.some((cell) => cell === null))) {
      nextBoard = applyGravity(nextBoard);
      setBoard([...nextBoard]);
      await new Promise((r) => setTimeout(r, ANIMATION_DURATION));

      nextBoard = fillEmptySlots(nextBoard, level);
      setBoard([...nextBoard]);
      await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
    }

    return nextBoard;
  };

  const processSpecialFigures = (
    currentBoard: Board
  ): { board: Board; hasSpecialFigures: boolean } => {
    if (isProcessingSpecialFigures.current) {
      return { board: currentBoard, hasSpecialFigures: false };
    }

    isProcessingSpecialFigures.current = true;

    try {
      const boardCopy = currentBoard.map((row) => [...row]);
      let hasSpecialFigures = false;

      const diamondsToRemove: Position[] = [];
      const starsToRemove: Position[] = [];

      for (let col = 0; col < (boardCopy[0]?.length || 0); col++) {
        if (boardCopy[BOARD_ROWS - 1]?.[col]?.type === "diamond") {
          diamondsToRemove.push({ row: BOARD_ROWS - 1, col });
        }
      }

      for (let col = 0; col < (boardCopy[0]?.length || 0); col++) {
        if (boardCopy[BOARD_ROWS - 1]?.[col]?.type === "star") {
          starsToRemove.push({ row: BOARD_ROWS - 1, col });
        }
      }

      if (diamondsToRemove.length > 0) {
        hasSpecialFigures = true;
        diamondsToRemove.forEach(({ row, col }) => {
          boardCopy[row][col] = null;
        });

        const diamondGoalIndex = goals.findIndex((g) => g.figure === "diamond");

        setGoals((prev) => {
          const next = [...prev];
          const idx = next.findIndex((g) => g.figure === "diamond");
          if (idx !== -1) {
            const inc = diamondsToRemove.length;
            next[idx] = {
              ...next[idx],
              collected: Math.min(next[idx].collected + inc, next[idx].target),
            };
          }
          return next;
        });

        if (onGoalCollected && diamondGoalIndex !== -1) {
          diamondsToRemove.forEach((pos) => {
            onGoalCollected(pos, "diamond", diamondGoalIndex);
          });
        }
      }

      if (starsToRemove.length > 0) {
        hasSpecialFigures = true;
        starsToRemove.forEach(({ row, col }) => {
          boardCopy[row][col] = null;
        });

        const starGoalIndex = goals.findIndex((g) => g.figure === "star");

        setGoals((prev) => {
          const next = [...prev];
          const idx = next.findIndex((g) => g.figure === "star");
          if (idx !== -1) {
            const inc = starsToRemove.length;
            next[idx] = {
              ...next[idx],
              collected: Math.min(next[idx].collected + inc, next[idx].target),
            };
          }
          return next;
        });

        if (onGoalCollected && starGoalIndex !== -1) {
          starsToRemove.forEach((pos) => {
            onGoalCollected(pos, "star", starGoalIndex);
          });
        }
      }

      return { board: boardCopy, hasSpecialFigures };
    } finally {
      isProcessingSpecialFigures.current = false;
    }
  };

  const updateGoalsAndSpecialCells = (
    removedFigures: Array<{ position: Position; figure: Figure }>,
    removedGoldenCells: Position[],
    bonusType?: string
  ): SpecialCell[] => {
    let updatedSpecialCells = specialCells ? [...specialCells] : [];
    let goldenCellsUpdated = false;

    if (removedGoldenCells.length > 0) {
      removedGoldenCells.forEach((pos) => {
        const cellIndex = updatedSpecialCells.findIndex(
          (cell) =>
            cell.row === pos.row &&
            cell.col === pos.col &&
            cell.type === "golden"
        );

        if (cellIndex !== -1) {
          updatedSpecialCells[cellIndex] = {
            ...updatedSpecialCells[cellIndex],
            isActive: false,
          };
          goldenCellsUpdated = true;
        }
      });

      setGoals((prev) => {
        const next = prev.map((goal) => {
          if (goal.figure === "goldenCell") {
            return {
              ...goal,
              collected: Math.min(
                goal.collected + removedGoldenCells.length,
                goal.target
              ),
            };
          }
          return goal;
        });
        return next;
      });
    }

    const filteredRemovedFigures = removedFigures.filter(
      ({ figure }) => figure.type !== "teamCell" && figure.type !== "goldenCell"
    );

    if (filteredRemovedFigures.length > 0) {
      setGoals((prev) => {
        const figureCountMap = new Map<FigureType, number>();

        filteredRemovedFigures.forEach(({ figure }) => {
          figureCountMap.set(figure.type, (figureCountMap.get(figure.type) || 0) + 1);
        });

        const next = prev.map((goal) => {
          if (figureCountMap.has(goal.figure)) {
            const count = figureCountMap.get(goal.figure) || 0;
            return {
              ...goal,
              collected: Math.min(goal.collected + count, goal.target),
            };
          }
          return goal;
        });

        return next;
      });
    }

    if (goldenCellsUpdated && setSpecialCells) {
      setSpecialCells(updatedSpecialCells);
    }

    return updatedSpecialCells;
  };

  const applyAndFinalizeBonus = async (
    type: string,
    boardWithHoles: Board,
    matchedPositions: Position[],
    removedFigures: Array<{ position: Position; figure: Figure }>,
    removedGoldenCells: Position[],
    effect: any
  ) => {
    if (type === "modernProducts" && matchedPositions.length === 0) {
      setActiveBonus(null);
      return;
    }

    if ((type === "dms" || type === "remoteWork") && matchedPositions.length === 0) {
      setActiveBonus(null);
      return;
    }

    setBonuses((prev) => {
      const next = [...prev];
      const idx = next.findIndex((b) => b.type === type);
      if (idx !== -1 && next[idx].count > 0) {
        const newCount = next[idx].count - 1;

        if (levelState.currentLevel === 6 && newCount <= 0) {
          next.splice(idx, 1);
        } else {
          next[idx] = { ...next[idx], count: newCount };
        }
      }
      return next;
    });

    const updatedSpecialCells = updateGoalsAndSpecialCells(
      removedFigures,
      removedGoldenCells,
      type
    );

    effect?.onApply?.(setMoves);
    effect?.onApplyGoals?.(setGoals);

    setIsAnimating(true);
    try {
      if (matchedPositions.length > 0) {
        const tempMatches: Match[] = [];
        const figureTypes = new Map<FigureType, Position[]>();

        matchedPositions.forEach((pos) => {
          const figure = board[pos.row][pos.col];
          if (figure) {
            if (!figureTypes.has(figure.type)) {
              figureTypes.set(figure.type, []);
            }
            figureTypes.get(figure.type)!.push(pos);
          }
        });

        figureTypes.forEach((positions, figure) => {
          tempMatches.push({ positions, figure });
        });

        setMatches(tempMatches);
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));
        setMatches([]);
      }

      setBoard([...boardWithHoles]);
      await new Promise((resolve) => setTimeout(resolve, 200));

      let updatedBoard = await applyGravityAndFillStepwise(
        boardWithHoles,
        LEVELS[levelState.currentLevel - 1]
      );

      const specialResult = processSpecialFigures(updatedBoard);
      if (specialResult.hasSpecialFigures) {
        updatedBoard = specialResult.board;
        setBoard([...updatedBoard]);
        await new Promise((resolve) => setTimeout(resolve, 200));

        updatedBoard = await applyGravityAndFillStepwise(
          updatedBoard,
          LEVELS[levelState.currentLevel - 1]
        );
      }

      const updatedBoardIsChanged = applyHorizontalGravity(updatedBoard);

      if (updatedBoardIsChanged.isChanged) {
        setBoard([...updatedBoardIsChanged.board]);
        await new Promise((resolve) => setTimeout(resolve, 200));
        updatedBoard = await applyGravityAndFillStepwise(
          updatedBoardIsChanged.board,
          LEVELS[levelState.currentLevel - 1]
        );

        const specialResult2 = processSpecialFigures(updatedBoard);
        if (specialResult2.hasSpecialFigures) {
          updatedBoard = specialResult2.board;
          setBoard([...updatedBoard]);
          await new Promise((resolve) => setTimeout(resolve, 200));

          updatedBoard = await applyGravityAndFillStepwise(
            updatedBoard,
            LEVELS[levelState.currentLevel - 1]
          );
        }
      }

      updatedBoard = await applyGravityAndFillStepwise(
        updatedBoard,
        LEVELS[levelState.currentLevel - 1]
      );

      setBoard([...updatedBoard]);
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (processMatches) {
        const skipGoldenRestore = type === "dms" || type === "remoteWork";
        await processMatches(updatedBoard, updatedSpecialCells, {
          skipGoldenRestore,
        });
      }
    } finally {
      setIsAnimating(false);
      setActiveBonus(null);
    }
  };

  const handleCellClick = async (position: Position) => {
    if (isProcessingClick.current) {
      return;
    }

    if (
      levelState.isLevelTransition ||
      gameState.isSwapping ||
      gameState.isAnimating ||
      gameState.moves <= 0
    ) {
      return;
    }

    if (!board || !Array.isArray(board) || board.length === 0) {
      return;
    }

    isProcessingClick.current = true;

    try {
      if (activeBonus && activeBonus.isActive && activeBonus.type !== "careerGrowth") {
        if (activeBonus.type === "modernProducts") {
          if (!modernProductsSourcePos) {
            if (!board[position.row] || board[position.row][position.col] === undefined) {
              return;
            }
            const fig = board[position.row][position.col];
            if (!fig) return;
            setModernProductsSourcePos(position);
            return;
          }

          const sourcePos = modernProductsSourcePos;

          if (sourcePos.row === position.row && sourcePos.col === position.col) {
            setModernProductsSourcePos(null);
            return;
          }

          const sourceFig = board[sourcePos.row][sourcePos.col];
          const targetFig = board[position.row][position.col];

          if (!sourceFig || !targetFig || sourceFig.type === targetFig.type) {
            setModernProductsSourcePos(null);
            setActiveBonus(null);
            return;
          }

          setModernProductsSourcePos(null);

          const result = applyModernProductsAt(board, sourcePos as Position, position);

          if (!result || !result.board) {
            setActiveBonus(null);
            return;
          }

          const effect = BONUS_EFFECTS.modernProducts;
          await applyAndFinalizeBonus(
            activeBonus.type,
            result.board,
            result.matchedPositions,
            [],
            [],
            effect
          );
          return;
        }

        const effect = BONUS_EFFECTS[activeBonus.type];
        if (effect?.applyAt) {
          if (activeBonus.type === "remoteWork") {
            const result = effect.applyAt(board, position, undefined, specialCells);
            if (!result || !result.board || result.matchedPositions.length === 0) {
              setActiveBonus(null);
              return;
            }

            await applyAndFinalizeBonus(
              activeBonus.type,
              result.board,
              result.matchedPositions,
              result.removedFigures || [],
              result.removedGoldenCells || [],
              effect
            );
            return;
          }

          if (activeBonus.type === "dms") {
            const result = effect.applyAt(board, position, undefined, specialCells);
            if (!result || !result.board || result.matchedPositions.length === 0) {
              setActiveBonus(null);
              return;
            }

            await applyAndFinalizeBonus(
              activeBonus.type,
              result.board,
              result.matchedPositions,
              result.removedFigures || [],
              result.removedGoldenCells || [],
              effect
            );
            return;
          }
        }
      }

      if (!gameState.selectedPosition) {
        gameState.setSelectedPosition(position);
      } else {
        if (areAdjacent(gameState.selectedPosition, position)) {
          await swapFigures(
            gameState.selectedPosition,
            position,
            gameState.moves,
            gameState.setMoves,
            specialCells
          );
        }
        gameState.setSelectedPosition(null);
      }
    } finally {
      isProcessingClick.current = false;
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

    if (activeBonus && activeBonus.isActive && activeBonus.type !== "itSphere") {
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

    if (activeBonus && activeBonus.isActive && activeBonus.type !== "itSphere") {
      return;
    }

    if (areAdjacent(gameState.selectedPosition, position)) {
      swapFigures(
        gameState.selectedPosition,
        position,
        gameState.moves,
        gameState.setMoves,
        specialCells
      );
      gameState.setSelectedPosition(null);
    }
  };

  const handleUseBonus = (type: Bonus["type"]) => {
    if (levelState.isLevelTransition || gameState.isAnimating) {
      return;
    }
    setModernProductsSourcePos(null);
    handleBonus(type, board);
  };

  const resetSelection = () => {
    gameState.setSelectedPosition(null);
    setModernProductsSourcePos(null);
  };

  return {
    handleCellClick,
    handleDragStart,
    handleDragOver,
    handleUseBonus,
    resetSelection,
    modernProductsSourcePos,
  };
};