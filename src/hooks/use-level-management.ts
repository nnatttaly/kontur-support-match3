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
  });

  const currentLevel =
    LEVELS.find((level) => level.id === levelState.currentLevel) || LEVELS[0];

  useEffect(() => {
    if (
      levelState.isLevelTransition ||
      levelState.isLevelComplete ||
      !isLevelInitialized.current
    ) {
      return;
    }

    // Для 6-го уровня проверяем только количество ходов
    if (currentLevel.id === 6) {
      // Завершаем уровень, когда ходы закончились и нет активной анимации
      if (gameState.moves <= 0 && !isAnimating && !completionTriggered) {
        console.log("6 уровень завершен: закончились ходы");
        setCompletionTriggered(true);

        setTimeout(() => {
          setLevelState((prev) => ({
            ...prev,
            isLevelComplete: true,
            isLevelTransition: true,
          }));
          isLevelInitialized.current = false;
          setCompletionTriggered(false);
        }, 300);
      }
      return; // Не проверяем цели для 6-го уровня
    }

    // Для обычных уровней проверяем выполнение целей
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
        }));
        isLevelInitialized.current = false;
        setCompletionTriggered(false);
      }, 300);
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

  const handleLevelStart = (selectedBonuses: BonusType[]) => {
    let nextLevel: number;

    if (levelState.isLevelComplete) {
      nextLevel = levelState.currentLevel + 1;
    } else {
      nextLevel = 1;
    }

    const nextLevelData = LEVELS.find((level) => level.id === nextLevel);

    if (!nextLevelData) {
      return;
    }

    setLevelState({
      currentLevel: nextLevel,
      isLevelComplete: false,
      isLevelTransition: false,
      selectedBonuses,
    });

    isLevelInitialized.current = false;
    setCompletionTriggered(false);
  };

  return {
    levelState,
    currentLevel,
    handleLevelStart,
  };
};