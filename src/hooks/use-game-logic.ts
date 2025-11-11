import { useState, useCallback } from "react";
import { Board, Position, Match, Goal, Bonus } from "types";
import {
  ANIMATION_DURATION,
  INITIAL_MOVES,
  INITIAL_GOALS,
  INITIAL_BONUSES,
} from "consts";
import {
  createInitialBoard,
  findAllMatches,
  updateBoardAfterMatches,
  applyGravity,
  fillEmptySlots,
  willCreateMatch,
} from "@utils/game-logic";

export const useGameLogic = () => {
  const [board, setBoard] = useState<Board>(createInitialBoard());
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );
  const [isSwapping, setIsSwapping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(INITIAL_MOVES);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [bonuses, setBonuses] = useState<Bonus[]>(INITIAL_BONUSES);

  const useBonus = useCallback((type: Bonus["type"]) => {
    setBonuses((prevBonuses) => {
      const newBonuses = [...prevBonuses];
      const bonusIndex = newBonuses.findIndex((bonus) => bonus.type === type);

      if (bonusIndex !== -1 && newBonuses[bonusIndex].count > 0) {
        newBonuses[bonusIndex] = {
          ...newBonuses[bonusIndex],
          count: newBonuses[bonusIndex].count - 1,
        };

        // TODO: Здесь будет логика применения бонуса
      }

      return newBonuses;
    });
  }, []);

  const updateGoals = useCallback((foundMatches: Match[]) => {
    setGoals((prevGoals) => {
      const newGoals = [...prevGoals];

      foundMatches.forEach((match) => {
        const goalIndex = newGoals.findIndex(
          (goal) => goal.figure === match.figure
        );
        if (goalIndex !== -1) {
          newGoals[goalIndex] = {
            ...newGoals[goalIndex],
            collected: Math.min(
              newGoals[goalIndex].collected + match.positions.length,
              newGoals[goalIndex].target
            ),
          };
        }
      });

      return newGoals;
    });
  }, []);

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

      while (hasMatches) {
        const foundMatches = findAllMatches(boardToProcess);

        if (foundMatches.length === 0) {
          hasMatches = false;
          break;
        }

        updateGoals(foundMatches);

        foundMatches.forEach((match) => {
          roundScore += match.positions.length * 10;
        });

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

      return boardToProcess;
    },
    [updateGoals]
  );

  const swapFigures = useCallback(
    async (pos1: Position, pos2: Position): Promise<boolean> => {
      if (isSwapping || isAnimating || moves <= 0) return false;

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
    [board, isSwapping, isAnimating, moves, processMatches]
  );

  const handleCellClick = useCallback(
    (position: Position) => {
      if (isSwapping || isAnimating || moves <= 0) return;

      if (!selectedPosition) {
        setSelectedPosition(position);
      } else {
        if (areAdjacent(selectedPosition, position)) {
          swapFigures(selectedPosition, position);
        }
        setSelectedPosition(null);
      }
    },
    [selectedPosition, isSwapping, isAnimating, moves, areAdjacent, swapFigures]
  );

  const handleDragStart = useCallback(
    (position: Position) => {
      if (isSwapping || isAnimating || moves <= 0) return;
      setSelectedPosition(position);
    },
    [isSwapping, isAnimating, moves]
  );

  const handleDragOver = useCallback(
    (position: Position) => {
      if (!selectedPosition || isSwapping || isAnimating || moves <= 0) return;

      if (areAdjacent(selectedPosition, position)) {
        swapFigures(selectedPosition, position);
        setSelectedPosition(null);
      }
    },
    [selectedPosition, isSwapping, isAnimating, moves, areAdjacent, swapFigures]
  );

  return {
    board,
    selectedPosition,
    isSwapping,
    isAnimating,
    matches,
    score,
    moves,
    goals,
    bonuses,
    handleCellClick,
    handleDragStart,
    handleDragOver,
    useBonus,
    resetSelection: () => setSelectedPosition(null),
  };
};
