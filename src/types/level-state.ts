import { BonusType } from "./bonus-type";

export type LevelState = {
  currentLevel: number;
  isLevelComplete: boolean;
  isLevelTransition: boolean;
  selectedBonuses: BonusType[];
};
