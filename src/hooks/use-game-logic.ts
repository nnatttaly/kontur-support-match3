import { Position } from "types";
import { useBoardState } from "./use-board-state";
import { useGameState } from "./use-game-state";
import { useGoals } from "./use-goals";
import { useBonuses } from "./use-bonuses";
import { useGameActions } from "./use-game-actions";

export const useGameLogic = () => {
  const { board, setBoard } = useBoardState();
  const gameState = useGameState();

  const { updateGoals } = useGoals(gameState.setGoals);
  const { useBonus } = useBonuses(gameState.setBonuses);
  const { areAdjacent, swapFigures } = useGameActions(
    board,
    setBoard,
    gameState.setIsSwapping,
    gameState.setIsAnimating,
    gameState.setMatches,
    gameState.setScore,
    updateGoals
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

    handleCellClick,
    handleDragStart,
    handleDragOver,
    useBonus,
    resetSelection,
  };
};
