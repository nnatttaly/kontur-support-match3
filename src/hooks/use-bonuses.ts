import { useCallback } from "react";
import { Bonus, Board, ActiveBonus, GameModifiers, Goal, BonusType, Figure } from "types";
import { BONUS_EFFECTS } from "@utils/bonus-effects/effects-registry";
import {
  applyGravity,
  fillEmptySlots,
  findAllMatches,
  applyHorizontalGravity,
} from "@utils/game-logic";
import { LEVELS } from "consts";

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
  currentLevelId?: number;
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
  currentLevelId,
}: UseBonusesProps) => {
  const getRandomBonusForLevel6 = useCallback((): BonusType => {
    const allBonuses: BonusType[] = [
      "friendlyTeam",
      "careerGrowth",
      "sportCompensation",
      "knowledgeBase",
      "remoteWork",
      "openGuide",
      "modernProducts",
      "itSphere",
      "dms"
    ];
    return allBonuses[Math.floor(Math.random() * allBonuses.length)];
  }, []);

  const getRandomFigureForLevel6 = useCallback((availableFigures: Figure[], excludeFigures: Figure[] = []): Figure => {
    const filteredFigures = availableFigures.filter(
      fig => !["star", "diamond", "team", "teamImage0", "teamImage1", "teamImage2", "teamImage3", "goldenCell", "teamCell"].includes(fig)
    );
    
    const availableFiltered = filteredFigures.filter(fig => !excludeFigures.includes(fig));
    
    if (availableFiltered.length > 0) {
      return availableFiltered[Math.floor(Math.random() * availableFiltered.length)];
    }
    
    return filteredFigures[Math.floor(Math.random() * filteredFigures.length)];
  }, []);

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

        // Для instant бонусов уменьшаем количество и удаляем, если достигли 0 (только для 6 уровня)
        const next = [...prev];
        if (idx !== -1 && next[idx].count > 0) {
          const newCount = next[idx].count - 1;
          
          if (currentLevelId === 6) {
            // В 6-м уровне удаляем бонус, если использований не осталось
            if (newCount <= 0) {
              next.splice(idx, 1);
            } else {
              next[idx] = { ...next[idx], count: newCount };
            }
          } else {
            // В других уровнях просто уменьшаем количество
            next[idx] = { ...next[idx], count: newCount };
          }
        }
        return next;
      });

      if (!effect.isInstant) return;

      setIsAnimating(true);

      const result = effect.apply(board);
      console.log(type);
      
      // Для openGuide в 6-м уровне обрабатываем выполнение целей специальным образом
      if (type === "openGuide" && currentLevelId === 6) {
        // Сначала применяем эффект openGuide
        effect.onApplyGoals?.(setGoals);
        
        // Затем проверяем, есть ли выполненные цели и даем бонусы
        setTimeout(() => {
          setGoals((prevGoals) => {
            const updatedGoals = [...prevGoals];
            const completedIndices: number[] = [];
            const newBonuses: BonusType[] = [];
            
            // Проверяем, какие цели выполнились
            updatedGoals.forEach((goal, index) => {
              if (goal.collected >= goal.target) {
                completedIndices.push(index);
                // Даем бонус за каждую выполненную цель
                const randomBonus = getRandomBonusForLevel6();
                newBonuses.push(randomBonus);
              }
            });

            // Если есть выполненные цели, заменяем их
            if (completedIndices.length > 0) {
              completedIndices.forEach((index) => {
                const currentFigures = updatedGoals.map(g => g.figure);
                const newFigure = getRandomFigureForLevel6(LEVELS[5].availableFigures || [], currentFigures);
                const newTarget = updatedGoals[index].target + 1;
                updatedGoals[index] = {
                  figure: newFigure,
                  target: newTarget,
                  collected: 0
                };
              });

              // Добавляем бонусы (если есть место)
              if (newBonuses.length > 0) {
                setBonuses((prevBonuses) => {
                  let updatedBonuses = [...prevBonuses];
                  
                  for (const bonusType of newBonuses) {
                    const existingIndex = updatedBonuses.findIndex(b => b.type === bonusType);
                    
                    if (existingIndex !== -1) {
                      updatedBonuses[existingIndex] = {
                        ...updatedBonuses[existingIndex],
                        count: Math.min(updatedBonuses[existingIndex].count + 1, 3)
                      };
                    } else if (updatedBonuses.length < 2) {
                      updatedBonuses.push({ type: bonusType, count: 1 });
                    }
                  }
                  
                  return updatedBonuses;
                });
              }
            }
            
            return updatedGoals;
          });

          // Продолжаем обычную обработку бонуса
          applyBonusBoardUpdate(result.board, type).then(async (finalBoard) => {
            effect.onApply?.(setMoves);

            if (findAllMatches(finalBoard).length > 0 && processMatches) {
              await processMatches(finalBoard);
            }

            setTimeout(() => {
              setIsAnimating(false);
            }, 300);
          });
        }, 100);
      } else {
        // Обычная обработка для других бонусов
        applyBonusBoardUpdate(result.board, type).then(async (finalBoard) => {
          effect.onApply?.(setMoves);
          effect.onApplyGoals?.(setGoals);

          if (findAllMatches(finalBoard).length > 0 && processMatches) {
            await processMatches(finalBoard);
          }

          setTimeout(() => {
            setIsAnimating(false);
          }, 300);
        });
      }
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
      currentLevelId,
      getRandomBonusForLevel6,
      getRandomFigureForLevel6,
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