import { useCallback } from "react";
import { Match, Goal } from "types";

export const useGoals = (
  setGoals: (updater: (goals: Goal[]) => Goal[]) => void
) => {
  const updateGoals = useCallback(
    (foundMatches: Match[]) => {
      setGoals((prevGoals) => {
        const newGoals = [...prevGoals];

        foundMatches.forEach((match) => {
          const goalIndex = newGoals.findIndex(
            (goal) => goal.figure === match.figure
          );
          if (goalIndex !== -1) {
            newGoals[goalIndex] = {
              ...newGoals[goalIndex],
              collected: Math.min(
                newGoals[goalIndex].collected + match.positions.length,
                newGoals[goalIndex].target
              ),
            };
          }
        });

        return newGoals;
      });
    },
    [setGoals]
  );

  return {
    updateGoals,
  };
};
