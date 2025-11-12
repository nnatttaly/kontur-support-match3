import { useState } from "react";
import { Position, Match, Goal, Bonus } from "types";
import { INITIAL_MOVES, INITIAL_GOALS, INITIAL_BONUSES } from "consts";

export const useGameState = () => {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );
  const [isSwapping, setIsSwapping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(INITIAL_MOVES);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [bonuses, setBonuses] = useState<Bonus[]>(INITIAL_BONUSES);

  return {
    selectedPosition,
    setSelectedPosition,
    isSwapping,
    setIsSwapping,
    isAnimating,
    setIsAnimating,
    matches,
    setMatches,
    score,
    setScore,
    moves,
    setMoves,
    goals,
    setGoals,
    bonuses,
    setBonuses,
  };
};
