// hooks/use-match-processing.tsx
import { useCallback, useRef } from "react";
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
  onShuffleWarning?: () => void; // Добавляем новый пропс
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
  onShuffleWarning, // Получаем обработчик
}: UseMatchProcessingProps) => {
  // Флаг для предотвращения повторной обработки матчей
  const isProcessingMatchesRef = useRef(false);
  // Счетчик попыток шаффла для предотвращения бесконечного цикла
  const MAX_SHUFFLE_ATTEMPTS = 7;

  const getRandomBonus = useCallback((): BonusType => {
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

  const replaceCompletedGoalsForLevel6 = useCallback((goals: Goal[]): { goals: Goal[]; bonuses: BonusType[] } => {
    if (currentLevel?.id !== 6) return { goals, bonuses: [] };

    const updatedGoals = [...goals];
    const completedIndices: number[] = [];
    const newBonuses: BonusType[] = [];

    // Находим выполненные цели
    updatedGoals.forEach((goal, index) => {
      if (goal.collected >= goal.target) {
        completedIndices.push(index);
        // Даем 1 случайный бонус за каждую выполненную цель
        const randomBonus = getRandomBonus();
        newBonuses.push(randomBonus);
      }
    });

    // Если есть выполненные цели - заменяем их (но не применяем бонусы здесь)
    if (completedIndices.length > 0) {
      console.log(`Заменяем ${completedIndices.length} выполненных целей на 6-м уровне (useMatchProcessing)`);
      console.log(`Подготовлено ${newBonuses.length} бонусов за выполненные цели (будут применены централизованно)`);

      completedIndices.forEach((index) => {
        const currentFigures = updatedGoals.map(g => g.figure);
        const figuresInMatches: Figure[] = [];
        const excludeFigures = [...currentFigures, ...figuresInMatches];

        const newFigure = getRandomFigure(
          currentLevel.availableFigures || [],
          excludeFigures
        );
        const newTarget = updatedGoals[index].target + 1;
        updatedGoals[index] = {
          figure: newFigure,
          target: newTarget,
          collected: 0
        };
      });
    }

    return { goals: updatedGoals, bonuses: newBonuses };
  }, [currentLevel, getRandomBonus, getRandomFigure]);

  const checkPossibleMoves = useCallback((board: Board): boolean => {
    const rows = board.length;
    const cols = board[0].length;

    const UNMOVABLE_FIGURES = [
      "team",
      "teamImage0",
      "teamImage1",
      "teamImage2",
      "teamImage3",
      "goldenCell",
      "teamCell",
    ];

    const canSwapFigure = (figure: string | null): boolean => {
      if (!figure) return false;
      if (UNMOVABLE_FIGURES.includes(figure)) return false;
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
  }, []);

  const processMatches = useCallback(
    async (currentBoard: Board, currentSpecialCells: SpecialCell[] = [], options?: { skipGoldenRestore: boolean }): Promise<Board> => {
      // Защита от повторного входа
      if (isProcessingMatchesRef.current) {
        console.warn('processMatches: уже выполняется, пропускаем повторный вызов');
        return currentBoard;
      }

      isProcessingMatchesRef.current = true;

      const skipGoldenRestore = options?.skipGoldenRestore || false;

      let boardToProcess = currentBoard;
      let hasMatches = true;
      let totalRoundScore = 0;
      let usedModifiers = false;

      // ВАЖНО: используем переданные currentSpecialCells, которые уже обновлены бонусами
      const initialSpecialCells = currentSpecialCells.length > 0 ? currentSpecialCells : currentLevel?.specialCells || [];
      const updatedSpecialCells: SpecialCell[] = [...initialSpecialCells];

      // Track how many level-6 bonuses we've applied during this processMatches invocation to avoid double-applying
      let appliedLevel6Bonuses = 0;

      while (hasMatches) {
        const foundMatches = findAllMatches(boardToProcess);

        if (foundMatches.length > 0) {
          // Используем Set для хранения УНИКАЛЬНЫХ позиций golden cells
          const goldenCellsInMatchesSet = new Set<string>();
          let collectedTeamMatches = 0;

          foundMatches.forEach((match) => {
            let matchHasTeam = false;

            match.positions.forEach((pos) => {
              // Ищем golden cells среди специальных клеток
              const goldenCellIndex = updatedSpecialCells.findIndex(
                (cell) =>
                  cell.row === pos.row &&
                  cell.col === pos.col &&
                  cell.type === "golden" &&
                  cell.isActive !== false
              );

              if (goldenCellIndex !== -1) {
                // Используем строковый ключ для Set
                const posKey = `${pos.row},${pos.col}`;
                goldenCellsInMatchesSet.add(posKey);

                // Помечаем golden cell как неактивную
                updatedSpecialCells[goldenCellIndex] = {
                  ...updatedSpecialCells[goldenCellIndex],
                  isActive: false,
                };
                console.log(`Golden cell found at ${pos.row},${pos.col} in matches`);
              }

              // Ищем клетки типа "team" среди специальных клеток
              const teamCellIndex = updatedSpecialCells.findIndex(
                (cell) =>
                  cell.row === pos.row &&
                  cell.col === pos.col &&
                  cell.type === "team" &&
                  cell.isActive !== false
              );

              if (teamCellIndex !== -1) {
                matchHasTeam = true;
              }
            });

            if (matchHasTeam) {
              collectedTeamMatches += 1;
              console.log(`Match has team cell - counting as 1 goal progress`);
            }
          });

          // Преобразуем Set в массив позиций
          const goldenCellsInMatches: Position[] = Array.from(goldenCellsInMatchesSet).map(key => {
            const [row, col] = key.split(',').map(Number);
            return { row, col };
          });

          console.log(`Total unique golden cells in matches: ${goldenCellsInMatches.length}`);
          console.log(`Total team cell matches found: ${collectedTeamMatches}`);

          if (onSpecialCellsUpdate) {
            onSpecialCellsUpdate(updatedSpecialCells);
          }

          // UPDATE GOALS FOR GOLDEN - каждая golden cell засчитывается отдельно
          if (goldenCellsInMatches.length > 0) {
            setGoals((prev) => {
              const next = [...prev];
              const idx = next.findIndex((g) => g.figure === "goldenCell");
              if (idx !== -1) {
                const inc = modifiers.doubleGoalProgress
                  ? goldenCellsInMatches.length * 2
                  : goldenCellsInMatches.length;
                console.log(`Adding ${inc} to goldenCell goal in processMatches (${goldenCellsInMatches.length} golden cells)`);
                next[idx] = {
                  ...next[idx],
                  collected: Math.min(
                    next[idx].collected + inc,
                    next[idx].target
                  ),
                };
              }

              // DO NOT replace completed goals here for level 6. Replacement will be handled once per iteration below.
              return next;
            });
          }

          // UPDATE GOALS FOR TEAMCELL - Ключевое исправление: только 1 за КАЖДУЮ комбинацию
          if (collectedTeamMatches > 0) {
            console.log(`Processing teamCell goal: ${collectedTeamMatches} match(es) with team cell`);

            setGoals((prev) => {
              const next = [...prev];
              const teamGoalIndex = next.findIndex((g) => g.figure === "teamCell");

              if (teamGoalIndex !== -1) {
                const teamGoal = next[teamGoalIndex];
                const inc = modifiers.doubleGoalProgress
                  ? collectedTeamMatches * 2
                  : collectedTeamMatches;
                const oldCollected = teamGoal.collected;
                const newCollected = Math.min(
                  oldCollected + inc,
                  teamGoal.target
                );

                console.log(`Updating teamCell goal: ${oldCollected} + ${inc} = ${newCollected}/${teamGoal.target}`);

                next[teamGoalIndex] = {
                  ...teamGoal,
                  collected: newCollected,
                };

                // Для 5 уровня: обновляем прогресс команды при достижении порогов
                if (currentLevel?.id === 5) {
                  console.log(`Level 5: Team progress ${oldCollected} -> ${newCollected}`);

                  // Проверяем пороги и обновляем изображение команды
                  if (newCollected >= 12 && oldCollected < 12) {
                    console.log("Progressing to team happy three");
                    boardToProcess = progressTeamHappyThree(boardToProcess);
                    setBoard([...boardToProcess]);
                  } else if (newCollected >= 8 && oldCollected < 8) {
                    console.log("Progressing to team happy two");
                    boardToProcess = progressTeamHappyTwo(boardToProcess);
                    setBoard([...boardToProcess]);
                  } else if (newCollected >= 4 && oldCollected < 4) {
                    console.log("Progressing to team happy one");
                    boardToProcess = progressTeamHappyOne(boardToProcess);
                    setBoard([...boardToProcess]);
                  }
                }
              } else {
                console.warn("teamCell goal not found in goals list!");
                console.log("Current goals:", next);
              }

              // DO NOT replace completed goals here for level 6. Replacement will be handled once per iteration below.
              return next;
            });
          }

          // UPDATE GOALS FOR NORMAL MATCHES (excluding teamCell and goldenCell)
          if (foundMatches.length > 0) {
            setGoals((prevGoals) => {
              const updatedGoals = [...prevGoals];
              const figureCountMap = new Map<Figure, number>();

              foundMatches.forEach((match) => {
                match.positions.forEach((pos) => {
                  const figure = boardToProcess[pos.row][pos.col];
                  // Исключаем teamCell и goldenCell - они уже обработаны отдельно
                  if (figure && figure !== "teamCell" && figure !== "goldenCell") {
                    const count = figureCountMap.get(figure) || 0;
                    figureCountMap.set(figure, count + 1);
                  }
                });
              });

              // Для обычных уровней
              updatedGoals.forEach((goal, index) => {
                if (figureCountMap.has(goal.figure)) {
                  const count = figureCountMap.get(goal.figure)!;
                  const increment = modifiers.doubleGoalProgress
                    ? count * 2
                    : count;
                  const newCollected = Math.min(
                    goal.collected + increment,
                    goal.target
                  );

                  updatedGoals[index] = {
                    ...goal,
                    collected: newCollected,
                  };
                }
              });

              // DO NOT replace completed goals here for level 6. Replacement will be handled once per iteration below.
              return updatedGoals;
            });
          }

          const roundScore = calculateRoundScore(foundMatches, modifiers);
          totalRoundScore += roundScore;

          if (modifiers.doublePoints || modifiers.doubleGoalProgress)
            usedModifiers = true;

          setMatches(foundMatches);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));

          // УДАЛЯЕМ ВСЕ МАТЧИ, включая фигуры на golden cell
          // Это ключевое исправление: все фигуры в матчах должны быть удалены
          boardToProcess = updateBoardAfterMatches(boardToProcess);

          setBoard(boardToProcess);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
          setMatches([]);

          // Применяем гравитацию
          let boardWithGravity = applyGravity(boardToProcess);
          boardToProcess = boardWithGravity;
          setBoard(boardToProcess);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));

          // Fill empty
          const lvl = currentLevel
            ? { ...currentLevel, specialCells: updatedSpecialCells }
            : undefined;

          boardToProcess = fillEmptySlots(boardToProcess, lvl);
          setBoard(boardToProcess);

          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));

          // Для 5 уровня применяем горизонтальную гравитацию
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

          // Восстанавливаем golden cells только если не пропущено и они активны
          // НО: мы пометили golden cells как неактивные, поэтому они не восстановятся
          // Это правильно, потому что golden cells одноразовые
          updatedSpecialCells.forEach((sc) => {
            if (!skipGoldenRestore && sc.type === "golden" && sc.isActive !== false) {
              if (
                boardToProcess[sc.row] &&
                boardToProcess[sc.row][sc.col] === null
              ) {
                boardToProcess[sc.row][sc.col] = "goldenCell";
              }
            }
          });

          setBoard([...boardToProcess]);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
        }

        // PROCESS DIAMONDS
        const diamondsToRemove: Position[] = [];
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

            // DO NOT replace completed goals here for level 6. Replacement will be handled once per iteration below.
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

          // Восстанавливаем golden cells если не пропущено
          updatedSpecialCells.forEach((sc) => {
            if (!skipGoldenRestore && sc.type === "golden" && sc.isActive !== false) {
              if (boardToProcess[sc.row]) {
                boardToProcess[sc.row][sc.col] =
                  boardToProcess[sc.row][sc.col] ?? "goldenCell";
              }
            }
          });

          setBoard([...boardToProcess]);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
        }

        // PROCESS STARS
        const starsToRemove: Position[] = [];
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

            // DO NOT replace completed goals here for level 6. Replacement will be handled once per iteration below.
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

          // Восстанавливаем golden cells если не пропущено
          updatedSpecialCells.forEach((sc) => {
            if (!skipGoldenRestore && sc.type === "golden" && sc.isActive !== false) {
              if (boardToProcess[sc.row]) {
                boardToProcess[sc.row][sc.col] =
                  boardToProcess[sc.row][sc.col] ?? "goldenCell";
              }
            }
          });

          setBoard([...boardToProcess]);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
        }

        // --- CENTRALIZED: For level 6, run replacement once per iteration and apply bonuses once ---
        if (currentLevel?.id === 6) {
          setGoals((prev) => {
            const { goals: newGoals, bonuses: bonusesToAdd } = replaceCompletedGoalsForLevel6(prev);

            if (bonusesToAdd.length > 0) {
              // Only apply bonuses that haven't been applied yet during this processMatches call.
              const toApply = bonusesToAdd.slice(0, Math.max(0, bonusesToAdd.length - appliedLevel6Bonuses));

              if (toApply.length > 0) {
                console.log(`Applying ${toApply.length} bonus(es) for completed goals on level 6`);

                setBonuses((prevBonuses) => {
                  let updatedBonuses = [...prevBonuses];

                  for (const bonusType of toApply) {
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
                      const randomIndex = Math.floor(Math.random() * updatedBonuses.length);
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

                // Mark that we've applied these bonuses so we don't re-apply them in the same invocation
                appliedLevel6Bonuses += toApply.length;
              }
            }

            return newGoals;
          });

          // wait a tick so state updates propagate visually if needed
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION / 2));
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

          const hasMoves = checkPossibleMoves(boardToProcess);
          if (!hasMoves) {
            // Проверяем, не превысили ли максимальное количество попыток шаффла
            let current = 0;
            while (current< MAX_SHUFFLE_ATTEMPTS) {
              // Показываем предупреждение о перемешивании
              if (onShuffleWarning) {
                onShuffleWarning();
                // Ждем немного, чтобы показалось предупреждение
                await new Promise((r) => setTimeout(r, 300));
              }
              
              current++;
              
              const shuffledBoard = shuffleBoardWithoutMatches(
                boardToProcess,
                currentLevel
              );
              
              if (shuffledBoard !== boardToProcess) {
                boardToProcess = shuffledBoard;
                setBoard([...boardToProcess]);
                await new Promise((r) => setTimeout(r, ANIMATION_DURATION));

                // Проверяем наличие ходов после шаффла
                const hasMovesAfterShuffle = checkPossibleMoves(boardToProcess);
                if (hasMovesAfterShuffle) {
                  console.log(`Шаффл ${current}: есть возможные ходы`);
                  break;
                } else {
                  console.log(`Шаффл ${current}: все еще нет ходов`);
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

      // Сбрасываем флаг после завершения обработки
      isProcessingMatchesRef.current = false;
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
      onShuffleWarning,
      getRandomBonus,
      getRandomFigure,
      replaceCompletedGoalsForLevel6,
      checkPossibleMoves,
    ]
  );

  return { processMatches };
};