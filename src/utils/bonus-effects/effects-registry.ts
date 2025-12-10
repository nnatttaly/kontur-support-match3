import { BonusType, Board, GameModifiers } from "types";
import { applyFriendlyTeamEffect } from "./friendly-team";
import {
  applyCareerGrowthEffect,
  resetCareerGrowthModifiers,
} from "./career-growth";
import { applySportCompensationEffect } from "./sport-compensation";
import { applyKnowledgeBaseEffect } from "./knowledge-base";

export type BonusEffect = {
  apply: (board: Board) => Board;
  isInstant?: boolean;
  onApply?: (setMoves: (updater: (moves: number) => number) => void) => void;
  reset?: () => GameModifiers;
  applyModifiers?: () => GameModifiers;
};

export const BONUS_EFFECTS: Record<BonusType, BonusEffect> = {
  friendlyTeam: {
    apply: applyFriendlyTeamEffect,
    isInstant: true,
  },
  careerGrowth: {
    apply: (board: Board) => {
      return board;
    },
    isInstant: false,
    applyModifiers: applyCareerGrowthEffect,
    reset: resetCareerGrowthModifiers,
  },
  sportCompensation: {
    apply: applySportCompensationEffect,
    isInstant: true,
    onApply: (setMoves) => {
      setMoves((prevMoves) => prevMoves + 1);
    },
  },
  knowledgeBase: {
    apply: applyKnowledgeBaseEffect,
    isInstant: true,
    onApply: (setMoves) => {
      setMoves((prevMoves) => prevMoves + 2);
    },
  },
};
