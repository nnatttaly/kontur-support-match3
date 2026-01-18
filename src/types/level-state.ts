import { Bonus } from "./bonus";

// Добавь это к существующему типу LevelState
export type LevelState = {
  currentLevel: number;
  isLevelComplete: boolean;
  isLevelTransition: boolean;
  selectedBonuses: Bonus[];
  isLevelFailed: boolean; // Новое поле для отслеживания провала уровня
};