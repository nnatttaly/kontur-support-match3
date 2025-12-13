import { BonusType, Board, GameModifiers, Position, Goal } from "types";
import { applyFriendlyTeamEffect } from "./friendly-team";
import {
  applyCareerGrowthEffect,
  resetCareerGrowthModifiers,
} from "./career-growth";
import { applySportCompensationEffect } from "./sport-compensation";
import { applyKnowledgeBaseEffect } from "./knowledge-base";

import {
  applyRemoteWorkEffect,
  applyRemoteWorkAt,
} from "./remote-work";
import { applyOpenGuideEffect, onApplyOpenGuide } from "./open-guide";
import {
  applyModernProductsEffect,
  applyModernProductsAt,
} from "./modern-products";
import { applyItSphereEffect, applyItSphereAt } from "./it-sphere";

export type BonusEffect = {
  apply: (board: Board) => Board;
  applyAt?: (board: Board, pos: Position, secondPos?: Position) => Board;
  isInstant?: boolean;

  onApply?: (setMoves: (updater: (moves: number) => number) => void) => void;
  onApplyGoals?: (
    setGoals: (updater: (goals: Goal[]) => Goal[]) => void
  ) => void;

  reset?: () => GameModifiers;
  applyModifiers?: () => GameModifiers;
};

export const BONUS_EFFECTS: Record<BonusType, BonusEffect> = {
  friendlyTeam: {
    apply: applyFriendlyTeamEffect,
    isInstant: true,
  },

  careerGrowth: {
    apply: (board) => board,
    isInstant: false,
    applyModifiers: applyCareerGrowthEffect,
    reset: resetCareerGrowthModifiers,
  },

  sportCompensation: {
    apply: applySportCompensationEffect,
    isInstant: true,
    onApply: (setMoves) => setMoves((m) => m + 1),
  },

  knowledgeBase: {
    apply: applyKnowledgeBaseEffect,
    isInstant: true,
    onApply: (setMoves) => setMoves((m) => m + 2),
  },

  remoteWork: {
    apply: applyRemoteWorkEffect,
    applyAt: applyRemoteWorkAt,
    isInstant: false,
  },

  openGuide: {
    apply: applyOpenGuideEffect,
    isInstant: true,
    onApplyGoals: onApplyOpenGuide,
  },

  modernProducts: {
    apply: applyModernProductsEffect,
    applyAt: applyModernProductsAt,
    isInstant: false,
  },

  itSphere: {
    apply: applyItSphereEffect,
    applyAt: applyItSphereAt,
    isInstant: false,
  },
};
