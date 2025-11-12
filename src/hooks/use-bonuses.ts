import { useCallback } from "react";
import { Bonus, Board } from "types";
import {
  applyFriendlyTeamEffect,
  applyBarbellEffect,
} from "@utils/bonus-effects";

export const useBonuses = (
  setBonuses: (updater: (bonuses: Bonus[]) => Bonus[]) => void,
  setBoard: (board: Board) => void,
  setIsAnimating: (animating: boolean) => void
) => {
  const handleBonus = useCallback(
    async (type: Bonus["type"], currentBoard: Board) => {
      setBonuses((prevBonuses) => {
        const newBonuses = [...prevBonuses];
        const bonusIndex = newBonuses.findIndex((bonus) => bonus.type === type);

        if (bonusIndex === -1 || newBonuses[bonusIndex].count <= 0) {
          return prevBonuses;
        }

        newBonuses[bonusIndex] = {
          ...newBonuses[bonusIndex],
          count: newBonuses[bonusIndex].count - 1,
        };

        return newBonuses;
      });

      let newBoard = currentBoard;

      if (type === "barbell") {
        newBoard = applyBarbellEffect(currentBoard);
      } else if (type === "friendlyTeam") {
        newBoard = applyFriendlyTeamEffect(currentBoard);
      }

      setIsAnimating(true);
      setTimeout(() => {
        setBoard(newBoard);
        setIsAnimating(false);
      }, 500);

    },
    [setBonuses, setBoard, setIsAnimating]
  );

  return {
    handleBonus,
  };
};
