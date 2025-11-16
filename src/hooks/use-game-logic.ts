import { useBoardState } from "./use-board-state";
import { useGameState } from "./use-game-state";
import { useBonuses } from "./use-bonuses";
import { useGameActions } from "./use-game-actions";
import { useLevelManagement } from "./use-level-management";
import { useInputHandlers } from "./use-input-handlers";

export const useGameLogic = () => {
  const { board, setBoard } = useBoardState();
  const gameState = useGameState();

  const { levelState, currentLevel, handleLevelStart } = useLevelManagement({
    setBoard,
    gameState,
  });

  const { handleBonus, deactivateBonus } = useBonuses(
    gameState.setBonuses,
    setBoard,
    gameState.setIsAnimating,
    gameState.activeBonus,
    gameState.setActiveBonus,
    gameState.setMoves,
    gameState.setModifiers
  );

  const { areAdjacent, swapFigures } = useGameActions(
    board,
    setBoard,
    gameState.setIsSwapping,
    gameState.setIsAnimating,
    gameState.setMatches,
    gameState.setScore,
    gameState.setGoals,
    gameState.modifiers,
    gameState.setModifiers,
    gameState.activeBonus,
    gameState.setActiveBonus,
    gameState.setBonuses
  );

  const {
    handleCellClick,
    handleDragStart,
    handleDragOver,
    handleUseBonus,
    resetSelection,
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
    },
    areAdjacent,
    swapFigures,
    handleBonus,
    board,
  });

  return {
    board,
    selectedPosition: gameState.selectedPosition,
    isSwapping: gameState.isSwapping,
    isAnimating: gameState.isAnimating,
    matches: gameState.matches,
    score: gameState.score,
    moves: gameState.moves,
    goals: gameState.goals,
    bonuses: gameState.bonuses,
    activeBonus: gameState.activeBonus,
    modifiers: gameState.modifiers,

    levelState,
    currentLevel,

    handleCellClick,
    handleDragStart,
    handleDragOver,
    useBonus: handleUseBonus,
    deactivateBonus,
    resetSelection,
    handleLevelStart,
  };
};
