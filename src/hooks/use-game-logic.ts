import { Position, Bonus } from "types";
import { useBoardState } from "./use-board-state";
import { useGameState } from "./use-game-state";
import { useGoals } from "./use-goals";
import { useBonuses } from "./use-bonuses";
import { useGameActions } from "./use-game-actions";

export const useGameLogic = () => {
  // Состояния
  const { board, setBoard } = useBoardState();
  const gameState = useGameState();

  // Логика
  const { updateGoals } = useGoals(gameState.setGoals);
  const { handleBonus } = useBonuses(
    gameState.setBonuses,
    setBoard,
    gameState.setIsAnimating
  );
  const { areAdjacent, swapFigures } = useGameActions(
    board,
    setBoard,
    gameState.setIsSwapping,
    gameState.setIsAnimating,
    gameState.setMatches,
    gameState.setScore,
    updateGoals
  );

  // Обработчики событий
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

  // Функция для использования бонуса
  const handleUseBonus = (type: Bonus["type"]) => {
    if (gameState.isAnimating) return;
    handleBonus(type, board);
  };

  const resetSelection = () => gameState.setSelectedPosition(null);

  return {
    // Состояние
    board,
    selectedPosition: gameState.selectedPosition,
    isSwapping: gameState.isSwapping,
    isAnimating: gameState.isAnimating,
    matches: gameState.matches,
    score: gameState.score,
    moves: gameState.moves,
    goals: gameState.goals,
    bonuses: gameState.bonuses,

    // Действия
    handleCellClick,
    handleDragStart,
    handleDragOver,
    useBonus: handleUseBonus,
    resetSelection,
  };
};
