import { useCallback } from "react";
import { Bonus, Board, ActiveBonus, GameModifiers, Goal, BonusType, Figure, Position, SpecialCell, Level } from "types";
import { BONUS_EFFECTS } from "@utils/bonus-effects/effects-registry";
import {
  applyGravity,
  fillEmptySlots,
  findAllMatches,
} from "@utils/game-logic";
import { LEVELS } from "consts";
import { progressTeamHappyOne, progressTeamHappyTwo, progressTeamHappyThree } from "@utils/game-team-utils";

type UseBonusesProps = {
  setBonuses: (updater: (bonuses: Bonus[]) => Bonus[]) => void;
  setBoard: (board: Board) => void;
  setIsAnimating: (animating: boolean) => void;
  activeBonus: ActiveBonus | null;
  setActiveBonus: (bonus: ActiveBonus | null) => void;
  setMoves: (updater: (moves: number) => number) => void;
  setModifiers: (modifiers: GameModifiers) => void;
  setGoals: (updater: (goals: Goal[]) => Goal[]) => void;
  processMatches?: (board: Board, specialCells: SpecialCell[], options?: { skipGoldenRestore: boolean }) => Promise<Board>;
  currentLevelId?: number;
  specialCells?: SpecialCell[];
  setSpecialCells?: (cells: SpecialCell[]) => void;
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
  specialCells = [],
  setSpecialCells,
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
      //"itSphere",
      "dms",
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

  // Функция для замены выполненных целей на 6-м уровне
  const replaceCompletedGoalsForLevel6 = useCallback((prevGoals: Goal[]): [Goal[], BonusType[]] => {
    if (currentLevelId !== 6) return [prevGoals, []];
    
    const updatedGoals = [...prevGoals];
    const completedIndices: number[] = [];
    const newBonuses: BonusType[] = [];
    
    // Находим выполненные цели
    updatedGoals.forEach((goal, index) => {
      if (goal.collected >= goal.target) {
        completedIndices.push(index);
        const randomBonus = getRandomBonusForLevel6();
        newBonuses.push(randomBonus);
      }
    });

    // Если есть выполненные цели - заменяем их
    if (completedIndices.length > 0) {
      console.log(`Заменяем ${completedIndices.length} выполненных целей на 6-м уровне`);
      
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

      // Добавляем бонусы
      if (newBonuses.length > 0) {
        console.log(`Добавляем бонусы за выполненные цели:`, newBonuses);
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
            } else {
              // Если уже есть 2 бонуса, добавляем к случайному существующему
              const randomIndex = Math.floor(Math.random() * 2);
              if (updatedBonuses[randomIndex].count < 3) {
                updatedBonuses[randomIndex] = {
                  ...updatedBonuses[randomIndex],
                  count: Math.min(updatedBonuses[randomIndex].count + 1, 3)
                };
              }
            }
          }
          
          return updatedBonuses;
        });
      }
    }
    
    return [updatedGoals, newBonuses];
  }, [currentLevelId, setBonuses, getRandomBonusForLevel6, getRandomFigureForLevel6]);

  const updateGoalsForRemovedFigures = useCallback((
    removedFigures: Array<{position: Position, figure: Figure}>,
    removedGoldenCells: Position[],
    currentBoard: Board,
    bonusType?: BonusType
  ) => {
    console.log('=== updateGoalsForRemovedFigures (useBonuses) START ===');
    console.log('removedFigures:', removedFigures);
    console.log('removedGoldenCells:', removedGoldenCells);
    console.log('bonusType:', bonusType);
    console.log('current specialCells:', specialCells);
    
    // Обрабатываем golden-cell
    if (removedGoldenCells.length > 0) {
      console.log(`Processing ${removedGoldenCells.length} golden cells (useBonuses)`);
      
      // Создаем копию specialCells для обновления
      let updatedSpecialCells = specialCells ? [...specialCells] : [];
      let goldenCellsUpdated = false;
      
      removedGoldenCells.forEach(pos => {
        const cellIndex = updatedSpecialCells.findIndex(cell => 
          cell.row === pos.row && 
          cell.col === pos.col && 
          cell.type === 'golden'
        );
        
        if (cellIndex !== -1) {
          console.log(`Marking golden cell as inactive at ${pos.row},${pos.col} (useBonuses)`);
          updatedSpecialCells[cellIndex] = {
            ...updatedSpecialCells[cellIndex],
            isActive: false,
          };
          goldenCellsUpdated = true;
        }
      });
      
      // Обновляем цели для golden-cell
      setGoals((prev) => {
        const next = prev.map(goal => {
          if (goal.figure === "goldenCell") {
            const inc = removedGoldenCells.length;
            console.log(`Adding ${inc} to goldenCell goal (useBonuses)`);
            const newCollected = Math.min(goal.collected + inc, goal.target);
            console.log(`goldenCell: ${goal.collected} -> ${newCollected} (useBonuses)`);
            return {
              ...goal,
              collected: newCollected
            };
          }
          return goal;
        });
        
        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Немедленно проверяем и заменяем выполненные цели на 6-м уровне
        if (currentLevelId === 6) {
          const [newGoals, bonusesToAdd] = replaceCompletedGoalsForLevel6(next);
          return newGoals;
        }
        
        return next;
      });
      
      // Применяем обновленные specialCells
      if (goldenCellsUpdated && setSpecialCells) {
        console.log('Updating specialCells (useBonuses):', updatedSpecialCells);
        setSpecialCells(updatedSpecialCells);
      }
    }

    // Обновляем цели для удаленных фигур (teamCell никогда не удаляется бонусами itSphere и remoteWork)
    const filteredRemovedFigures = removedFigures.filter(({ figure }) => 
      figure !== "teamCell" && figure !== "goldenCell"
    );
    
    if (filteredRemovedFigures.length > 0) {
      console.log(`Processing ${filteredRemovedFigures.length} normal removed figures (useBonuses)`);
      
      setGoals((prev) => {
        const figureCountMap = new Map<Figure, number>();

        filteredRemovedFigures.forEach(({ figure }) => {
          const count = figureCountMap.get(figure) || 0;
          figureCountMap.set(figure, count + 1);
        });

        console.log('Figure count map (useBonuses):', Object.fromEntries(figureCountMap));

        const next = prev.map(goal => {
          if (figureCountMap.has(goal.figure)) {
            const count = figureCountMap.get(goal.figure)!;
            const newCollected = Math.min(goal.collected + count, goal.target);
            console.log(`${goal.figure}: ${goal.collected} -> ${newCollected} (+${count}) (useBonuses)`);
            return {
              ...goal,
              collected: newCollected
            };
          }
          return goal;
        });

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Немедленно проверяем и заменяем выполненные цели на 6-м уровне
        if (currentLevelId === 6) {
          const [newGoals, bonusesToAdd] = replaceCompletedGoalsForLevel6(next);
          return newGoals;
        }

        return next;
      });
    }
    
    console.log('=== updateGoalsForRemovedFigures (useBonuses) END ===');
  }, [setGoals, setSpecialCells, specialCells, currentLevelId, replaceCompletedGoalsForLevel6]);

  const applyBonusBoardUpdate = async (boardWithHoles: Board, bonusType: BonusType) => {
    const bonusChange = [
      "friendlyTeam",
      "remoteWork",
      "modernProducts",
      "itSphere",
    ];

    if (bonusChange.includes(bonusType)) {
      setBoard([...boardWithHoles]);
      await new Promise(resolve => setTimeout(resolve, 200));

      let next = applyGravity(boardWithHoles);
      setBoard([...next]);
      await new Promise(resolve => setTimeout(resolve, 200));

      next = fillEmptySlots(next);
      setBoard([...next]);
      await new Promise(resolve => setTimeout(resolve, 200));

      return next;
    }

    return boardWithHoles;
  };

  const handleBonus = useCallback(
    (type: Bonus["type"], currentBoard: Board) => {
      const effect = BONUS_EFFECTS[type];
      if (!effect) return;

      // Получаем текущий уровень для friendlyTeam
      const currentLevel = currentLevelId ? LEVELS[currentLevelId - 1] : undefined;

      setBonuses((prev) => {
        const idx = prev.findIndex((b) => b.type === type);
        if (idx === -1 || prev[idx].count <= 0) return prev;

        if (!effect.isInstant) {
          if (activeBonus?.type === type) {
            setActiveBonus(null);
            effect?.reset && setModifiers(effect.reset());
            return prev;
          }
          
          setActiveBonus({ type, isActive: true });
          if (effect.applyModifiers) {
            setModifiers(effect.applyModifiers());
          }
          return prev;
        }

        const next = [...prev];
        if (idx !== -1 && next[idx].count > 0) {
          const newCount = next[idx].count - 1;
          
          if (currentLevelId === 6 && newCount <= 0) {
            next.splice(idx, 1);
          } else {
            next[idx] = { ...next[idx], count: newCount };
          }
        }
        return next;
      });

      if (!effect.isInstant) return;

      setIsAnimating(true);

      const result = effect.apply(currentBoard, specialCells, currentLevel);
      console.log('Bonus applied:', type, result);
      
      // Для itSphere и remoteWork передаем bonusType, чтобы не учитывать teamCell
      if ((type === "itSphere" || type === "remoteWork") && 
          result.removedFigures && result.removedGoldenCells) {
        updateGoalsForRemovedFigures(
          result.removedFigures, 
          result.removedGoldenCells,
          currentBoard,
          type
        );
      } else if (result.removedFigures && result.removedGoldenCells) {
        updateGoalsForRemovedFigures(
          result.removedFigures, 
          result.removedGoldenCells,
          currentBoard
        );
      }
      
      if (type === "openGuide" && currentLevelId === 5) {
        setGoals((prevGoals) => {
          const updatedGoals = [...prevGoals];
          const teamGoal = updatedGoals.find((g) => g.figure === "teamCell");
          
          if (teamGoal) {
            const collected = teamGoal.collected + 3;
            
            if (collected >= 12) {
              const newBoard = progressTeamHappyThree(currentBoard);
              setBoard([...newBoard]);
            } else if (collected >= 8) {
              const newBoard = progressTeamHappyTwo(currentBoard);
              setBoard([...newBoard]);
            } else if (collected >= 4) {
              const newBoard = progressTeamHappyOne(currentBoard);
              setBoard([...newBoard]);
            }
          }
          return updatedGoals;
        });
      }
      
      if (type === "openGuide" && currentLevelId === 6) {
        effect.onApplyGoals?.(setGoals);
        
        // Для openGuide на 6-м уровне ждем немного перед заменой целей
        setTimeout(() => {
          // Проверяем и заменяем выполненные цели
          setGoals((prevGoals) => {
            const [newGoals, bonusesToAdd] = replaceCompletedGoalsForLevel6(prevGoals);
            return newGoals;
          });

          applyBonusBoardUpdate(result.board, type).then(async (finalBoard) => {
            effect.onApply?.(setMoves);

            if (findAllMatches(finalBoard).length > 0 && processMatches) {
              await processMatches(finalBoard, specialCells, { skipGoldenRestore: false });
            }

            setTimeout(() => {
              setIsAnimating(false);
            }, 300);
          });
        }, 100);
      } else {
        // Для ВСЕХ бонусов на 6-м уровне
        applyBonusBoardUpdate(result.board, type).then(async (finalBoard) => {
          effect.onApply?.(setMoves);
          effect.onApplyGoals?.(setGoals);

          // Для 6-го уровня заменяем выполненные цели для ВСЕХ бонусов
          // (кроме openGuide, который уже обработан выше)
          if (currentLevelId === 6 && type !== "openGuide") {
            setTimeout(() => {
              setGoals((prevGoals) => {
                const [newGoals, bonusesToAdd] = replaceCompletedGoalsForLevel6(prevGoals);
                return newGoals;
              });
            }, 50);
          }

          if (findAllMatches(finalBoard).length > 0 && processMatches) {
            const skipGoldenRestore = (type === "itSphere" || type === "remoteWork");
            await processMatches(finalBoard, specialCells, { skipGoldenRestore });
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
      specialCells,
      setSpecialCells,
      updateGoalsForRemovedFigures,
      replaceCompletedGoalsForLevel6,
    ]
  );

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