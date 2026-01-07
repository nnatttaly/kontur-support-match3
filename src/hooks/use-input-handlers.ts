import { useState } from "react";
import { Position, Bonus, Board, LevelState, ActiveBonus, Match, Figure, SpecialCell } from "types";
import { BONUS_EFFECTS } from "@utils/bonus-effects/effects-registry";
import { applyGravity, fillEmptySlots, applyHorizontalGravity } from "@utils/game-logic";
import { ANIMATION_DURATION, BOARD_ROWS, LEVELS } from "consts";
import { progressTeamHappyOne, progressTeamHappyTwo, progressTeamHappyThree } from "@utils/game-team-utils";
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
  specialCells?: SpecialCell[];
  setSpecialCells?: (cells: SpecialCell[]) => void;
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
  specialCells = [],
  setSpecialCells,
}: UseInputHandlersProps) => {
  const [modernProductsSourcePos, setModernProductsSourcePos] = useState<Position | null>(null);

  // Функция для обработки алмазов и звезд в нижнем ряду
  const processSpecialFigures = (currentBoard: Board): { board: Board; hasSpecialFigures: boolean } => {
    let boardCopy = currentBoard.map(row => [...row]);
    let hasSpecialFigures = false;

    // Проверяем и удаляем алмазы в нижнем ряду
    for (let col = 0; col < (boardCopy[0]?.length || 0); col++) {
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
    for (let col = 0; col < (boardCopy[0]?.length || 0); col++) {
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

  const updateGoalsForRemovedFigures = (
    removedFigures: Array<{position: Position, figure: Figure}>,
    removedGoldenCells: Position[]
  ) => {
    console.log('=== updateGoalsForRemovedFigures START ===');
    console.log('removedFigures:', removedFigures);
    console.log('removedGoldenCells:', removedGoldenCells);
    console.log('current specialCells:', specialCells);
    
    // Обрабатываем golden-cell
    if (removedGoldenCells.length > 0) {
      console.log(`Processing ${removedGoldenCells.length} golden cells`);
      
      // Создаем копию specialCells для обновления
      let updatedSpecialCells = specialCells ? [...specialCells] : [];
      let goldenCellsUpdated = false;
      
      removedGoldenCells.forEach(pos => {
        const cellIndex = updatedSpecialCells.findIndex(cell => 
          cell.row === pos.row && 
          cell.col === pos.col && 
          cell.type === 'golden'
        );
        
        if (cellIndex !== -1 && updatedSpecialCells[cellIndex].isActive !== false) {
          console.log(`Marking golden cell as inactive at ${pos.row},${pos.col}`);
          updatedSpecialCells[cellIndex] = {
            ...updatedSpecialCells[cellIndex],
            isActive: false,
          };
          goldenCellsUpdated = true;
        }
      });
      
      // Обновляем цели для golden-cell
      setGoals((prev) => {
        const next = prev.map(goal => {
          if (goal.figure === "goldenCell") {
            const inc = removedGoldenCells.length;
            console.log(`Adding ${inc} to goldenCell goal`);
            const newCollected = Math.min(goal.collected + inc, goal.target);
            console.log(`goldenCell: ${goal.collected} -> ${newCollected}`);
            return {
              ...goal,
              collected: newCollected
            };
          }
          return goal;
        });
        return next;
      });
      
      // Применяем обновленные specialCells
      if (goldenCellsUpdated && setSpecialCells) {
        console.log('Updating specialCells:', updatedSpecialCells);
        setSpecialCells(updatedSpecialCells);
      }
    }

    // Обновляем цели для удаленных фигур
    if (removedFigures.length > 0) {
      console.log(`Processing ${removedFigures.length} removed figures`);
      
      setGoals((prev) => {
        const figureCountMap = new Map<Figure, number>();

        removedFigures.forEach(({ figure }) => {
          const count = figureCountMap.get(figure) || 0;
          figureCountMap.set(figure, count + 1);
        });

        console.log('Figure count map:', Object.fromEntries(figureCountMap));

        const next = prev.map(goal => {
          if (figureCountMap.has(goal.figure)) {
            const count = figureCountMap.get(goal.figure)!;
            const newCollected = Math.min(goal.collected + count, goal.target);
            console.log(`${goal.figure}: ${goal.collected} -> ${newCollected} (+${count})`);
            return {
              ...goal,
              collected: newCollected
            };
          }
          return goal;
        });

        return next;
      });
    }
    
    console.log('=== updateGoalsForRemovedFigures END ===');
  };

  const applyAndFinalizeBonus = async (
    type: string,
    boardWithHoles: Board,
    matchedPositions: Position[],
    removedFigures: Array<{position: Position, figure: Figure}>,
    removedGoldenCells: Position[],
    effect: any
  ) => {
    console.log(`\n=== applyAndFinalizeBonus для ${type} START ===`);
    console.log('matchedPositions:', matchedPositions.length);
    console.log('removedFigures:', removedFigures);
    console.log('removedGoldenCells:', removedGoldenCells);
    
    // Для modernProducts: проверяем, что matchedPositions не пустой (фигура была изменена)
    if (type === "modernProducts") {
      if (matchedPositions.length === 0) {
        console.log("ModernProducts: matchedPositions пустой, бонус не тратится");
        setActiveBonus(null);
        return;
      }
    }

    // Для itSphere и remoteWork: если не было удалено ни одной фигуры, не тратим бонус
    if ((type === "itSphere" || type === "remoteWork") && matchedPositions.length === 0) {
      setActiveBonus(null);
      return;
    }

    // Уменьшаем количество бонусов
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

    // Обновляем цели для удаленных фигур и golden-cell
    if (type === "itSphere" || type === "remoteWork") {
      updateGoalsForRemovedFigures(removedFigures, removedGoldenCells);
    }

    effect?.onApply?.(setMoves);
    effect?.onApplyGoals?.(setGoals);

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
    console.log(`=== applyAndFinalizeBonus для ${type} END ===\n`);
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

    if (!board || !Array.isArray(board) || board.length === 0) {
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
        
        if (sourceFig === targetFig) {
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
          [], // removedFigures - не нужно для modernProducts
          [], // removedGoldenCells - не нужно для modernProducts
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

        if (activeBonus.type === "itSphere") {
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