import { Level, Goal } from "types";
import { LEVELS } from "consts";

export const getLevelById = (id: number): Level | undefined => {
  return LEVELS.find((level) => level.id === id);
};

export const getLevelGoals = (levelId: number): Goal[] => {
  const level = getLevelById(levelId);
  return level ? level.goals : [];
};

export const getLevelMoves = (levelId: number): number => {
  const level = getLevelById(levelId);
  return level ? level.moves : 10;
};

export const getNextLevelId = (currentLevelId: number): number | null => {
  const nextLevel = LEVELS.find((level) => level.id === currentLevelId + 1);
  return nextLevel ? nextLevel.id : null;
};

export const hasNextLevel = (currentLevelId: number): boolean => {
  return getNextLevelId(currentLevelId) !== null;
};