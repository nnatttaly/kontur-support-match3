import { useState, useEffect } from "react";
import { useBoardState } from "./use-board-state";
import { useGameState } from "./use-game-state";
import { useBonuses } from "./use-bonuses";
import { useGameActions } from "./use-game-actions";
import { useLevelManagement } from "./use-level-management";
import { useInputHandlers } from "./use-input-handlers";
import { SpecialCell, Level } from "types";

export const useGameLogic = () => {
  const { board, setBoard } = useBoardState();
  const gameState = useGameState();
  const [currentSpecialCells, setCurrentSpecialCells] = useState<SpecialCell[]>([]);
  
  const { levelState, currentLevel, handleLevelStart } = useLevelManagement({
    setBoard,
    gameState,
    isAnimating: gameState.isAnimating,
  });

  useEffect(() => {
    if (currentLevel?.specialCells) {
      setCurrentSpecialCells(currentLevel.specialCells);
    } else {
      setCurrentSpecialCells([]);
    }
  }, [currentLevel]);

  const currentLevelWithSpecialCells: Level | undefined = currentLevel
    ? {
        ...currentLevel,
        specialCells: currentSpecialCells,
      }
    : undefined;

  const { areAdjacent, swapFigures, processMatches } = useGameActions({
    board,
    setBoard,
    setIsSwapping: gameState.setIsSwapping,
    setIsAnimating: gameState.setIsAnimating,
    setMatches: gameState.setMatches,
    setScore: gameState.setScore,
    setGoals: gameState.setGoals,
    modifiers: gameState.modifiers,
    setModifiers: gameState.setModifiers,
    activeBonus: gameState.activeBonus,
    setActiveBonus: gameState.setActiveBonus,
    setBonuses: gameState.setBonuses,
    currentLevel: currentLevelWithSpecialCells,
    onSpecialCellsUpdate: setCurrentSpecialCells,
  });

  const { handleBonus, deactivateBonus } = useBonuses({
    setBonuses: gameState.setBonuses,
    setBoard,
    setIsAnimating: gameState.setIsAnimating,
    activeBonus: gameState.activeBonus,
    setActiveBonus: gameState.setActiveBonus,
    setMoves: gameState.setMoves,
    setModifiers: gameState.setModifiers,
    setGoals: gameState.setGoals,
    processMatches,
    currentLevelId: currentLevel?.id,
  });

  const { 
    handleCellClick, 
    handleDragStart, 
    handleDragOver, 
    handleUseBonus, 
    resetSelection,
    modernProductsSourcePos,
  } = useInputHandlers({
    levelState,
    gameState: {
      selectedPosition: gameState.selectedPosition,
      isSwapping: gameState.isSwapping,
      isAnimating: gameState.isAnimating,
      moves: gameState.moves,
      setSelectedPosition: gameState.setSelectedPosition,
      setIsSwapping: gameState.setIsSwapping,
      setIsAnimating: gameState.setIsAnimating,
      setMoves: gameState.setMoves,
      setMatches: gameState.setMatches,
    },
    areAdjacent,
    swapFigures,
    handleBonus,
    board,
    activeBonus: gameState.activeBonus,
    setActiveBonus: gameState.setActiveBonus,
    setBonuses: gameState.setBonuses,
    setBoard,
    setIsAnimating: gameState.setIsAnimating,
    setMoves: gameState.setMoves,
    setGoals: gameState.setGoals,
    setMatches: gameState.setMatches,
    processMatches,
  });

  return {
    board,
    selectedPosition: gameState.selectedPosition,
    modernProductsSourcePos,
    isSwapping: gameState.isSwapping,
    isAnimating: gameState.isAnimating,
    matches: gameState.matches,
    score: gameState.score,
    moves: gameState.moves,
    goals: gameState.goals,
    bonuses: gameState.bonuses,
    activeBonus: gameState.activeBonus,
    modifiers: gameState.modifiers,
    specialCells: currentSpecialCells,
    levelState,
    currentLevel: currentLevelWithSpecialCells,
    handleCellClick,
    handleDragStart,
    handleDragOver,
    useBonus: handleUseBonus,
    deactivateBonus,
    resetSelection,
    handleLevelStart,
  };
};