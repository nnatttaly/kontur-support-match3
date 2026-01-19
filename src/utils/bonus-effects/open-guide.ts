import { Board, Goal } from "types";

/**
 * Бонус НЕ трогает доску.
 * Он напрямую модифицирует цели.
 */

export const applyOpenGuideEffect = (board: Board): Board => {
  return board;
};

export const onApplyOpenGuide = (
  setGoals: (updater: (goals: Goal[]) => Goal[]) => void
) => {
  setGoals((prev) => {
    const next = [...prev];

    const unfinished = next
      .map((g, i) => ({ g, i }))
      .filter(({ g }) => g.collected < g.target);

    if (unfinished.length === 0) return next;

    const { g, i } =
      unfinished[Math.floor(Math.random() * unfinished.length)];

    const oldCollected = g.collected;
    const newCollected = Math.min(g.target, g.collected + 1);
    
    next[i] = {
      ...g,
      collected: newCollected,
    };

    return next;
  });
};