import { Bonus, BonusType } from "types";

// Полный список всех доступных бонусов с их диапазонами количества
const ALL_BONUSES: Array<{ type: BonusType; сount: number;}> = [
  { type: "knowledgeBase", сount: 1 },
  { type: "openGuide", сount: 1 },
  { type: "sportCompensation", сount: 1 },
  { type: "modernProducts", сount: 1 },
  { type: "remoteWork", сount: 1 },
  { type: "itSphere", сount: 1 },
  { type: "friendlyTeam", сount: 1 },
  { type: "careerGrowth", сount: 1 }
];

export const getRandomBonusesForLevel6 = (): Bonus[] => {
  // Создаем копию массива всех бонусов и перемешиваем
  const shuffledBonuses = [...ALL_BONUSES].sort(() => Math.random() - 0.5);
  
  // Берем первые 2 бонуса и генерируем случайное количество для каждого
  return shuffledBonuses.slice(0, 2).map(bonus => ({
    type: bonus.type,
    count: bonus.сount
  }));
};