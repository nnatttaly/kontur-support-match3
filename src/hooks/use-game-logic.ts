import { useState, useEffect } from "react";
import { Position, Bonus, BonusType, LevelState } from "types";
import { LEVELS } from "consts/levels";
import { createInitialBoard } from "@utils/game-logic";
import { useBoardState } from "./use-board-state";
import { useGameState } from "./use-game-state";
import { useGoals } from "./use-goals";
import { useBonuses } from "./use-bonuses";
import { useGameActions } from "./use-game-actions";

export const useGameLogic = () => {
  // Состояния
  const { board, setBoard } = useBoardState();
  const gameState = useGameState();

  // Состояние уровней
  const [levelState, setLevelState] = useState<LevelState>({
    currentLevel: 1,
    isLevelComplete: false,
    isLevelTransition: false,
    selectedBonuses: [],
  });

  // Получаем текущий уровень
  const currentLevel =
    LEVELS.find((level) => level.id === levelState.currentLevel) || LEVELS[0];

  // Логика
  const { updateGoals } = useGoals(gameState.setGoals);
  const { handleBonus, deactivateBonus } = useBonuses(
    gameState.setBonuses,
    setBoard,
    gameState.setIsAnimating,
    gameState.activeBonus,
    gameState.setActiveBonus,
    gameState.setMoves
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
    gameState.activeBonus,
    gameState.setActiveBonus,
    gameState.setBonuses
  );

  // Проверка завершения уровня
  useEffect(() => {
    if (levelState.isLevelComplete) return;

    // Используем актуальные цели из gameState, а не из currentLevel
    const allGoalsCompleted = gameState.goals.every(
      (goal) => goal.collected >= goal.target
    );

    const scoreReached = gameState.score >= currentLevel.requiredScore;

    console.log("Проверка завершения уровня:", {
      goals: gameState.goals,
      allGoalsCompleted,
      score: gameState.score,
      requiredScore: currentLevel.requiredScore,
      scoreReached,
    });

    if (allGoalsCompleted && scoreReached) {
      setTimeout(() => {
        setLevelState((prev) => ({
          ...prev,
          isLevelComplete: true,
          isLevelTransition: true,
        }));
      }, 1000); 
    }
  }, [
    gameState.score,
    gameState.goals,
    levelState.isLevelComplete,
    currentLevel,
  ]);

  // Инициализация целей при загрузке
  useEffect(() => {
    // Устанавливаем цели из текущего уровня при первом рендере
    if (gameState.goals.length === 0) {
      gameState.setGoals(currentLevel.goals);
      gameState.setMoves(currentLevel.moves);
    }
  }, []);

  // Обработчики событий
  const handleCellClick = (position: Position) => {
    if (
      gameState.isSwapping ||
      gameState.isAnimating ||
      gameState.moves <= 0 ||
      levelState.isLevelTransition
    ) {
      return;
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
      gameState.isSwapping ||
      gameState.isAnimating ||
      gameState.moves <= 0 ||
      levelState.isLevelTransition
    ) {
      return;
    }
    gameState.setSelectedPosition(position);
  };

  const handleDragOver = (position: Position) => {
    if (
      !gameState.selectedPosition ||
      gameState.isSwapping ||
      gameState.isAnimating ||
      gameState.moves <= 0 ||
      levelState.isLevelTransition
    ) {
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

  // Функция для использования бонуса
  const handleUseBonus = (type: Bonus["type"]) => {
    if (gameState.isAnimating || levelState.isLevelTransition) {
      return;
    }
    handleBonus(type, board);
  };

  // Функция начала нового уровня
  const handleLevelStart = (selectedBonuses: BonusType[]) => {
    const nextLevel = levelState.currentLevel + 1;
    const nextLevelData = LEVELS.find((level) => level.id === nextLevel);

    if (!nextLevelData) {
      // Игра завершена - просто остаемся на последнем уровне
      setLevelState((prev) => ({
        ...prev,
        isLevelComplete: false,
        isLevelTransition: false,
      }));
      return;
    }

    // Сбрасываем состояние для нового уровня
    gameState.setGoals(nextLevelData.goals);
    gameState.setMoves(nextLevelData.moves);
    gameState.setScore(0);
    gameState.setBonuses(selectedBonuses.map((type) => ({ type, count: 1 })));

    setLevelState((prev) => ({
      ...prev,
      currentLevel: nextLevel,
      isLevelComplete: false,
      isLevelTransition: false,
      selectedBonuses,
    }));

    // Пересоздаем доску
    const newBoard = createInitialBoard();
    setBoard(newBoard);
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
    activeBonus: gameState.activeBonus,
    modifiers: gameState.modifiers,

    // Уровни
    levelState,
    currentLevel,

    // Действия
    handleCellClick,
    handleDragStart,
    handleDragOver,
    useBonus: handleUseBonus,
    deactivateBonus,
    resetSelection,
    handleLevelStart,
  };
};
