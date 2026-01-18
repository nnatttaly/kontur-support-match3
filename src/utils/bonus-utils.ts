import { Bonus, BonusType } from "types";

// Полный список всех доступных бонусов с их диапазонами количества
const ALL_BONUSES: Array<{ type: BonusType; minCount: number; maxCount: number }> = [
  { type: "knowledgeBase", minCount: 1, maxCount: 1 },
  { type: "openGuide", minCount: 1, maxCount: 1 },
  { type: "sportCompensation", minCount: 1, maxCount: 1 },
  { type: "modernProducts", minCount: 1, maxCount: 1 },
  { type: "remoteWork", minCount: 1, maxCount: 1 },
  { type: "dms", minCount: 1, maxCount: 1 },
  { type: "friendlyTeam", minCount: 1, maxCount: 1 },
  { type: "careerGrowth", minCount: 1, maxCount: 1 }
];

export const getRandomCount = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getRandomBonusesForLevel6 = (): Bonus[] => {
  // Создаем копию массива всех бонусов и перемешиваем
  const shuffledBonuses = [...ALL_BONUSES].sort(() => Math.random() - 0.5);
  
  // Берем первые 2 бонуса и генерируем случайное количество для каждого
  return shuffledBonuses.slice(0, 2).map(bonus => ({
    type: bonus.type,
    count: getRandomCount(bonus.minCount, bonus.maxCount)
  }));
};