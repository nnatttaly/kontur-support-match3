import { useState } from "react";
import { Position, Bonus, Board, LevelState, ActiveBonus, Match, Figure } from "types";
import { BONUS_EFFECTS } from "@utils/bonus-effects/effects-registry";
import { applyGravity, fillEmptySlots, findAllMatches, applyHorizontalGravity } from "@utils/game-logic";
import { ANIMATION_DURATION, BOARD_ROWS, LEVELS } from "consts";

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
    setMoves: (updater: (moves: number) => number) => void
  ) => Promise<boolean>;
  handleBonus: (type: Bonus["type"], board: Board) => void;
  board: Board;
  activeBonus: ActiveBonus | null;
  setActiveBonus: (b: ActiveBonus | null) => void;
  setBonuses: (updater: (bonuses: Bonus[]) => Bonus[]) => void;
  setBoard: (board: Board) => void;
  setIsAnimating: (animating: boolean) => void;
  setMoves: (updater: (moves: number) => number) => void;
  setGoals: (updater: (goals: import("types").Goal[]) => import("types").Goal[]) => void;
  setMatches: (matches: Match[]) => void;
  processMatches?: (board: Board) => Promise<Board>;
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
  processMatches,
}: UseInputHandlersProps) => {
  const [modernProductsSourcePos, setModernProductsSourcePos] = useState<Position | null>(null);
  const [openGuideCompleted, setOpenGuideCompleted] = useState<number[]>([]);

  // Функция для обработки алмазов и звезд в нижнем ряду
  const processSpecialFigures = (currentBoard: Board): { board: Board; hasSpecialFigures: boolean } => {
    let boardCopy = currentBoard.map(row => [...row]);
    let hasSpecialFigures = false;

    // Проверяем и удаляем алмазы в нижнем ряду
    for (let col = 0; col < boardCopy[0].length; col++) {
      if (boardCopy[BOARD_ROWS - 1]?.[col] === "diamond") {
        boardCopy[BOARD_ROWS - 1][col] = null;
        hasSpecialFigures = true;
        
        // Обновляем цели для алмазов
        setGoals((prev) => {
          const next = [...prev];
          const idx = next.findIndex((g) => g.figure === "diamond");
          if (idx !== -1) {
            const inc = 1; // один алмаз
            next[idx] = {
              ...next[idx],
              collected: Math.min(next[idx].collected + inc, next[idx].target),
            };
          }
          return next;
        });
      }
    }

    // Проверяем и удаляем звезды в нижнем ряду
    for (let col = 0; col < boardCopy[0].length; col++) {
      if (boardCopy[BOARD_ROWS - 1]?.[col] === "star") {
        boardCopy[BOARD_ROWS - 1][col] = null;
        hasSpecialFigures = true;
        
        // Обновляем цели для звезд
        setGoals((prev) => {
          const next = [...prev];
          const idx = next.findIndex((g) => g.figure === "star");
          if (idx !== -1) {
            const inc = 1; // одна звезда
            next[idx] = {
              ...next[idx],
              collected: Math.min(next[idx].collected + inc, next[idx].target),
            };
          }
          return next;
        });
      }
    }

    return { board: boardCopy, hasSpecialFigures };
  };

  const applyAndFinalizeBonus = async (
    type: string,
    boardWithHoles: Board,
    matchedPositions: Position[],
    effect: any
  ) => {
    // Уменьшаем количество бонусов и удаляем, если count=0 для 6-го уровня
    setBonuses((prev) => {
      const next = [...prev];
      const idx = next.findIndex((b) => b.type === type);
      if (idx !== -1 && next[idx].count > 0) {
        const newCount = next[idx].count - 1;
        
        // Для 6-го уровня удаляем бонус, если использований не осталось
        if (levelState.currentLevel === 6 && newCount <= 0) {
          next.splice(idx, 1);
        } else {
          next[idx] = { ...next[idx], count: newCount };
        }
      }
      return next;
    });

    effect?.onApply?.(setMoves);
    
    // Для openGuide в 6-м уровне нужно проверить, выполнилась ли цель
    if (type === "openGuide" && levelState.currentLevel === 6) {
      // Собираем информацию о выполненных целях после применения openGuide
      setGoals((prevGoals) => {
        const updatedGoals = [...prevGoals];
        const completedIndices: number[] = [];
        
        // Проверяем, какие цели выполнились после применения openGuide
        updatedGoals.forEach((goal, index) => {
          if (goal.collected >= goal.target) {
            completedIndices.push(index);
          }
        });

        // Если есть выполненные цели, заменяем их
        if (completedIndices.length > 0) {
          setOpenGuideCompleted(completedIndices);
          
          completedIndices.forEach((index) => {
            const currentFigures = updatedGoals.map(g => g.figure);
            // Получаем случайную фигуру
            const newFigure = getRandomFigureForLevel6(LEVELS[5].availableFigures || [], currentFigures);
            // Увеличиваем таргет на 1
            const newTarget = updatedGoals[index].target + 1;
            updatedGoals[index] = {
              figure: newFigure,
              target: newTarget,
              collected: 0
            };
          });
        }
        
        return updatedGoals;
      });
    } else {
      effect?.onApplyGoals?.(setGoals);
    }

    setIsAnimating(true);
    try {
      if (matchedPositions.length > 0) {
        const tempMatches: Match[] = [];
        const figureTypes = new Map<Figure, Position[]>();
        
        matchedPositions.forEach(pos => {
          const figure = board[pos.row][pos.col];
          if (figure) {
            if (!figureTypes.has(figure)) {
              figureTypes.set(figure, []);
            }
            figureTypes.get(figure)!.push(pos);
          }
        });

        figureTypes.forEach((positions, figure) => {
          tempMatches.push({ positions, figure });
        });

        setMatches(tempMatches);
        await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATION));
        setMatches([]);
      }

      setBoard([...boardWithHoles]);
      await new Promise(resolve => setTimeout(resolve, 200));

      let updatedBoard = applyGravity(boardWithHoles);
      setBoard([...updatedBoard]);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Проверяем и обрабатываем алмазы/звезды в нижнем ряду после гравитации
      let hasMoreSpecialFigures = true;
      while (hasMoreSpecialFigures) {
        const specialResult = processSpecialFigures(updatedBoard);
        if (specialResult.hasSpecialFigures) {
          updatedBoard = specialResult.board;
          setBoard([...updatedBoard]);
          await new Promise(resolve => setTimeout(resolve, 200));
          
          updatedBoard = applyGravity(updatedBoard);
          setBoard([...updatedBoard]);
          await new Promise(resolve => setTimeout(resolve, 200));
        } else {
          hasMoreSpecialFigures = false;
        }
      }

      let updatedBoardIsChanged = applyHorizontalGravity(updatedBoard);
      
      if (updatedBoardIsChanged.isChanged) {
        setBoard([...updatedBoardIsChanged.board]);
        await new Promise(resolve => setTimeout(resolve, 200));
        updatedBoard = applyGravity(updatedBoardIsChanged.board);
        setBoard(updatedBoard);
        await new Promise((r) => setTimeout(r, ANIMATION_DURATION/2));
        
        // Снова проверяем алмазы/звезды после горизонтальной гравитации
        hasMoreSpecialFigures = true;
        while (hasMoreSpecialFigures) {
          const specialResult = processSpecialFigures(updatedBoard);
          if (specialResult.hasSpecialFigures) {
            updatedBoard = specialResult.board;
            setBoard([...updatedBoard]);
            await new Promise(resolve => setTimeout(resolve, 200));
            
            updatedBoard = applyGravity(updatedBoard);
            setBoard([...updatedBoard]);
            await new Promise(resolve => setTimeout(resolve, 200));
          } else {
            hasMoreSpecialFigures = false;
          }
        }
      }

      console.log(LEVELS[levelState.currentLevel - 1].availableFigures);
      updatedBoard = fillEmptySlots(updatedBoard, LEVELS[levelState.currentLevel - 1]);
      setBoard([...updatedBoard]);
      await new Promise(resolve => setTimeout(resolve, 200));

      if (processMatches) {
        await processMatches(updatedBoard);
      }
    } finally {
      setIsAnimating(false);
      setActiveBonus(null);
    }
  };

  const handleCellClick = async (position: Position) => {
    if (
      levelState.isLevelTransition ||
      gameState.isSwapping ||
      gameState.isAnimating ||
      gameState.moves <= 0
    ) {
      return;
    }

    if (activeBonus && activeBonus.isActive && activeBonus.type !== "careerGrowth") {
      const effect = BONUS_EFFECTS[activeBonus.type];
      if (effect?.applyAt) {
        if (activeBonus.type === "remoteWork") {
          const result = effect.applyAt(board, position);
          await applyAndFinalizeBonus(activeBonus.type, result.board, result.matchedPositions, effect);
          return;
        }

        if (activeBonus.type === "itSphere") {
          const result = effect.applyAt(board, position);
          await applyAndFinalizeBonus(activeBonus.type, result.board, result.matchedPositions, effect);
          return;
        }

        if (activeBonus.type === "modernProducts") {
          if (!modernProductsSourcePos) {
            const fig = board[position.row][position.col];
            if (!fig) return;
            setModernProductsSourcePos(position);
            return;
          }

          // Второй клик: применяем бонус
          const sourcePos = modernProductsSourcePos;
          // СРАЗУ сбрасываем выделение
          setModernProductsSourcePos(null);
          
          const result = effect.applyAt(board, sourcePos as Position, position);
          await applyAndFinalizeBonus(activeBonus.type, result.board, result.matchedPositions, effect);
          return;
        }
      }
    }

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

    if (activeBonus && activeBonus.isActive && activeBonus.type !== "careerGrowth") {
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

    if (activeBonus && activeBonus.isActive && activeBonus.type !== "careerGrowth") {
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
    setModernProductsSourcePos(null);
    handleBonus(type, board);
  };

  const resetSelection = () => {
    gameState.setSelectedPosition(null);
    setModernProductsSourcePos(null);
  };

  // Вспомогательная функция для получения случайной фигуры для 6-го уровня
  const getRandomFigureForLevel6 = (availableFigures: Figure[], excludeFigures: Figure[] = []): Figure => {
    const filteredFigures = availableFigures.filter(
      fig => !["star", "diamond", "team", "teamImage0", "teamImage1", "teamImage2", "teamImage3", "goldenCell", "teamCell"].includes(fig)
    );
    
    const availableFiltered = filteredFigures.filter(fig => !excludeFigures.includes(fig));
    
    if (availableFiltered.length > 0) {
      return availableFiltered[Math.floor(Math.random() * availableFiltered.length)];
    }
    
    return filteredFigures[Math.floor(Math.random() * filteredFigures.length)];
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