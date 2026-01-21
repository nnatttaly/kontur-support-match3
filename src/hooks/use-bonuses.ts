import { useCallback } from "react";
import {
  Bonus,
  Board,
  ActiveBonus,
  GameModifiers,
  Goal,
  BonusType,
  Figure,
  Position,
  SpecialCell,
} from "types";
import { BONUS_EFFECTS } from "@utils/bonus-effects/effects-registry";
import {
  applyGravity,
  fillEmptySlots,
  findAllMatches,
} from "@utils/game-logic";
import { LEVELS } from "consts";
import {
  progressTeamHappyOne,
  progressTeamHappyTwo,
  progressTeamHappyThree,
} from "@utils/game-team-utils";

type UseBonusesProps = {
  setBonuses: (updater: (bonuses: Bonus[]) => Bonus[]) => void;
  setBoard: (board: Board) => void;
  setIsAnimating: (animating: boolean) => void;
  activeBonus: ActiveBonus | null;
  setActiveBonus: (bonus: ActiveBonus | null) => void;
  setMoves: (updater: (moves: number) => number) => void;
  setModifiers: (modifiers: GameModifiers) => void;
  setGoals: (updater: (goals: Goal[]) => Goal[]) => void;
  processMatches?: (
    board: Board,
    specialCells: SpecialCell[],
    options?: { skipGoldenRestore: boolean }
  ) => Promise<Board>;
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
      // "itSphere",
      "dms",
    ];
    return allBonuses[Math.floor(Math.random() * allBonuses.length)];
  }, []);

  const getRandomFigureForLevel6 = useCallback(
    (availableFigures: Figure[], excludeFigures: Figure[] = []): Figure => {
      const filteredFigures = availableFigures.filter(
        (fig) =>
          ![
            "star",
            "diamond",
            "team",
            "teamImage0",
            "teamImage1",
            "teamImage2",
            "teamImage3",
            "goldenCell",
            "teamCell",
          ].includes(fig)
      );

      const availableFiltered = filteredFigures.filter(
        (fig) => !excludeFigures.includes(fig)
      );

      if (availableFiltered.length > 0) {
        return availableFiltered[
          Math.floor(Math.random() * availableFiltered.length)
        ];
      }

      return filteredFigures[
        Math.floor(Math.random() * filteredFigures.length)
      ];
    },
    []
  );

  // Замена выполненных целей на 6 уровне
  const replaceCompletedGoalsForLevel6 = useCallback(
    (prevGoals: Goal[]): Goal[] => {
      if (currentLevelId !== 6) return prevGoals;

      const updatedGoals = [...prevGoals];
      const completedIndices: number[] = [];
      const newBonuses: BonusType[] = [];

      updatedGoals.forEach((goal, index) => {
        if (goal.collected >= goal.target) {
          completedIndices.push(index);
          newBonuses.push(getRandomBonusForLevel6());
        }
      });

      if (completedIndices.length > 0) {
        completedIndices.forEach((index) => {
          const currentFigures = updatedGoals.map((g) => g.figure);
          const newFigure = getRandomFigureForLevel6(
            LEVELS[5].availableFigures || [],
            currentFigures
          );

          updatedGoals[index] = {
            figure: newFigure,
            target: updatedGoals[index].target + 1,
            collected: 0,
          };
        });

        if (newBonuses.length > 0) {
          setBonuses((prevBonuses) => {
            let updatedBonuses = [...prevBonuses];

            for (const bonusType of newBonuses) {
              const existingIndex = updatedBonuses.findIndex(
                (b) => b.type === bonusType
              );

              if (existingIndex !== -1) {
                updatedBonuses[existingIndex] = {
                  ...updatedBonuses[existingIndex],
                  count: Math.min(
                    updatedBonuses[existingIndex].count + 1,
                    3
                  ),
                };
              } else if (updatedBonuses.length < 2) {
                updatedBonuses.push({ type: bonusType, count: 1 });
              } else {
                const randomIndex = Math.floor(Math.random() * 2);
                if (updatedBonuses[randomIndex].count < 3) {
                  updatedBonuses[randomIndex] = {
                    ...updatedBonuses[randomIndex],
                    count: Math.min(
                      updatedBonuses[randomIndex].count + 1,
                      3
                    ),
                  };
                }
              }
            }

            return updatedBonuses;
          });
        }
      }

      return updatedGoals;
    },
    [
      currentLevelId,
      getRandomBonusForLevel6,
      getRandomFigureForLevel6,
      setBonuses,
    ]
  );

  const updateGoalsForRemovedFigures = useCallback(
    (
      removedFigures: Array<{ position: Position; figure: Figure }>,
      removedGoldenCells: Position[]
    ) => {
      // golden cells
      if (removedGoldenCells.length > 0) {
        let updatedSpecialCells = [...specialCells];
        let goldenCellsUpdated = false;

        removedGoldenCells.forEach((pos) => {
          const cellIndex = updatedSpecialCells.findIndex(
            (cell) =>
              cell.row === pos.row &&
              cell.col === pos.col &&
              cell.type === "golden"
          );

          if (cellIndex !== -1) {
            updatedSpecialCells[cellIndex] = {
              ...updatedSpecialCells[cellIndex],
              isActive: false,
            };
            goldenCellsUpdated = true;
          }
        });

        setGoals((prev) => {
          const next = prev.map((goal) => {
            if (goal.figure === "goldenCell") {
              return {
                ...goal,
                collected: Math.min(
                  goal.collected + removedGoldenCells.length,
                  goal.target
                ),
              };
            }
            return goal;
          });

          return replaceCompletedGoalsForLevel6(next);
        });

        if (goldenCellsUpdated && setSpecialCells) {
          setSpecialCells(updatedSpecialCells);
        }
      }

      const filteredRemovedFigures = removedFigures.filter(
        ({ figure }) => figure !== "teamCell" && figure !== "goldenCell"
      );

      if (filteredRemovedFigures.length > 0) {
        setGoals((prev) => {
          const figureCountMap = new Map<Figure, number>();

          filteredRemovedFigures.forEach(({ figure }) => {
            figureCountMap.set(figure, (figureCountMap.get(figure) || 0) + 1);
          });

          const next = prev.map((goal) => {
            if (figureCountMap.has(goal.figure)) {
              return {
                ...goal,
                collected: Math.min(
                  goal.collected + (figureCountMap.get(goal.figure) || 0),
                  goal.target
                ),
              };
            }
            return goal;
          });

          return replaceCompletedGoalsForLevel6(next);
        });
      }
    },
    [replaceCompletedGoalsForLevel6, setGoals, setSpecialCells, specialCells]
  );

  const applyBonusBoardUpdate = async (
    boardWithHoles: Board,
    bonusType: BonusType
  ) => {
    const bonusChange: BonusType[] = [
      "friendlyTeam",
      "remoteWork",
      "modernProducts",
      "itSphere",
    ];

    if (bonusChange.includes(bonusType)) {
      setBoard([...boardWithHoles]);
      await new Promise((r) => setTimeout(r, 200));

      let next = applyGravity(boardWithHoles);
      setBoard([...next]);
      await new Promise((r) => setTimeout(r, 200));

      next = fillEmptySlots(next);
      setBoard([...next]);
      await new Promise((r) => setTimeout(r, 200));

      return next;
    }

    return boardWithHoles;
  };

  const handleBonus = useCallback(
    (type: Bonus["type"], currentBoard: Board) => {
      const effect = BONUS_EFFECTS[type];
      if (!effect) return;

      const currentLevel = currentLevelId
        ? LEVELS[currentLevelId - 1]
        : undefined;

      setBonuses((prev) => {
        const idx = prev.findIndex((b) => b.type === type);
        if (idx === -1 || prev[idx].count <= 0) return prev;

        if (!effect.isInstant) {
          if (activeBonus?.type === type) {
            setActiveBonus(null);
            effect.reset && setModifiers(effect.reset());
            return prev;
          }

          setActiveBonus({ type, isActive: true });
          effect.applyModifiers && setModifiers(effect.applyModifiers());
          return prev;
        }

        const next = [...prev];
        const newCount = next[idx].count - 1;

        if (currentLevelId === 6 && newCount <= 0) {
          next.splice(idx, 1);
        } else {
          next[idx] = { ...next[idx], count: newCount };
        }

        return next;
      });

      if (!effect.isInstant) return;

      setIsAnimating(true);

      const result = effect.apply(currentBoard, specialCells, currentLevel);

      if (result.removedFigures && result.removedGoldenCells) {
        updateGoalsForRemovedFigures(
          result.removedFigures,
          result.removedGoldenCells
        );
      }

      if (type === "openGuide" && currentLevelId === 5) {
        setGoals((prevGoals) => {
          const updatedGoals = [...prevGoals];
          const teamGoal = updatedGoals.find((g) => g.figure === "teamCell");

          if (teamGoal) {
            const collected = teamGoal.collected + 3;

            if (collected >= 12) {
              setBoard([...progressTeamHappyThree(currentBoard)]);
            } else if (collected >= 8) {
              setBoard([...progressTeamHappyTwo(currentBoard)]);
            } else if (collected >= 4) {
              setBoard([...progressTeamHappyOne(currentBoard)]);
            }
          }

          return updatedGoals;
        });
      }

      applyBonusBoardUpdate(result.board, type).then(async (finalBoard) => {
        effect.onApply && effect.onApply(setMoves);
        effect.onApplyGoals && effect.onApplyGoals(setGoals);

        if (currentLevelId === 6 && type !== "openGuide") {
          setGoals((prevGoals) => replaceCompletedGoalsForLevel6(prevGoals));
        }

        if (findAllMatches(finalBoard).length > 0 && processMatches) {
          const skipGoldenRestore =
            type === "itSphere" || type === "remoteWork";
          await processMatches(finalBoard, specialCells, {
            skipGoldenRestore,
          });
        }

        setTimeout(() => setIsAnimating(false), 300);
      });
    },
    [
      activeBonus,
      currentLevelId,
      processMatches,
      replaceCompletedGoalsForLevel6,
      setActiveBonus,
      setBonuses,
      setBoard,
      setGoals,
      setIsAnimating,
      setModifiers,
      setMoves,
      specialCells,
      updateGoalsForRemovedFigures,
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
