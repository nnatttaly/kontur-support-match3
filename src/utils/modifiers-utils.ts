import { GameModifiers, Match, Goal } from "types";

export const applyModifiersToScore = (
  baseScore: number,
  modifiers: GameModifiers
): number => {
  return modifiers.doublePoints ? baseScore * 2 : baseScore;
};

export const applyModifiersToGoalProgress = (
  progress: number,
  modifiers: GameModifiers
): number => {
  return modifiers.doubleGoalProgress ? progress * 2 : progress;
};

export const updateGoalsWithModifiers = (
  goals: Goal[],
  matches: Match[],
  modifiers: GameModifiers
): Goal[] => {
  const newGoals = [...goals];

  matches.forEach((match) => {
    // goldenCell не даёт прогресса
    if (match.figure === "goldenCell" || match.figure === "teamCell") {
      return;
    }

    // обычные фигуры
    const goalIndex = newGoals.findIndex(
      (goal) => goal.figure === match.figure
    );
    if (goalIndex !== -1) {
      const baseProgress = match.positions.length;
      const modifiedProgress = applyModifiersToGoalProgress(
        baseProgress,
        modifiers
      );
      newGoals[goalIndex] = {
        ...newGoals[goalIndex],
        collected: Math.min(
          newGoals[goalIndex].collected + modifiedProgress,
          newGoals[goalIndex].target
        ),
      };
    }
  });

  return newGoals;
};

export const calculateRoundScore = (
  matches: Match[],
  modifiers: GameModifiers
): number => {
  let roundScore = 0;

  matches.forEach((match) => {
    if (match.figure === "goldenCell" || match.figure === "teamCell") {
      return;
    }

    const baseScore = match.positions.length * 10;
    const modifiedScore = applyModifiersToScore(baseScore, modifiers);
    roundScore += modifiedScore;
  });

  return roundScore;
};
