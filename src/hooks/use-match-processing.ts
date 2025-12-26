import { useCallback } from "react";
import {
  Board,
  Match,
  GameModifiers,
  ActiveBonus,
  Bonus,
  Goal,
  Level,
  SpecialCell,
  Position,
  BonusType,
  Figure,
} from "types";
import { ANIMATION_DURATION, BOARD_ROWS } from "consts";
import {
  findAllMatches,
  updateBoardAfterMatches,
  applyGravity,
  fillEmptySlots,
  applyHorizontalGravity,
  shuffleBoardWithoutMatches,
} from "@utils/game-logic";
import { BONUS_EFFECTS } from "@utils/bonus-effects";
import {
  calculateRoundScore,
} from "@utils/modifiers-utils";
import {
  progressTeamHappyOne,
  progressTeamHappyTwo,
  progressTeamHappyThree,
} from "@utils/game-team-utils";

type UseMatchProcessingProps = {
  setBoard: (board: Board) => void;
  setMatches: (matches: Match[]) => void;
  setScore: (updater: (score: number) => number) => void;
  setGoals: (updater: (goals: Goal[]) => Goal[]) => void;
  modifiers: GameModifiers;
  setModifiers: (modifiers: GameModifiers) => void;
  activeBonus: ActiveBonus | null;
  setActiveBonus: (bonus: ActiveBonus | null) => void;
  setBonuses: (updater: (bonuses: Bonus[]) => Bonus[]) => void;
  currentLevel?: Level;
  onSpecialCellsUpdate?: (specialCells: SpecialCell[]) => void;
};

