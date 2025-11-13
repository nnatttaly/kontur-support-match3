import { Position, Bonus } from "types";
import { useBoardState } from "@hooks/use-board-state";
import { useGameState } from "@hooks/use-game-state";
import { useGoals } from "@hooks/use-goals";
import { useBonuses } from "@hooks/use-bonuses";
import { useGameActions } from "@hooks/use-game-actions";

export const useGameLogic = () => {
  const { board, setBoard } = useBoardState();
  const gameState = useGameState();

  const { updateGoals } = useGoals(gameState.setGoals);
  const { handleBonus, deactivateBonus } = useBonuses(
    gameState.setBonuses,
    setBoard,
    gameState.setIsAnimating,
    gameState.setModifiers,
    gameState.activeBonus,
    gameState.setActiveBonus
  );
  const { areAdjacent, swapFigures } = useGameActions(
    board,
    setBoard,
    gameState.setIsSwapping,
    gameState.setIsAnimating,
    gameState.setMatches,
    gameState.setScore,
    updateGoals,
    gameState.modifiers,
    gameState.setModifiers,
    gameState.setActiveBonus,
    gameState.setBonuses
  );

  const handleCellClick = (position: Position) => {
    if (gameState.isSwapping || gameState.isAnimating || gameState.moves <= 0)
      return;

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
    if (gameState.isSwapping || gameState.isAnimating || gameState.moves <= 0)
      return;
    gameState.setSelectedPosition(position);
  };

  const handleDragOver = (position: Position) => {
    if (
      !gameState.selectedPosition ||
      gameState.isSwapping ||
      gameState.isAnimating ||
      gameState.moves <= 0
    )
      return;

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
    if (gameState.isAnimating) return;
    handleBonus(type, board);
  };

  const resetSelection = () => gameState.setSelectedPosition(null);

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

    handleCellClick,
    handleDragStart,
    handleDragOver,
    useBonus: handleUseBonus,
    deactivateBonus,
    resetSelection,
  };
};
