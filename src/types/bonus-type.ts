export const BONUS_TYPES = [
  "friendlyTeam",
  "careerGrowth",
  "sportCompensation",
  "knowledgeBase",
  "remoteWork",
  "openGuide",
  "modernProducts",
  "itSphere",
  "dms"
] as const;
export type BonusType = typeof BONUS_TYPES[number];