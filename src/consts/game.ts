import { Goal, Bonus } from "types";

export const MIN_MATCH_LENGTH = 3 as const;
export const ANIMATION_DURATION = 300 as const;
export const INITIAL_MOVES = 20;
export const INITIAL_GOALS: Goal[] = [
  { figure: "pencil", target: 1, collected: 0 },
  { figure: "bonnet", target: 1, collected: 0 },
  { figure: "apple", target: 1, collected: 0 },
];
export const INITIAL_BONUSES: Bonus[] = [
  { type: "friendlyTeam", count: 3 },
  { type: "sportCompensation", count: 2 },
];
