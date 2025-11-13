import { useCallback } from "react";
import { Bonus, Board, GameModifiers, ActiveBonus } from "types";
import {
  applyFriendlyTeamEffect,
  applyBarbellEffect,
  applyCareerGrowthEffect,
  resetCareerGrowthModifiers,
} from "@utils/bonus-effects";

export const useBonuses = (
  setBonuses: (updater: (bonuses: Bonus[]) => Bonus[]) => void,
  setBoard: (board: Board) => void,
  setIsAnimating: (animating: boolean) => void,
  setModifiers: (modifiers: GameModifiers) => void,
  activeBonus: ActiveBonus | null,
  setActiveBonus: (bonus: ActiveBonus | null) => void
) => {
  const handleBonus = useCallback(
    async (type: Bonus["type"], currentBoard: Board) => {
      if (activeBonus && activeBonus.type !== type) {
        return;
      }

      if (activeBonus?.type === type && activeBonus.isActive) {
        setActiveBonus(null);

        if (type === "careerGrowth") {
          setModifiers(resetCareerGrowthModifiers());
        }
        return;
      }

      setBonuses((prevBonuses) => {
        const newBonuses = [...prevBonuses];
        const bonusIndex = newBonuses.findIndex((bonus) => bonus.type === type);

        if (bonusIndex === -1 || newBonuses[bonusIndex].count <= 0) {
          return prevBonuses;
        }

        if (type === "barbell" || type === "friendlyTeam") {
          newBonuses[bonusIndex] = {
            ...newBonuses[bonusIndex],
            count: newBonuses[bonusIndex].count - 1,
          };
        }

        return newBonuses;
      });

      setActiveBonus({ type, isActive: true });

      if (type === "barbell") {
        const newBoard = applyBarbellEffect(currentBoard);
        setIsAnimating(true);
        setTimeout(() => {
          setBoard(newBoard);
          setIsAnimating(false);
          setActiveBonus(null);
        }, 500);
      } else if (type === "friendlyTeam") {
        const newBoard = applyFriendlyTeamEffect(currentBoard);
        setIsAnimating(true);
        setTimeout(() => {
          setBoard(newBoard);
          setIsAnimating(false);
          setActiveBonus(null);
        }, 500);
      } else if (type === "careerGrowth") {
        const newModifiers = applyCareerGrowthEffect();
        setModifiers(newModifiers);
      }
    },
    [
      setBonuses,
      setBoard,
      setIsAnimating,
      setModifiers,
      activeBonus,
      setActiveBonus,
    ]
  );

  const deactivateBonus = useCallback(() => {
    if (activeBonus?.type === "careerGrowth") {
      setModifiers(resetCareerGrowthModifiers());
    }
    setActiveBonus(null);
  }, [activeBonus, setModifiers, setActiveBonus]);

  return {
    handleBonus,
    deactivateBonus,
  };
};
