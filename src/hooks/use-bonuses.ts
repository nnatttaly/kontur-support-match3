import { useCallback } from "react";
import { Bonus, Board, ActiveBonus, GameModifiers, Goal } from "types";
import { BONUS_EFFECTS } from "@utils/bonus-effects/effects-registry";

export const useBonuses = (
  setBonuses: (updater: (bonuses: Bonus[]) => Bonus[]) => void,
  setBoard: (board: Board) => void,
  setIsAnimating: (animating: boolean) => void,
  activeBonus: ActiveBonus | null,
  setActiveBonus: (bonus: ActiveBonus | null) => void,
  setMoves: (updater: (moves: number) => number) => void,
  setModifiers: (modifiers: GameModifiers) => void,

  // 🔴 ВАЖНО: это ЧИСТЫЙ useState setter
  setGoals: (updater: (goals: Goal[]) => Goal[]) => void
) => {
  const handleBonus = useCallback(
    (type: Bonus["type"], board: Board) => {
      const effect = BONUS_EFFECTS[type];
      if (!effect) return;

      setBonuses((prev) => {
        const idx = prev.findIndex((b) => b.type === type);
        if (idx === -1 || prev[idx].count <= 0) return prev;

        if (!effect.isInstant) {
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

      const newBoard = effect.apply(board);

      effect.onApply?.(setMoves);
      effect.onApplyGoals?.(setGoals); // ✅ openGuide работает ТУТ

      setIsAnimating(true);
      setTimeout(() => {
        setBoard(newBoard);
        setIsAnimating(false);
      }, 300);
    },
    [
      setBonuses,
      setBoard,
      setIsAnimating,
      setMoves,
      setModifiers,
      setGoals,
      setActiveBonus,
    ]
  );

  const deactivateBonus = useCallback(() => {
    if (!activeBonus) return;
    const effect = BONUS_EFFECTS[activeBonus.type];
    effect?.reset && setModifiers(effect.reset());
    setActiveBonus(null);
  }, [activeBonus, setActiveBonus, setModifiers]);

  return { handleBonus, deactivateBonus };
};
