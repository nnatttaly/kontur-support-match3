import { useState, useEffect, useRef } from "react";
import { LevelState, BonusType, Board, GameState } from "types";
import { LEVELS } from "consts";
import { getLevelGoals, getLevelMoves } from "@utils/level-utils";
import { createInitialBoard } from "@utils/game-logic";

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
   * Обработчик провала уровня
   */
  const handleLevelFailed = () => {
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

    if (levelState.selectedBonuses.length > 0) {
      const selectedBonusesWithCount = levelState.selectedBonuses.map(
        (type) => ({
          type,
          count: 3,
        })
      );
      gameState.setBonuses(() => selectedBonusesWithCount);
    } else {
      gameState.setBonuses(() => []);
    }

    const newBoard = createInitialBoard(currentLevel);
    setBoard(newBoard);

    isLevelInitialized.current = true;
    setCompletionTriggered(false);
  };

  // Effect: monitor moves & goals
  useEffect(() => {
    if (
      levelState.isLevelTransition ||
      levelState.isLevelComplete ||
      !isLevelInitialized.current
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

      setTimeout(() => {
        setLevelState((prev) => ({
          ...prev,
          isLevelComplete: true,
          isLevelTransition: true,
          isLevelFailed: false,
        }));
        isLevelInitialized.current = false;
        setCompletionTriggered(false);
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

    if (levelState.selectedBonuses.length > 0) {
      const selectedBonusesWithCount = levelState.selectedBonuses.map(
        (type) => ({
          type,
          count: 3,
        })
      );
      gameState.setBonuses(() => selectedBonusesWithCount);
    } else {
      gameState.setBonuses(() => []);
    }

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

  const handleLevelStart = (nextLevel: number, selectedBonuses: BonusType[]) => {
    const nextLevelData = LEVELS.find((level) => level.id === nextLevel);

    if (!nextLevelData) {
      return;
    }

    setLevelState({
      currentLevel: nextLevel,
      isLevelComplete: false,
      isLevelTransition: false,
      selectedBonuses,
      isLevelFailed: false,
    });

    isLevelInitialized.current = false;
    setCompletionTriggered(false);
  };

  return {
    levelState,
    currentLevel,
    handleLevelStart,
    restartCurrentLevel,
  };
};