import { BonusType, Board, GameModifiers, Position, Goal, SpecialCell, Figure, Level } from "types";
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
  apply: (board: Board, specialCells?: SpecialCell[], currentLevel?: Level) => { 
    board: Board, 
    matchedPositions: Position[],
    removedFigures?: Array<{position: Position, figure: Figure}>,
    removedGoldenCells?: Position[]
  };
  applyAt?: (board: Board, pos: Position, secondPos?: Position, specialCells?: SpecialCell[]) => { 
    board: Board, 
    matchedPositions: Position[],
    removedFigures?: Array<{position: Position, figure: Figure}>,
    removedGoldenCells?: Position[]
  };
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
    apply: (board, specialCells, currentLevel) => ({ 
      board: applyFriendlyTeamEffect(board, currentLevel), 
      matchedPositions: [],
      removedFigures: [],
      removedGoldenCells: []
    }),
    isInstant: true,
  },

  careerGrowth: {
    apply: (board, specialCells, currentLevel) => ({ 
      board, 
      matchedPositions: [],
      removedFigures: [],
      removedGoldenCells: []
    }),
    isInstant: false,
    applyModifiers: applyCareerGrowthEffect,
    reset: resetCareerGrowthModifiers,
  },

  sportCompensation: {
    apply: (board, specialCells, currentLevel) => ({ 
      board: applySportCompensationEffect(board), 
      matchedPositions: [],
      removedFigures: [],
      removedGoldenCells: []
    }),
    isInstant: true,
    onApply: (setMoves) => setMoves((m) => m + 1),
  },

  knowledgeBase: {
    apply: (board, specialCells, currentLevel) => ({ 
      board: applyKnowledgeBaseEffect(board), 
      matchedPositions: [],
      removedFigures: [],
      removedGoldenCells: []
    }),
    isInstant: true,
    onApply: (setMoves) => setMoves((m) => m + 2),
  },

  remoteWork: {
    apply: applyRemoteWorkEffect,
    applyAt: applyRemoteWorkAt,
    isInstant: false,
  },

  openGuide: {
    apply: (board, specialCells, currentLevel) => ({ 
      board, 
      matchedPositions: [],
      removedFigures: [],
      removedGoldenCells: []
    }),
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
    apply: (board, specialCells, currentLevel) => ({ 
      board: applyDMSEffect(board), 
      matchedPositions: [],
      removedFigures: [],
      removedGoldenCells: []
    }),
    isInstant: true,
    onApply: (setMoves) => setMoves((m) => m + 3),
  },
};