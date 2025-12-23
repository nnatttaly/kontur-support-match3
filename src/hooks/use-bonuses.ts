import { useCallback } from "react";
import { Bonus, Board, ActiveBonus, GameModifiers, Goal, BonusType } from "types";
import { BONUS_EFFECTS } from "@utils/bonus-effects/effects-registry";
import {
  applyGravity,
  fillEmptySlots,
  findAllMatches,
  applyHorizontalGravity,
} from "@utils/game-logic";
import { LEVELS } from "consts/levels";

type UseBonusesProps = {
  setBonuses: (updater: (bonuses: Bonus[]) => Bonus[]) => void;
  setBoard: (board: Board) => void;
  setIsAnimating: (animating: boolean) => void;
  activeBonus: ActiveBonus | null;
  setActiveBonus: (bonus: ActiveBonus | null) => void;
  setMoves: (updater: (moves: number) => number) => void;
  setModifiers: (modifiers: GameModifiers) => void;
  setGoals: (updater: (goals: Goal[]) => Goal[]) => void;
  processMatches?: (board: Board) => Promise<Board>;
};

export const useBonuses = ({
  setBonuses,
  setBoard,
  setIsAnimating,
  activeBonus,
  setActiveBonus,
  setMoves,
  setModifiers,
  setGoals,
  processMatches,
}: UseBonusesProps) => {
  /**
   * ✅ ЗАКОНЧЕННЫЙ ЦИКЛ ОБНОВЛЕНИЯ ПОЛЯ
   * работает даже без матчей
   */
  const applyBonusBoardUpdate = async (boardWithHoles: Board, bonusType: BonusType) => {
    const bonusChange = [
      "friendlyTeam",
      "remoteWork",
      "modernProducts",
      "itSphere",
    ];

    if (bonusChange.includes(bonusType)) {
      // 1. показываем удаление
      setBoard([...boardWithHoles]);
      await new Promise(resolve => setTimeout(resolve, 200));

      // 2. гравитация
      let next = applyGravity(boardWithHoles);
      setBoard([...next]);
      await new Promise(resolve => setTimeout(resolve, 200));

      // 3. заполнение
      next = fillEmptySlots(next);
      setBoard([...next]);
      await new Promise(resolve => setTimeout(resolve, 200));

      return next;
    }

    return boardWithHoles;
  };

  /**
   * Клик по иконке бонуса
   */
  const handleBonus = useCallback(
    (type: Bonus["type"], board: Board) => {
      const effect = BONUS_EFFECTS[type];
      if (!effect) return;

      setBonuses((prev) => {
        const idx = prev.findIndex((b) => b.type === type);
        if (idx === -1 || prev[idx].count <= 0) return prev;

        if (!effect.isInstant) {
          // Если бонус уже активен - деактивируем его
          if (activeBonus?.type === type) {
            setActiveBonus(null);
            effect?.reset && setModifiers(effect.reset());
            return prev;
          }
          
          // Активируем новый бонус
          setActiveBonus({ type, isActive: true });
          if (effect.applyModifiers) {
            setModifiers(effect.applyModifiers());
          }
          return prev;
        }

        const next = [...prev];
        next[idx] = { ...next[idx], count: next[idx].count - 1 };
        return next;
      });

      if (!effect.isInstant) return;

      setIsAnimating(true);

      const result = effect.apply(board);
      console.log(type);
      applyBonusBoardUpdate(result.board, type).then(async (finalBoard) => {
        // Вызов коллбэков
        effect.onApply?.(setMoves);
        effect.onApplyGoals?.(setGoals);

        // 🔥 если после бонуса есть матчи — обрабатываем их
        if (findAllMatches(finalBoard).length > 0 && processMatches) {
          await processMatches(finalBoard);
        }

        setTimeout(() => {
          setIsAnimating(false);
        }, 300);
      });
    },
    [
      setBonuses,
      setBoard,
      setIsAnimating,
      setMoves,
      setModifiers,
      setGoals,
      setActiveBonus,
      activeBonus,
      processMatches,
    ]
  );

  /**
   * Отмена активного бонуса
   */
  const deactivateBonus = useCallback(() => {
    if (!activeBonus) return;
    const effect = BONUS_EFFECTS[activeBonus.type];
    effect?.reset && setModifiers(effect.reset());
    setActiveBonus(null);
  }, [activeBonus, setActiveBonus, setModifiers]);

  return {
    handleBonus,
    deactivateBonus,
  };
};