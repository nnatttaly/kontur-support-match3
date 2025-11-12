import { useCallback } from "react";
import { Bonus } from "types";

export const useBonuses = (
  setBonuses: (updater: (bonuses: Bonus[]) => Bonus[]) => void
) => {
  const useBonus = useCallback(
    (type: Bonus["type"]) => {
      setBonuses((prevBonuses) => {
        const newBonuses = [...prevBonuses];
        const bonusIndex = newBonuses.findIndex((bonus) => bonus.type === type);

        if (bonusIndex !== -1 && newBonuses[bonusIndex].count > 0) {
          newBonuses[bonusIndex] = {
            ...newBonuses[bonusIndex],
            count: newBonuses[bonusIndex].count - 1,
          };

          // TODO: Здесь будет логика применения бонуса
        }

        return newBonuses;
      });
    },
    [setBonuses]
  );

  return {
    useBonus,
  };
};
