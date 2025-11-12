export const BONUS_TYPES = ["globe", "barbell", "friendlyTeam"] as const;
export type BonusType = typeof BONUS_TYPES[number];