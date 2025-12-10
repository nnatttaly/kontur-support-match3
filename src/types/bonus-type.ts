export const BONUS_TYPES = [
  "friendlyTeam",
  "careerGrowth",
  "sportCompensation",
  "knowledgeBase",
] as const;
export type BonusType = typeof BONUS_TYPES[number];