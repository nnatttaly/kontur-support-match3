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
import { isTeamImage } from "@utils/game-utils";
import {
  progressTeamHappyOne,
  progressTeamHappyTwo,
  progressTeamHappyThree,
} from "@utils/game-team-utils";
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
  setScore: (updater: (score: number) => number) => void;
  setGoals: (updater: (goals: Goal[]) => Goal[]) => void;
  setMatches: (matches: Match[]) => void;
  goals: Goal[];
  processMatches?: (
    board: Board,
    specialCells: SpecialCell[],
    options?: { skipGoldenRestore: boolean; movedToPosition?: Position }
  ) => Promise<Board>;
  specialCells?: SpecialCell[];
  setSpecialCells?: (cells: SpecialCell[]) => void;
  onGoalCollected?: (position: Position, figureType: FigureType, goalIndex: number) => void;
  onBonusIncompatibleClick?: (message: string) => void;
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
  setScore,
  setGoals,
  setMatches,
  goals,
  processMatches,
  specialCells = [],
  setSpecialCells,
  onGoalCollected,
  onBonusIncompatibleClick,
}: UseInputHandlersProps) => {
  const [modernProductsSourcePos, setModernProductsSourcePos] = useState<Position | null>(null);
  const [explosionPositions, setExplosionPositions] = useState<Position[]>([]);
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
    _bonusType?: string
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

  // BFS: collect all positions cleared by a bomb (chain explosions included).
  // excludePos: position that won't be cleared (source figure moving there).
  const collectExplosion = (
    workBoard: Board,
    bombPos: Position,
    excludePos?: Position
  ): {
    newBoard: Board;
    removedFigures: Array<{ position: Position; figure: Figure }>;
    removedGoldenCells: Position[];
    blastPositions: Position[];
  } => {
    const newBoard = workBoard.map((row) => [...row]);
    const removedFigures: Array<{ position: Position; figure: Figure }> = [];
    const removedGoldenCells: Position[] = [];

    const toExplode: Position[] = [bombPos];
    const explodedBombs = new Set<string>([`${bombPos.row},${bombPos.col}`]);
    const clearedPositions = new Set<string>([`${bombPos.row},${bombPos.col}`]);

    while (toExplode.length > 0) {
      const cur = toExplode.shift()!;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = cur.row + dr;
          const c = cur.col + dc;
          if (r < 0 || r >= BOARD_ROWS || c < 0 || c >= (newBoard[0]?.length ?? 0)) continue;
          if (excludePos && r === excludePos.row && c === excludePos.col) continue;

          const key = `${r},${c}`;
          if (clearedPositions.has(key)) continue;
          clearedPositions.add(key);

          const figure = newBoard[r][c];
          if (!figure) continue;

          if (figure.type === "bomb" && !explodedBombs.has(key)) {
            // Chain explosion
            explodedBombs.add(key);
            toExplode.push({ row: r, col: c });
          } else if (
            figure.type !== "teamCell" &&
            figure.type !== "team" &&
            figure.type !== "star" &&
            figure.type !== "diamond" &&
            !isTeamImage(figure.type)
          ) {
            removedFigures.push({ position: { row: r, col: c }, figure });
            const isGolden = specialCells?.some(
              (sc) => sc.row === r && sc.col === c && sc.type === "golden" && sc.isActive
            );
            if (isGolden) removedGoldenCells.push({ row: r, col: c });
          }
        }
      }
    }

    clearedPositions.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      const fig = newBoard[r][c];
      if (
        fig &&
        fig.type !== "teamCell" &&
        fig.type !== "team" &&
        fig.type !== "star" &&
        fig.type !== "diamond" &&
        !isTeamImage(fig.type)
      ) {
        newBoard[r][c] = null;
      }
    });

    const blastPositions = [...clearedPositions]
      .map((key) => {
        const [r, c] = key.split(",").map(Number);
        return { row: r, col: c };
      })
      .filter(({ row, col }) => {
        const fig = newBoard[row][col];
        return !fig || (fig.type !== "team" && !isTeamImage(fig.type));
      });

    return { newBoard, removedFigures, removedGoldenCells, blastPositions };
  };

  const triggerGoalAnimations = (
    removedFigures: Array<{ position: Position; figure: Figure }>,
    removedGoldenCells: Position[]
  ) => {
    if (!onGoalCollected) return;

    removedGoldenCells.forEach((pos) => {
      const idx = goals.findIndex((g) => g.figure === "goldenCell");
      if (idx !== -1) onGoalCollected(pos, "goldenCell", idx);
    });

    removedFigures.forEach(({ position, figure }) => {
      if (figure.type === "goldenCell") return;
      const idx = goals.findIndex((g) => g.figure === figure.type);
      if (idx !== -1) onGoalCollected(position, figure.type, idx);
    });
  };

  const applyTeamBombGoal = (
    blastPositions: Position[],
    currentBoard: Board
  ): Board => {
    const teamCellsHit = blastPositions.filter((pos) =>
      specialCells?.some(
        (sc) => sc.row === pos.row && sc.col === pos.col && sc.type === "team" && sc.isActive !== false
      )
    );
    if (teamCellsHit.length === 0) return currentBoard;

    const teamGoalIndex = goals.findIndex((g) => g.figure === "teamCell");
    if (teamGoalIndex === -1) return currentBoard;

    const teamGoal = goals[teamGoalIndex];
    const oldCollected = teamGoal.collected;
    const newCollected = Math.min(oldCollected + 1, teamGoal.target);

    setGoals((prev) => {
      const next = [...prev];
      next[teamGoalIndex] = { ...next[teamGoalIndex], collected: newCollected };
      return next;
    });

    if (onGoalCollected) {
      onGoalCollected(teamCellsHit[0], "teamCell", teamGoalIndex);
    }

    let updatedBoard = currentBoard;
    if (newCollected >= 14 && oldCollected < 14) {
      updatedBoard = progressTeamHappyThree(updatedBoard);
    } else if (newCollected >= 9 && oldCollected < 9) {
      updatedBoard = progressTeamHappyTwo(updatedBoard);
    } else if (newCollected >= 4 && oldCollected < 4) {
      updatedBoard = progressTeamHappyOne(updatedBoard);
    }
    return updatedBoard;
  };

  // Click on a bomb → explode it (BFS chain explosions)
  const explodeBomb = async (bombPos: Position) => {
    const { newBoard, removedFigures, removedGoldenCells, blastPositions } = collectExplosion(
      board,
      bombPos
    );

    triggerGoalAnimations(removedFigures, removedGoldenCells);
    const updatedSpecialCells = updateGoalsAndSpecialCells(removedFigures, removedGoldenCells);
    setMoves((prev) => (prev <= 0 ? 0 : prev - 1));
    if (removedFigures.length > 0) {
      setScore((prev) => prev + removedFigures.length * 10);
    }

    const boardAfterTeam = applyTeamBombGoal(blastPositions, newBoard);

    setIsAnimating(true);
    try {
      setExplosionPositions(blastPositions);
      await new Promise((r) => setTimeout(r, 280));

      setBoard([...boardAfterTeam]);
      setExplosionPositions([]);
      await new Promise((r) => setTimeout(r, ANIMATION_DURATION));

      let updatedBoard = await applyGravityAndFillStepwise(
        boardAfterTeam,
        LEVELS[levelState.currentLevel - 1]
      );

      if (processMatches) {
        updatedBoard = await processMatches(updatedBoard, updatedSpecialCells, {
          skipGoldenRestore: false,
        });
      }

      setBoard([...updatedBoard]);
    } finally {
      setIsAnimating(false);
    }
  };

  // Drag figure onto a bomb → explode bomb + move figure there + process matches
  const explodeBombWithSwap = async (srcPos: Position, bombPos: Position) => {
    const srcFigure = board[srcPos.row]?.[srcPos.col];
    if (!srcFigure) return;

    const { newBoard, removedFigures, removedGoldenCells, blastPositions } = collectExplosion(
      board,
      bombPos,
      srcPos // don't clear source position — figure is moving there
    );

    // Move source figure to bomb's position
    newBoard[bombPos.row][bombPos.col] = srcFigure;
    newBoard[srcPos.row][srcPos.col] = null;

    triggerGoalAnimations(removedFigures, removedGoldenCells);
    const updatedSpecialCells = updateGoalsAndSpecialCells(removedFigures, removedGoldenCells);
    setMoves((prev) => (prev <= 0 ? 0 : prev - 1));
    if (removedFigures.length > 0) {
      setScore((prev) => prev + removedFigures.length * 10);
    }

    const boardAfterTeam = applyTeamBombGoal(blastPositions, newBoard);

    setIsAnimating(true);
    try {
      setExplosionPositions(blastPositions);
      await new Promise((r) => setTimeout(r, 280));

      setBoard([...boardAfterTeam]);
      setExplosionPositions([]);
      await new Promise((r) => setTimeout(r, ANIMATION_DURATION));

      let updatedBoard = await applyGravityAndFillStepwise(
        boardAfterTeam,
        LEVELS[levelState.currentLevel - 1]
      );

      if (processMatches) {
        updatedBoard = await processMatches(updatedBoard, updatedSpecialCells, {
          skipGoldenRestore: false,
          movedToPosition: bombPos,
        });
      }

      setBoard([...updatedBoard]);
    } finally {
      setIsAnimating(false);
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
      const clickedFigure = board[position.row]?.[position.col];

      if (activeBonus?.isActive) {
        const incompatibleMessages: Partial<Record<string, string>> = {
          itSphere: "Бонус не работает с бомбами",
          dms: "Бонус не работает со звёздами",
          modernProducts: "Бонус не работает с алмазами",
        };
        const isIncompatible =
          (activeBonus.type === "itSphere" && clickedFigure?.type === "bomb") ||
          (activeBonus.type === "dms" && clickedFigure?.type === "star") ||
          (activeBonus.type === "modernProducts" && clickedFigure?.type === "diamond");
        if (isIncompatible) {
          onBonusIncompatibleClick?.(incompatibleMessages[activeBonus.type] ?? "");
          return;
        }
      }

      if (clickedFigure?.type === "bomb" && !(activeBonus?.isActive)) {
        await explodeBomb(position);
        return;
      }

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
          const targetFigure = board[position.row]?.[position.col];
          if (targetFigure?.type === "bomb") {
            await explodeBombWithSwap(gameState.selectedPosition, position);
          } else {
            await swapFigures(
              gameState.selectedPosition,
              position,
              gameState.moves,
              gameState.setMoves,
              specialCells
            );
          }
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

    const fig = board[position.row]?.[position.col];
    if (fig?.type === "bomb") return;

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
      const targetFigure = board[position.row]?.[position.col];
      const src = gameState.selectedPosition;
      gameState.setSelectedPosition(null);
      if (targetFigure?.type === "bomb") {
        void explodeBombWithSwap(src, position);
      } else {
        swapFigures(src, position, gameState.moves, gameState.setMoves, specialCells);
      }
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
    explosionPositions,
  };
};