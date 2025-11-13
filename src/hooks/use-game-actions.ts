import { useCallback } from "react";
import { Board, Position, Match, GameModifiers, ActiveBonus, Bonus } from "types";
import { ANIMATION_DURATION } from "consts";
import {
  findAllMatches,
  updateBoardAfterMatches,
  applyGravity,
  fillEmptySlots,
  willCreateMatch,
} from "@utils/game-logic";
import { resetCareerGrowthModifiers } from "@utils/bonus-effects";

export const useGameActions = (
  board: Board,
  setBoard: (board: Board) => void,
  setIsSwapping: (swapping: boolean) => void,
  setIsAnimating: (animating: boolean) => void,
  setMatches: (matches: Match[]) => void,
  setScore: (updater: (score: number) => number) => void,
  updateGoals: (matches: Match[], modifiers: GameModifiers) => void,
  modifiers: GameModifiers,
  setModifiers: (modifiers: GameModifiers) => void,
  setActiveBonus: (bonus: ActiveBonus | null) => void,
  setBonuses: (updater: (bonuses: Bonus[]) => Bonus[]) => void
) => {
  const areAdjacent = useCallback((pos1: Position, pos2: Position): boolean => {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }, []);

  const processMatches = useCallback(
    async (currentBoard: Board): Promise<Board> => {
      let boardToProcess = currentBoard;
      let hasMatches = true;
      let roundScore = 0;
      let usedCareerGrowth = false;

      while (hasMatches) {
        const foundMatches = findAllMatches(boardToProcess);

        if (foundMatches.length === 0) {
          hasMatches = false;
          break;
        }

        updateGoals(foundMatches, modifiers);

        const scoreMultiplier = modifiers.doublePoints ? 2 : 1;
        foundMatches.forEach((match) => {
          roundScore += match.positions.length * 10 * scoreMultiplier;
        });

        if (modifiers.doublePoints || modifiers.doubleGoalProgress) {
          usedCareerGrowth = true;
        }

        setMatches(foundMatches);
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

        boardToProcess = updateBoardAfterMatches(boardToProcess);
        setBoard(boardToProcess);
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

        setMatches([]);

        boardToProcess = applyGravity(boardToProcess);
        setBoard(boardToProcess);
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

        boardToProcess = fillEmptySlots(boardToProcess);
        setBoard(boardToProcess);
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));
      }

      if (roundScore > 0) {
        setScore((prevScore) => prevScore + roundScore);
      }

      if (usedCareerGrowth) {
        setModifiers(resetCareerGrowthModifiers());
        setActiveBonus(null);

        setBonuses((prevBonuses) => {
          const newBonuses = [...prevBonuses];
          const bonusIndex = newBonuses.findIndex(
            (bonus) => bonus.type === "careerGrowth"
          );

          if (bonusIndex !== -1 && newBonuses[bonusIndex].count > 0) {
            newBonuses[bonusIndex] = {
              ...newBonuses[bonusIndex],
              count: newBonuses[bonusIndex].count - 1,
            };
          }

          return newBonuses;
        });

      }

      return boardToProcess;
    },
    [
      setBoard,
      setMatches,
      setScore,
      updateGoals,
      modifiers,
      setModifiers,
      setActiveBonus,
      setBonuses,
    ]
  );

  const swapFigures = useCallback(
    async (
      pos1: Position,
      pos2: Position,
      moves: number,
      setMoves: (updater: (moves: number) => number) => void
    ): Promise<boolean> => {
      if (moves <= 0) return false;

      setIsSwapping(true);
      setIsAnimating(true);

      if (!willCreateMatch(board, pos1, pos2)) {
        setIsSwapping(false);
        setIsAnimating(false);
        return false;
      }

      const newBoard = board.map((row) => [...row]);
      const temp = newBoard[pos1.row][pos1.col];
      newBoard[pos1.row][pos1.col] = newBoard[pos2.row][pos2.col];
      newBoard[pos2.row][pos2.col] = temp;

      setBoard(newBoard);
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));
      setIsSwapping(false);

      setMoves((prevMoves) => prevMoves - 1);

      await processMatches(newBoard);
      setIsAnimating(false);

      return true;
    },
    [board, setIsSwapping, setIsAnimating, processMatches, setBoard]
  );

  return {
    areAdjacent,
    processMatches,
    swapFigures,
  };
};