export const useMatchProcessing = ({
  setBoard,
  setMatches,
  setScore,
  setGoals,
  modifiers,
  setModifiers,
  activeBonus,
  setActiveBonus,
  setBonuses,
  currentLevel,
  onSpecialCellsUpdate,
}: UseMatchProcessingProps) => {
  const getRandomBonus = useCallback((): BonusType => {
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

  const getRandomFigure = useCallback((availableFigures: Figure[], excludeFigures: Figure[] = []): Figure => {
    const filteredFigures = availableFigures.filter(
      fig => !["star", "diamond", "team", "teamImage0", "teamImage1", "teamImage2", "teamImage3", "goldenCell", "teamCell"].includes(fig)
    );
    
    // Исключаем уже используемые фигуры
    const availableFiltered = filteredFigures.filter(fig => !excludeFigures.includes(fig));
    
    if (availableFiltered.length > 0) {
      return availableFiltered[Math.floor(Math.random() * availableFiltered.length)];
    }
    
    // Если все доступные фигуры уже используются, возвращаем случайную из отфильтрованных
    return filteredFigures[Math.floor(Math.random() * filteredFigures.length)];
  }, []);

  const processMatches = useCallback(
    async (currentBoard: Board): Promise<Board> => {
      let boardToProcess = currentBoard;
      let hasMatches = true;
      let totalRoundScore = 0;
      let usedModifiers = false;

      const initialSpecialCells = currentLevel?.specialCells || [];
      const updatedSpecialCells: SpecialCell[] = [...initialSpecialCells];

      // Переменные для отслеживания выполненных целей и бонусов за этот ход
      const goalsCompletedThisTurn: Array<{index: number, oldTarget: number}> = [];
      const bonusesFromCompletedGoals: BonusType[] = [];

      while (hasMatches) {
        const foundMatches = findAllMatches(boardToProcess);

        if (foundMatches.length > 0) {
          // PROCESS GOLDEN + TEAM CELLS IN MATCHES
          let collectedGolden = 0;
          let collectedTeam = 0;

          const teamPositionsInThisRound: Position[] = [];

          foundMatches.forEach((match) => {
            let teamFoundInThisMatch = false;

            match.positions.forEach((pos) => {
              const specialCellIndex = updatedSpecialCells.findIndex(
                (cell) =>
                  cell.row === pos.row &&
                  cell.col === pos.col &&
                  cell.isActive !== false
              );

              if (specialCellIndex !== -1) {
                const sc = updatedSpecialCells[specialCellIndex];

                if (sc.type === "golden") {
                  updatedSpecialCells[specialCellIndex] = {
                    ...sc,
                    isActive: false,
                  };
                  collectedGolden++;
                }

                if (sc.type === "team") {
                  teamFoundInThisMatch = true;
                  teamPositionsInThisRound.push({ row: pos.row, col: pos.col });
                }
              }
            });

            if (teamFoundInThisMatch) {
              collectedTeam++;
            }
          });

          const uniqueTeamPositions: Position[] = [];
          const seen = new Set<string>();
          teamPositionsInThisRound.forEach((p) => {
            const key = `${p.row}:${p.col}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueTeamPositions.push(p);
            }
          });

          if (onSpecialCellsUpdate && updatedSpecialCells.length > 0) {
            onSpecialCellsUpdate(updatedSpecialCells);
          }

          // UPDATE GOALS FOR GOLDEN
          if (collectedGolden > 0) {
            setGoals((prev) => {
              const next = [...prev];
              const idx = next.findIndex((g) => g.figure === "goldenCell");
              if (idx !== -1) {
                const inc = modifiers.doubleGoalProgress
                  ? collectedGolden * 2
                  : collectedGolden;
                next[idx] = {
                  ...next[idx],
                  collected: Math.min(
                    next[idx].collected + inc,
                    next[idx].target
                  ),
                };
              }
              return next;
            });
          }

          // UPDATE GOALS FOR TEAMCELL
          if (collectedTeam > 0) {
            setGoals((prev) => {
              const next = [...prev];
              const idx = next.findIndex((g) => g.figure === "teamCell");
              if (idx !== -1) {
                const inc = modifiers.doubleGoalProgress
                  ? collectedTeam * 2
                  : collectedTeam;
                const newCollected = Math.min(
                  next[idx].collected + inc,
                  next[idx].target
                );
                next[idx] = {
                  ...next[idx],
                  collected: newCollected,
                };

                if (currentLevel?.id === 5) {
                  if (newCollected >= 12) {
                    boardToProcess = progressTeamHappyThree(boardToProcess);
                  } else if (newCollected >= 8) {
                    boardToProcess = progressTeamHappyTwo(boardToProcess);
                  } else if (newCollected >= 4) {
                    boardToProcess = progressTeamHappyOne(boardToProcess);
                  }
                  setBoard([...boardToProcess]);
                }
              }
              return next;
            });
          }

          // UPDATE GOALS FOR NORMAL MATCHES
          if (foundMatches.length > 0) {
            setGoals((prevGoals) => {
              const updatedGoals = [...prevGoals];
              const figureCountMap = new Map<Figure, number>();

              foundMatches.forEach((match) => {
                match.positions.forEach((pos) => {
                  const figure = boardToProcess[pos.row][pos.col];
                  if (
                    figure &&
                    figure !== "teamCell" &&
                    figure !== "goldenCell"
                  ) {
                    const count = figureCountMap.get(figure) || 0;
                    figureCountMap.set(figure, count + 1);
                  }
                });
              });

              // Для 6 уровня: проверяем каждую цель отдельно
              if (currentLevel?.id === 6) {
                const completedInThisIteration: Array<{index: number, oldTarget: number}> = [];
                const bonusesFromThisIteration: BonusType[] = [];
                
                updatedGoals.forEach((goal, index) => {
                  if (figureCountMap.has(goal.figure)) {
                    const baseCount = figureCountMap.get(goal.figure)!;
                    const increment = modifiers.doubleGoalProgress
                      ? baseCount * 2
                      : baseCount;
                    
                    const oldCollected = goal.collected;
                    const newCollected = Math.min(
                      oldCollected + increment,
                      goal.target
                    );
                    
                    updatedGoals[index] = {
                      ...goal,
                      collected: newCollected,
                    };

                    // Проверяем, была ли выполнена цель в этом ходе
                    if (oldCollected < goal.target && newCollected >= goal.target) {
                      completedInThisIteration.push({
                        index,
                        oldTarget: goal.target
                      });
                      // Даем случайный бонус за каждую выполненную цель
                      const randomBonus = getRandomBonus();
                      console.log("Goal completed:", goal);
                      bonusesFromThisIteration.push(randomBonus);
                    }
                  }
                });

                // Сохраняем информацию о выполненных целях
                if (completedInThisIteration.length > 0) {
                  goalsCompletedThisTurn.push(...completedInThisIteration);
                  bonusesFromCompletedGoals.push(...bonusesFromThisIteration);

                  // Заменяем выполненные цели на новые
                  completedInThisIteration.forEach(({index, oldTarget}) => {
                    const currentFigures = updatedGoals.map(g => g.figure);
                    const figuresInMatches = Array.from(figureCountMap.keys());
                    const excludeFigures = [...currentFigures, ...figuresInMatches];
                    
                    const newFigure = getRandomFigure(
                      currentLevel.availableFigures || [],
                      excludeFigures
                    );
                    const newTarget = oldTarget + 1;
                    updatedGoals[index] = {
                      figure: newFigure,
                      target: newTarget,
                      collected: 0
                    };
                  });
                }
              } else {
                // Для обычных уровней
                updatedGoals.forEach((goal) => {
                  if (figureCountMap.has(goal.figure)) {
                    const count = figureCountMap.get(goal.figure)!;
                    const increment = modifiers.doubleGoalProgress
                      ? count * 2
                      : count;
                    goal.collected = Math.min(
                      goal.collected + increment,
                      goal.target
                    );
                  }
                });
              }

              return updatedGoals;
            });
          }

          const roundScore = calculateRoundScore(foundMatches, modifiers);
          totalRoundScore += roundScore;

          if (modifiers.doublePoints || modifiers.doubleGoalProgress)
            usedModifiers = true;

          setMatches(foundMatches);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));

          // REMOVE NORMAL MATCHES
          boardToProcess = updateBoardAfterMatches(boardToProcess);
          setBoard(boardToProcess);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
          setMatches([]);

          boardToProcess = applyGravity(boardToProcess);
          setBoard(boardToProcess);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));

          // Fill empty
          const lvl = currentLevel
            ? { ...currentLevel, specialCells: updatedSpecialCells }
            : undefined;

          boardToProcess = fillEmptySlots(boardToProcess, lvl);
          setBoard(boardToProcess);

          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
          if (lvl?.id === 5) {
            const result = applyHorizontalGravity(boardToProcess);
            boardToProcess = result.board;
            setBoard(boardToProcess);
            await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
            if (result.isChanged) {
              boardToProcess = applyGravity(boardToProcess);
              setBoard(boardToProcess);
              await new Promise((r) => setTimeout(r, ANIMATION_DURATION / 2));

              boardToProcess = fillEmptySlots(boardToProcess, lvl);
              setBoard(boardToProcess);
            }
          }

          // Восстанавливаем team cells
          updatedSpecialCells.forEach((sc) => {
            if (sc.type === "team" && sc.isActive !== false) {
              if (
                boardToProcess[sc.row] &&
                boardToProcess[sc.row][sc.col] === null
              ) {
                boardToProcess[sc.row][sc.col] = "teamCell";
              }
            }
          });

          setBoard([...boardToProcess]);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
        }

        // PROCESS DIAMONDS
        let diamondsToRemove: Position[] = [];
        for (let col = 0; col < boardToProcess[0].length; col++) {
          if (boardToProcess[BOARD_ROWS - 1]?.[col] === "diamond") {
            diamondsToRemove.push({ row: BOARD_ROWS - 1, col });
          }
        }

        if (diamondsToRemove.length > 0) {
          const collectedDiamonds = diamondsToRemove.length;

          diamondsToRemove.forEach(
            ({ row, col }) => (boardToProcess[row][col] = null)
          );

          setGoals((prev) => {
            const next = [...prev];
            const idx = next.findIndex((g) => g.figure === "diamond");
            if (idx !== -1) {
              const inc = modifiers.doubleGoalProgress
                ? collectedDiamonds * 2
                : collectedDiamonds;
              next[idx] = {
                ...next[idx],
                collected: Math.min(
                  next[idx].collected + inc,
                  next[idx].target
                ),
              };
            }
            return next;
          });

          boardToProcess = applyGravity(boardToProcess);
          setBoard([...boardToProcess]);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));

          const lvl = currentLevel
            ? { ...currentLevel, specialCells: updatedSpecialCells }
            : undefined;

          boardToProcess = fillEmptySlots(boardToProcess, lvl);
          setBoard([...boardToProcess]);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));

          updatedSpecialCells.forEach((sc) => {
            if (sc.type === "team" && sc.isActive !== false) {
              if (boardToProcess[sc.row]) {
                boardToProcess[sc.row][sc.col] =
                  boardToProcess[sc.row][sc.col] ?? "teamCell";
              }
            }
          });
          setBoard([...boardToProcess]);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
        }

        // PROCESS STARS
        let starsToRemove: Position[] = [];
        for (let col = 0; col < boardToProcess[0].length; col++) {
          if (boardToProcess[BOARD_ROWS - 1]?.[col] === "star") {
            starsToRemove.push({ row: BOARD_ROWS - 1, col });
          }
        }

        if (starsToRemove.length > 0) {
          const collectedStars = starsToRemove.length;

          starsToRemove.forEach(
            ({ row, col }) => (boardToProcess[row][col] = null)
          );

          setGoals((prev) => {
            const next = [...prev];
            const idx = next.findIndex((g) => g.figure === "star");
            if (idx !== -1) {
              const inc = modifiers.doubleGoalProgress
                ? collectedStars * 2
                : collectedStars;
              next[idx] = {
                ...next[idx],
                collected: Math.min(
                  next[idx].collected + inc,
                  next[idx].target
                ),
              };
            }
            return next;
          });

          boardToProcess = applyGravity(boardToProcess);
          setBoard([...boardToProcess]);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));

          const lvl = currentLevel
            ? { ...currentLevel, specialCells: updatedSpecialCells }
            : undefined;

          boardToProcess = fillEmptySlots(boardToProcess, lvl);
          setBoard([...boardToProcess]);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));

          updatedSpecialCells.forEach((sc) => {
            if (sc.type === "team" && sc.isActive !== false) {
              if (boardToProcess[sc.row]) {
                boardToProcess[sc.row][sc.col] =
                  boardToProcess[sc.row][sc.col] ?? "teamCell";
              }
            }
          });
          setBoard([...boardToProcess]);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
        }

        // CHECK IF MORE MATCHES, DIAMONDS OR STARS
        const newMatches = findAllMatches(boardToProcess);
        const moreStars: Position[] = [];
        const moreDiamonds: Position[] = [];
        for (let col = 0; col < boardToProcess[0].length; col++) {
          if (boardToProcess[BOARD_ROWS - 1]?.[col] === "star") {
            moreStars.push({ row: BOARD_ROWS - 1, col });
          }
          if (boardToProcess[BOARD_ROWS - 1]?.[col] === "diamond") {
            moreDiamonds.push({ row: BOARD_ROWS - 1, col });
          }
        }

        if (
          newMatches.length === 0 &&
          moreStars.length === 0 &&
          moreDiamonds.length === 0
        ) {
          hasMatches = false;

          const finalMatches = findAllMatches(boardToProcess);
          if (finalMatches.length === 0) {
            const hasMoves = checkPossibleMoves(boardToProcess);
            if (!hasMoves) {
              const shuffledBoard = shuffleBoardWithoutMatches(
                boardToProcess,
                currentLevel
              );
              if (shuffledBoard !== boardToProcess) {
                boardToProcess = shuffledBoard;
                setBoard([...boardToProcess]);
                await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
                
                const matchesAfterShuffle = findAllMatches(boardToProcess);
                if (matchesAfterShuffle.length > 0) {
                  hasMatches = true;
                }
              }
            }
          }
          
          break;
        }
      }

      if (totalRoundScore > 0) {
        setScore((prev) => prev + totalRoundScore);
      }

      // RESET MODIFIERS AFTER BONUS - сначала сбрасываем бонусы с модификаторами (включая careerGrowth)
      if (usedModifiers && activeBonus) {
        const effect = BONUS_EFFECTS[activeBonus.type];
        if (effect.reset) setModifiers(effect.reset());

        // Сначала удаляем активный бонус (освобождаем место)
        setActiveBonus(null);

        if (!effect.isInstant) {
          setBonuses((prev) => {
            const next = [...prev];
            const i = next.findIndex((b) => b.type === activeBonus.type);
            if (i !== -1 && next[i].count > 0) {
              const newCount = next[i].count - 1;
              
              if (currentLevel?.id === 6) {
                // В 6-м уровне удаляем бонус, если использований не осталось
                if (newCount <= 0) {
                  next.splice(i, 1);
                } else {
                  next[i] = { ...next[i], count: newCount };
                }
              } else {
                next[i] = { ...next[i], count: newCount };
              }
            }
            return next;
          });
        }
      }

      // Только ПОСЛЕ того как мы уменьшили счетчик careerGrowth (и возможно удалили его)
      // добавляем бонусы за выполненные цели в 6-м уровне
      if (currentLevel?.id === 6 && goalsCompletedThisTurn.length > 0) {
        console.log("Бонусы за выполненные цели:", bonusesFromCompletedGoals);
        bonusesFromCompletedGoals.length = bonusesFromCompletedGoals.length % 2 === 0 ? 
                      bonusesFromCompletedGoals.length / 2 : bonusesFromCompletedGoals.length / 2 + 1;
        // Теперь добавляем бонусы, если есть место
        if (bonusesFromCompletedGoals.length > 0) {
          setBonuses((prevBonuses) => {
            let updatedBonuses = [...prevBonuses];
            
            for (const bonusType of bonusesFromCompletedGoals) {
              if (updatedBonuses.length < 2) {
                let curBonusType = bonusType
                let existingIndex = updatedBonuses.findIndex(b => b.type === curBonusType);
                while (existingIndex != -1) {
                  curBonusType = getRandomBonus();
                  existingIndex = updatedBonuses.findIndex(b => b.type === curBonusType);
                }
                updatedBonuses.push({ type: curBonusType, count: 1 });
              } else {
                let randomInt: number = Math.floor(Math.random() * 2);
                if (updatedBonuses[randomInt].count >= 3) {
                  randomInt = (randomInt + 1) % 2;
                }
                if (updatedBonuses[randomInt].count < 3) {
                  updatedBonuses[randomInt] = {
                    ...updatedBonuses[randomInt],
                    count: Math.min(updatedBonuses[randomInt].count + 1, 3)
                  };
                }
              } 
            }
            
            return updatedBonuses;
          });
        }
      }

      return boardToProcess;
    },
    [
      setBoard,
      setMatches,
      setScore,
      setGoals,
      modifiers,
      setModifiers,
      setActiveBonus,
      setBonuses,
      activeBonus,
      currentLevel,
      onSpecialCellsUpdate,
      getRandomBonus,
      getRandomFigure,
    ]
  );

  return { processMatches };
};

// Функция для проверки возможных ходов
const checkPossibleMoves = (board: Board): boolean => {
  const rows = board.length;
  const cols = board[0].length;

  const UNMOVABLE_FIGURES = [
    "team",
    "teamImage0",
    "teamImage1",
    "teamImage2",
    "teamImage3",
  ];

  const canSwapFigure = (figure: string | null): boolean => {
    if (!figure) return false;
    if (UNMOVABLE_FIGURES.includes(figure as any)) return false;
    return true;
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const currentFigure = board[row][col];
      if (!canSwapFigure(currentFigure)) continue;

      if (col < cols - 1) {
        const rightFigure = board[row][col + 1];
        if (canSwapFigure(rightFigure)) {
          if (currentFigure === "star" && rightFigure === "star") {
            continue;
          }

          const tempBoard = board.map(r => [...r]);
          tempBoard[row][col] = rightFigure;
          tempBoard[row][col + 1] = currentFigure;
          
          const matchesAfterSwap = findAllMatches(tempBoard);
          if (matchesAfterSwap.length > 0) {
            return true;
          }
        }
      }

      if (row < rows - 1) {
        const bottomFigure = board[row + 1][col];
        if (canSwapFigure(bottomFigure)) {
          if (currentFigure === "star" && bottomFigure === "star") {
            continue;
          }

          const tempBoard = board.map(r => [...r]);
          tempBoard[row][col] = bottomFigure;
          tempBoard[row + 1][col] = currentFigure;
          
          const matchesAfterSwap = findAllMatches(tempBoard);
          if (matchesAfterSwap.length > 0) {
            return true;
          }
        }
      }
    }
  }

  return false;
};