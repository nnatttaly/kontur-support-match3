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
} from "types";
import { ANIMATION_DURATION, BOARD_ROWS } from "consts";
import {
  findAllMatches,
  updateBoardAfterMatches,
  applyGravity,
  fillEmptySlots,
  applyHorizontalGravity,
} from "@utils/game-logic";
import { BONUS_EFFECTS } from "@utils/bonus-effects";
import {
  updateGoalsWithModifiers,
  calculateRoundScore,
} from "@utils/modifiers-utils";
import { progressTeamHappyOne, progressTeamHappyTwo, progressTeamHappyThree } from "@utils/game-team-utils";

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
  const processMatches = useCallback(
    async (currentBoard: Board): Promise<Board> => {
      let boardToProcess = currentBoard;
      let hasMatches = true;
      let totalRoundScore = 0;
      let usedModifiers = false;
      let teamImageProgressionCounter = 0;

      const initialSpecialCells = currentLevel?.specialCells || [];
      const updatedSpecialCells: SpecialCell[] = [...initialSpecialCells];

      while (hasMatches) {
        const foundMatches = findAllMatches(boardToProcess);

        if (foundMatches.length > 0) {
          // -------------------------------------
          // PROCESS GOLDEN + TEAM CELLS IN MATCHES
          // -------------------------------------
          let collectedGolden = 0;
          let collectedTeam = 0;

          // Соберём список team-positions (чтобы гарантированно оставлять их на доске)
          const teamPositionsInThisRound: Position[] = [];

          // Для подсчёта team: считаем не по клеткам, а по матчам:
          foundMatches.forEach((match) => {
            let teamFoundInThisMatch = false;

            match.positions.forEach((pos) => {
              const specialCellIndex = updatedSpecialCells.findIndex(
                (cell) =>
                  cell.row === pos.row && cell.col === pos.col && cell.isActive !== false
              );

              if (specialCellIndex !== -1) {
                const sc = updatedSpecialCells[specialCellIndex];

                if (sc.type === "golden") {
                  // Golden cells deactivate and count one per cell
                  updatedSpecialCells[specialCellIndex] = { ...sc, isActive: false };
                  collectedGolden++;
                }

                if (sc.type === "team") {
                  // Mark that this match contains at least one teamCell
                  teamFoundInThisMatch = true;
                  // remember position(s) to restore them on board later
                  teamPositionsInThisRound.push({ row: pos.row, col: pos.col });
                  // NOTE: do NOT deactivate team cells (they stay active)
                }
              }
            });

            if (teamFoundInThisMatch) {
              // Count only +1 per match for teamCell
              collectedTeam++;
            }
          });

          // remove duplicates in teamPositionsInThisRound (multiple matches could reference same cell)
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

          // ---------------------------
          // UPDATE GOALS FOR GOLDEN (per-cell)
          // ---------------------------
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
                  collected: Math.min(next[idx].collected + inc, next[idx].target),
                };
              }
              return next;
            });
          }

          // ---------------------------
          // UPDATE GOALS FOR TEAMCELL (only +1 per match)
          // ---------------------------
          if (collectedTeam > 0) {
            setGoals((prev) => {
              const next = [...prev];
              const idx = next.findIndex((g) => g.figure === "teamCell");
              if (idx !== -1) {
                const inc = modifiers.doubleGoalProgress ? collectedTeam * 2 : collectedTeam;
                const newCollected = Math.min(next[idx].collected + inc, next[idx].target);
                next[idx] = {
                  ...next[idx],
                  collected: newCollected,
                };
                
                // Обновляем изображение команды в зависимости от прогресса
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

          // -------------------------------------
          // UPDATE GOALS FOR NORMAL MATCHES (КОМБИНАЦИИ)
          // -------------------------------------
          if (foundMatches.length > 0) {
            setGoals((prevGoals) => {
              // Создаем копию целей для обновления
              const updatedGoals = [...prevGoals];
              
              // Создаем карту подсчета фигур
              const figureCountMap = new Map<string, number>();
              
              // Подсчитываем все фигуры в матчах
              foundMatches.forEach(match => {
                match.positions.forEach(pos => {
                  const figure = boardToProcess[pos.row][pos.col];
                  if (figure && figure !== "teamCell" && figure !== "goldenCell") {
                    const count = figureCountMap.get(figure) || 0;
                    figureCountMap.set(figure, count + 1);
                  }
                });
              });
              
              // Обновляем каждую цель
              updatedGoals.forEach(goal => {
                if (figureCountMap.has(goal.figure)) {
                  const count = figureCountMap.get(goal.figure)!;
                  const increment = modifiers.doubleGoalProgress ? count * 2 : count;
                  goal.collected = Math.min(goal.collected + increment, goal.target);
                }
              });
              
              return updatedGoals;
            });
          }

          const roundScore = calculateRoundScore(foundMatches, modifiers);
          totalRoundScore += roundScore;

          if (modifiers.doublePoints || modifiers.doubleGoalProgress) usedModifiers = true;

          setMatches(foundMatches);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));

          // ---------------------------
          // REMOVE NORMAL MATCHES (board ops)
          // ---------------------------
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
          if (lvl?.id == 5) {
            const result = applyHorizontalGravity(boardToProcess);
            boardToProcess = result.board
            setBoard(boardToProcess);
            await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
            if (result.isChanged) {
              boardToProcess = applyGravity(boardToProcess);
              setBoard(boardToProcess);
              await new Promise((r) => setTimeout(r, ANIMATION_DURATION/2));

              boardToProcess = fillEmptySlots(boardToProcess, lvl);
              setBoard(boardToProcess);
            }
          }

          // Восстанавливаем team cells на доске
          updatedSpecialCells.forEach((sc) => {
            if (sc.type === "team" && sc.isActive !== false) {
              if (boardToProcess[sc.row] && boardToProcess[sc.row][sc.col] === null) {
                boardToProcess[sc.row][sc.col] = "teamCell";
              }
            }
          });

          setBoard([...boardToProcess]);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
        }

        // ---------------------------
        // PROCESS DIAMONDS
        // ---------------------------
        let diamondsToRemove: Position[] = [];
        for (let col = 0; col < boardToProcess[0].length; col++) {
          if (boardToProcess[BOARD_ROWS - 1]?.[col] === "diamond") {
            diamondsToRemove.push({ row: BOARD_ROWS - 1, col });
          }
        }

        if (diamondsToRemove.length > 0) {
          const collectedDiamonds = diamondsToRemove.length;

          diamondsToRemove.forEach(({ row, col }) => (boardToProcess[row][col] = null));

          // Update diamond goals
          setGoals((prev) => {
            const next = [...prev];
            const idx = next.findIndex((g) => g.figure === "diamond");
            if (idx !== -1) {
              const inc = modifiers.doubleGoalProgress ? collectedDiamonds * 2 : collectedDiamonds;
              next[idx] = {
                ...next[idx],
                collected: Math.min(next[idx].collected + inc, next[idx].target),
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

          // После заполнения убедимся, что team cells присутствуют
          updatedSpecialCells.forEach((sc) => {
            if (sc.type === "team" && sc.isActive !== false) {
              if (boardToProcess[sc.row]) {
                boardToProcess[sc.row][sc.col] = boardToProcess[sc.row][sc.col] ?? "teamCell";
              }
            }
          });
          setBoard([...boardToProcess]);
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
        }

        // ---------------------------
        // PROCESS STARS
        // ---------------------------
        let starsToRemove: Position[] = [];
        for (let col = 0; col < boardToProcess[0].length; col++) {
          if (boardToProcess[BOARD_ROWS - 1]?.[col] === "star") {
            starsToRemove.push({ row: BOARD_ROWS - 1, col });
          }
        }

        if (starsToRemove.length > 0) {
          const collectedStars = starsToRemove.length;

          starsToRemove.forEach(({ row, col }) => (boardToProcess[row][col] = null));

          // Update star goals
          setGoals((prev) => {
            const next = [...prev];
            const idx = next.findIndex((g) => g.figure === "star");
            if (idx !== -1) {
              const inc = modifiers.doubleGoalProgress ? collectedStars * 2 : collectedStars;
              next[idx] = {
                ...next[idx],
                collected: Math.min(next[idx].collected + inc, next[idx].target),
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

          // After fill, ensure team cells are present
          updatedSpecialCells.forEach((sc) => {
            if (sc.type === "team" && sc.isActive !== false) {
              if (boardToProcess[sc.row]) {
                boardToProcess[sc.row][sc.col] = boardToProcess[sc.row][sc.col] ?? "teamCell";
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

        if (newMatches.length === 0 && moreStars.length === 0 && moreDiamonds.length === 0) {
          hasMatches = false;
          break;
        }
      }

      if (totalRoundScore > 0) {
        setScore((prev) => prev + totalRoundScore);
      }

      // RESET MODIFIERS AFTER BONUS
      if (usedModifiers && activeBonus) {
        const effect = BONUS_EFFECTS[activeBonus.type];
        if (effect.reset) setModifiers(effect.reset());

        setActiveBonus(null);

        if (!effect.isInstant) {
          setBonuses((prev) => {
            const next = [...prev];
            const i = next.findIndex((b) => b.type === activeBonus.type);
            if (i !== -1 && next[i].count > 0) {
              next[i] = { ...next[i], count: next[i].count - 1 };
            }
            return next;
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
    ]
  );

  return { processMatches };
};