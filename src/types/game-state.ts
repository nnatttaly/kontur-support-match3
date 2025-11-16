import { Goal } from "./goal";
import { Position } from "./position";
import { Match } from "./match";
import { ActiveBonus } from "./active-bonus";
import { GameModifiers } from "./game-modifiers";
import { Bonus } from "./bonus";

export type GameGoalsState = {
  goals: Goal[];
  setGoals: (updater: (goals: Goal[]) => Goal[]) => void;
};

export type GameScoreState = {
  score: number;
  setScore: (updater: (score: number) => number) => void;
};

export type GameMovesState = {
  moves: number;
  setMoves: (updater: (moves: number) => number) => void;
};

export type GameBoardState = {
  selectedPosition: Position | null;
  isSwapping: boolean;
  isAnimating: boolean;
  setSelectedPosition: (position: Position | null) => void;
  setIsSwapping: (swapping: boolean) => void;
  setIsAnimating: (animating: boolean) => void;
};

export type GameMatchesState = {
  matches: Match[];
  setMatches: (matches: Match[]) => void;
};

export type GameBonusesState = {
  bonuses: Bonus[];
  activeBonus: ActiveBonus | null;
  modifiers: GameModifiers;
  setBonuses: (updater: (bonuses: Bonus[]) => Bonus[]) => void;
  setActiveBonus: (bonus: ActiveBonus | null) => void;
  setModifiers: (modifiers: GameModifiers) => void;
};

export type GameState = GameGoalsState &
  GameScoreState &
  GameMovesState &
  GameBoardState &
  GameMatchesState &
  GameBonusesState;
