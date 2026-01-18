import { BonusType } from "./bonus-type";

// Добавь это к существующему типу LevelState
export type LevelState = {
  currentLevel: number;
  isLevelComplete: boolean;
  isLevelTransition: boolean;
  selectedBonuses: BonusType[];
  isLevelFailed: boolean; // Новое поле для отслеживания провала уровня
};