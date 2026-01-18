import { useState, useEffect, useRef } from "react";
import { LevelState, Bonus, Board, GameState } from "types";
import { LEVELS } from "consts";
import { getLevelGoals, getLevelMoves } from "@utils/level-utils";
import { createInitialBoard } from "@utils/game-logic";
import { getRandomBonusesForLevel6 } from "@utils/bonus-utils";

type UseLevelManagementProps = {
  setBoard: (board: Board) => void;
  gameState: GameState;
  isAnimating: boolean;
};

export const useLevelManagement = ({
  setBoard,
  gameState,
  isAnimating,
}: UseLevelManagementProps) => {
  const isLevelInitialized = useRef(false);
  const [completionTriggered, setCompletionTriggered] = useState(false);
  // Флаг для блокировки повторного выполнения логики завершения уровня
  const isProcessingCompletion = useRef(false);

  const [levelState, setLevelState] = useState<LevelState>({
    currentLevel: 0,
    isLevelComplete: false,
    isLevelTransition: true,
    selectedBonuses: [],
    isLevelFailed: false,
  });

  const currentLevel =
    LEVELS.find((level) => level.id === levelState.currentLevel) || LEVELS[0];

  /**
   * Получение случайных бонусов для уровня 6
   */
  const getRandomBonuses = (): Bonus[] => {
    return getRandomBonusesForLevel6();
  };

  /**
   * Обработчик провала уровня
   */
  const handleLevelFailed = () => {
    // Защита от повторного вызова
    if (isProcessingCompletion.current) return;
    isProcessingCompletion.current = true;

    console.log(`Уровень ${levelState.currentLevel} провален: закончились ходы`);
    setCompletionTriggered(true);

    setTimeout(() => {
      setLevelState((prev) => ({
        ...prev,
        isLevelFailed: true,
        isLevelTransition: true,
      }));
      isLevelInitialized.current = false;
      setCompletionTriggered(false);
      isProcessingCompletion.current = false; // Сбрасываем флаг
    }, 300);
  };

  /**
   * restartCurrentLevel
   *
   * Resets the current level to its initial state:
   * - resets goals, moves, score, matches, selections, animations, modifiers, bonuses
   * - creates a fresh board via createInitialBoard and sets it via setBoard
   *
   * SPECIFIC RUNTIME COMMENT: this function logs the string
   * "RESTART_CURRENT_LEVEL: invoked for level <levelId> at <ISO timestamp>"
   * on every invocation (so you can find every restart in logs).
   */
  const restartCurrentLevel = () => {
    console.log(
      `RESTART_CURRENT_LEVEL: invoked for level ${levelState.currentLevel} at ${new Date().toISOString()}`
    );

    const levelGoals = getLevelGoals(levelState.currentLevel);
    const levelMoves = getLevelMoves(levelState.currentLevel);

    gameState.setGoals(() =>
      levelGoals.map((goal) => ({ ...goal, collected: 0 }))
    );
    gameState.setMoves(() => levelMoves);
    gameState.setScore(() => 0);
    gameState.setMatches([]);
    gameState.setSelectedPosition(null);
    gameState.setIsSwapping(false);
    gameState.setIsAnimating(false);
    gameState.setActiveBonus(null);
    gameState.setModifiers({
      doublePoints: false,
      doubleGoalProgress: false,
      extraMoves: 0,
    });

    let bonusesToSet: Bonus[] = [];

    if (levelState.currentLevel === 6) {
      // Для уровня 6 используем уже сохраненные случайные бонусы
      bonusesToSet = levelState.selectedBonuses;
    } else if (levelState.selectedBonuses.length > 0) {
      // Для остальных уровней используем выбранные бонусы
      bonusesToSet = levelState.selectedBonuses;
    } else if (currentLevel.bonuses.length > 0) {
      // Используем бонусы, заданные в уровне
      bonusesToSet = currentLevel.bonuses;
    }

    gameState.setBonuses(() => bonusesToSet);

    const newBoard = createInitialBoard(currentLevel);
    setBoard(newBoard);

    isLevelInitialized.current = true;
    setCompletionTriggered(false);
    isProcessingCompletion.current = false;
  };

  // Effect: monitor moves & goals
  useEffect(() => {
    // Блокировка при различных условиях или если уже обрабатывается завершение
    if (
      levelState.isLevelTransition ||
      levelState.isLevelComplete ||
      !isLevelInitialized.current ||
      isProcessingCompletion.current
    ) {
      return;
    }

    // For non-move completion (objective-based) finishes:
    const allGoalsCompleted = gameState.goals.every(
      (goal) => goal.collected >= goal.target
    );

    if (allGoalsCompleted && !isAnimating && !completionTriggered) {
      console.log("Уровень", currentLevel.id, "завершен: все цели выполнены");
      setCompletionTriggered(true);
      isProcessingCompletion.current = true; // Устанавливаем флаг

      setTimeout(() => {
        setLevelState((prev) => ({
          ...prev,
          isLevelComplete: true,
          isLevelTransition: true,
          isLevelFailed: false,
        }));
        isLevelInitialized.current = false;
        setCompletionTriggered(false);
        isProcessingCompletion.current = false; // Сбрасываем флаг
      }, 300);
      return;
    }

    // Если закончились ходы
    if (gameState.moves <= 0 && !isAnimating && !completionTriggered) {
      handleLevelFailed(); // Вызов вынесенной функции
      return;
    }
  }, [
    gameState.goals,
    gameState.moves,
    levelState.isLevelTransition,
    levelState.isLevelComplete,
    levelState.currentLevel,
    isAnimating,
    completionTriggered,
    currentLevel.id,
  ]);

  // Initialization effect
  useEffect(() => {
    if (levelState.isLevelTransition) {
      isLevelInitialized.current = false;
      setCompletionTriggered(false);
      isProcessingCompletion.current = false; // Сброс флага при переходе
      return;
    }

    if (isLevelInitialized.current) return;

    const levelGoals = getLevelGoals(levelState.currentLevel);
    const levelMoves = getLevelMoves(levelState.currentLevel);

    gameState.setGoals(() =>
      levelGoals.map((goal) => ({ ...goal, collected: 0 }))
    );
    gameState.setMoves(() => levelMoves);
    gameState.setScore(() => 0);
    gameState.setMatches([]);
    gameState.setSelectedPosition(null);
    gameState.setIsSwapping(false);
    gameState.setIsAnimating(false);
    gameState.setActiveBonus(null);
    gameState.setModifiers({
      doublePoints: false,
      doubleGoalProgress: false,
      extraMoves: 0,
    });

    let bonusesToSet: Bonus[] = [];

    if (levelState.currentLevel === 6) {
      // Для уровня 6 выбираем случайные бонусы с разным количеством
      // Если бонусы уже есть в selectedBonuses (например, при переходе с LevelStartModal), используем их
      if (levelState.selectedBonuses.length > 0) {
        bonusesToSet = levelState.selectedBonuses;
      } else {
        // Иначе генерируем новые (например, при рестарте или переходе из предыдущего уровня)
        bonusesToSet = getRandomBonuses();
        // Обновляем state с новыми бонусами
        setLevelState(prev => ({
          ...prev,
          selectedBonuses: bonusesToSet
        }));
      }
    } else if (levelState.selectedBonuses.length > 0) {
      // Для остальных уровней используем выбранные бонусы (но это только если игрок выбирал бонусы)
      bonusesToSet = levelState.selectedBonuses;
    } else if (currentLevel.bonuses.length > 0) {
      // Используем бонусы, заданные в уровне
      bonusesToSet = currentLevel.bonuses;
    }

    gameState.setBonuses(() => bonusesToSet);

    const newBoard = createInitialBoard(currentLevel);
    setBoard(newBoard);

    isLevelInitialized.current = true;
    setCompletionTriggered(false);
  }, [
    levelState.currentLevel,
    levelState.isLevelTransition,
    levelState.selectedBonuses,
    setBoard,
    gameState,
    currentLevel,
  ]);

  const handleLevelStart = (nextLevel: number, selectedBonuses: Bonus[]) => {
    const nextLevelData = LEVELS.find((level) => level.id === nextLevel);

    if (!nextLevelData) {
      return;
    }

    // Используем переданные бонусы (для уровня 6 это случайные бонусы из LevelTransition)
    setLevelState({
      currentLevel: nextLevel,
      isLevelComplete: false,
      isLevelTransition: false,
      selectedBonuses: selectedBonuses, // ← Используем переданные бонусы
      isLevelFailed: false,
    });

    isLevelInitialized.current = false;
    setCompletionTriggered(false);
    isProcessingCompletion.current = false;
  };

  // Функция для получения бонусов для отображения в LevelStartModal
  const getBonusesForLevelStartModal = (levelId: number): Bonus[] => {
    if (levelId === 6) {
      // Для уровня 6 генерируем случайные бонусы для предпоказа
      return getRandomBonuses();
    }
    
    const level = LEVELS.find(l => l.id === levelId);
    return level?.bonuses || [];
  };

  return {
    levelState,
    currentLevel,
    handleLevelStart,
    restartCurrentLevel,
    getBonusesForLevelStartModal,
  };
};