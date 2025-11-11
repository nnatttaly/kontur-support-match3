export const BONUS_TYPES = ["globe", "barbell"] as const;
export type BonusType = typeof BONUS_TYPES[number];