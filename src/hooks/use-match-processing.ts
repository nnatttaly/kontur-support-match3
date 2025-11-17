import { useCallback } from "react";
import {
  Board,
  Match,
  GameModifiers,
  ActiveBonus,
  Bonus,
  Goal,
  Level,
  SpecialCell,
} from "types";
import { ANIMATION_DURATION } from "consts";
import {
  findAllMatches,
  updateBoardAfterMatches,
  applyGravity,
  fillEmptySlots,
} from "@utils/game-logic";
import { BONUS_EFFECTS } from "@utils/bonus-effects";
import {
  updateGoalsWithModifiers,
  calculateRoundScore,
} from "@utils/modifiers-utils";

type UseMatchProcessingProps = {
  setBoard: (board: Board) => void;
  setMatches: (matches: Match[]) => void;
  setScore: (updater: (score: number) => number) => void;
  setGoals: (updater: (goals: Goal[]) => Goal[]) => void;
  modifiers: GameModifiers;
  setModifiers: (modifiers: GameModifiers) => void;
  activeBonus: ActiveBonus | null;
  setActiveBonus: (bonus: ActiveBonus | null) => void;
  setBonuses: (updater: (bonuses: Bonus[]) => Bonus[]) => void;
  currentLevel?: Level;
  onSpecialCellsUpdate?: (specialCells: SpecialCell[]) => void;
};

export const useMatchProcessing = ({
  setBoard,
  setMatches,
  setScore,
  setGoals,
  modifiers,
  setModifiers,
  activeBonus,
  setActiveBonus,
  setBonuses,
  currentLevel,
  onSpecialCellsUpdate,
}: UseMatchProcessingProps) => {
  const processMatches = useCallback(
    async (currentBoard: Board): Promise<Board> => {
      let boardToProcess = currentBoard;
      let hasMatches = true;
      let totalRoundScore = 0;
      let usedModifiers = false;

      const initialSpecialCells = currentLevel?.specialCells || [];
      const updatedSpecialCells = [...initialSpecialCells];

      while (hasMatches) {
        const foundMatches = findAllMatches(boardToProcess);

        if (foundMatches.length === 0) {
          hasMatches = false;
          break;
        }

        let collectedGoldenCellsInThisRound = 0;

        foundMatches.forEach((match) => {
          match.positions.forEach((position) => {
            const specialCellIndex = updatedSpecialCells.findIndex(
              (cell) =>
                cell.row === position.row &&
                cell.col === position.col &&
                cell.isActive
            );

            if (specialCellIndex !== -1) {

              updatedSpecialCells[specialCellIndex] = {
                ...updatedSpecialCells[specialCellIndex],
                isActive: false,
              };
              collectedGoldenCellsInThisRound++;
            }
          });
        });

        if (onSpecialCellsUpdate && updatedSpecialCells.length > 0) {
          onSpecialCellsUpdate(updatedSpecialCells);
        }

        if (collectedGoldenCellsInThisRound > 0) {
          setGoals((prevGoals) => {
            const newGoals = [...prevGoals];
            const goldenGoalIndex = newGoals.findIndex(
              (goal) => goal.figure === "goldenCell"
            );

            if (goldenGoalIndex !== -1) {
              const progressIncrease = modifiers.doubleGoalProgress
                ? collectedGoldenCellsInThisRound * 2
                : collectedGoldenCellsInThisRound;

              const newCollected = Math.min(
                newGoals[goldenGoalIndex].collected + progressIncrease,
                newGoals[goldenGoalIndex].target
              );

              newGoals[goldenGoalIndex] = {
                ...newGoals[goldenGoalIndex],
                collected: newCollected,
              };
            }

            return newGoals;
          });
        }

        setGoals((prevGoals) => {
          const goalsWithoutGolden = prevGoals.filter(
            (goal) => goal.figure !== "goldenCell"
          );
          const updatedGoals = updateGoalsWithModifiers(
            goalsWithoutGolden,
            foundMatches,
            modifiers
          );

          const goldenGoal = prevGoals.find(
            (goal) => goal.figure === "goldenCell"
          );
          if (goldenGoal) {
            return [...updatedGoals, goldenGoal];
          }
          return updatedGoals;
        });

        const roundScore = calculateRoundScore(foundMatches, modifiers);
        totalRoundScore += roundScore;

        if (modifiers.doublePoints || modifiers.doubleGoalProgress) {
          usedModifiers = true;
        }

        setMatches(foundMatches);
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

        boardToProcess = updateBoardAfterMatches(boardToProcess);
        setBoard(boardToProcess);
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

        setMatches([]);

        boardToProcess = applyGravity(boardToProcess);
        setBoard(boardToProcess);
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

        const tempLevel = currentLevel
          ? {
              ...currentLevel,
              specialCells: updatedSpecialCells,
            }
          : undefined;

        boardToProcess = fillEmptySlots(boardToProcess, tempLevel);
        setBoard(boardToProcess);
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));
      }

      if (totalRoundScore > 0) {
        setScore((prevScore) => prevScore + totalRoundScore);
      }

      if (usedModifiers && activeBonus) {
        const bonusEffect = BONUS_EFFECTS[activeBonus.type];

        if (bonusEffect.reset) {
          setModifiers(bonusEffect.reset());
        }

        setActiveBonus(null);

        if (!bonusEffect.isInstant) {
          setBonuses((prevBonuses) => {
            const newBonuses = [...prevBonuses];
            const bonusIndex = newBonuses.findIndex(
              (bonus) => bonus.type === activeBonus.type
            );

            if (bonusIndex !== -1 && newBonuses[bonusIndex].count > 0) {
              newBonuses[bonusIndex] = {
                ...newBonuses[bonusIndex],
                count: newBonuses[bonusIndex].count - 1,
              };
            }

            return newBonuses;
          });
        }
      }

      return boardToProcess;
    },
    [
      setBoard,
      setMatches,
      setScore,
      setGoals,
      modifiers,
      setModifiers,
      setActiveBonus,
      setBonuses,
      activeBonus,
      currentLevel,
      onSpecialCellsUpdate,
    ]
  );

  return {
    processMatches,
  };
};
