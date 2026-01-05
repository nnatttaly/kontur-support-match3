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
import { onApplyOpenGuide } from "./open-guide";
import {
  applyModernProductsEffect,
  applyModernProductsAt,
} from "./modern-products";
import { applyItSphereEffect, applyItSphereAt } from "./it-sphere";
import { applyDMSEffect } from "./dms"

export type BonusEffect = {
  apply: (board: Board) => { board: Board, matchedPositions: Position[] };
  applyAt?: (board: Board, pos: Position, secondPos?: Position) => { board: Board, matchedPositions: Position[] };
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
    apply: (board) => ({ board: applyFriendlyTeamEffect(board), matchedPositions: [] }),
    isInstant: true,
  },

  careerGrowth: {
    apply: (board) => ({ board, matchedPositions: [] }),
    isInstant: false,
    applyModifiers: applyCareerGrowthEffect,
    reset: resetCareerGrowthModifiers,
  },

  sportCompensation: {
    apply: (board) => ({ board: applySportCompensationEffect(board), matchedPositions: [] }),
    isInstant: true,
    onApply: (setMoves) => setMoves((m) => m + 1),
  },

  knowledgeBase: {
    apply: (board) => ({ board: applyKnowledgeBaseEffect(board), matchedPositions: [] }),
    isInstant: true,
    onApply: (setMoves) => setMoves((m) => m + 2),
  },

  remoteWork: {
    apply: applyRemoteWorkEffect,
    applyAt: applyRemoteWorkAt,
    isInstant: false,
  },

  openGuide: {
    apply: (board) => ({ board, matchedPositions: [] }),
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

  dms: {
    apply: (board) => ({ board: applyDMSEffect(board), matchedPositions: [] }),
    isInstant: true,
    onApply: (setMoves) => setMoves((m) => m + 3),
  },
};