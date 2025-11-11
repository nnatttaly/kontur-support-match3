import { useState, useCallback } from "react";
import { Board, Position, Match } from "types";
import { ANIMATION_DURATION } from "consts";
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

  const areAdjacent = useCallback((pos1: Position, pos2: Position): boolean => {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }, []);

  const processMatches = useCallback(
    async (currentBoard: Board): Promise<Board> => {
      let boardToProcess = currentBoard;
      let hasMatches = true;

      while (hasMatches) {
        const foundMatches = findAllMatches(boardToProcess);

        if (foundMatches.length === 0) {
          hasMatches = false;
          break;
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

      return boardToProcess;
    },
    []
  );

  const swapFigures = useCallback(
    async (pos1: Position, pos2: Position): Promise<boolean> => {
      if (isSwapping || isAnimating) return false;

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

      await processMatches(newBoard);
      setIsAnimating(false);

      return true;
    },
    [board, isSwapping, isAnimating, processMatches]
  );

  const handleCellClick = useCallback(
    (position: Position) => {
      if (isSwapping || isAnimating) return;

      if (!selectedPosition) {
        setSelectedPosition(position);
      } else {
        if (areAdjacent(selectedPosition, position)) {
          swapFigures(selectedPosition, position);
        }
        setSelectedPosition(null);
      }
    },
    [selectedPosition, isSwapping, isAnimating, areAdjacent, swapFigures]
  );

  const handleDragStart = useCallback(
    (position: Position) => {
      if (isSwapping || isAnimating) return;
      setSelectedPosition(position);
    },
    [isSwapping, isAnimating]
  );

  const handleDragOver = useCallback(
    (position: Position) => {
      if (!selectedPosition || isSwapping || isAnimating) return;

      if (areAdjacent(selectedPosition, position)) {
        swapFigures(selectedPosition, position);
        setSelectedPosition(null);
      }
    },
    [selectedPosition, isSwapping, isAnimating, areAdjacent, swapFigures]
  );

  return {
    board,
    selectedPosition,
    isSwapping,
    isAnimating,
    matches,
    handleCellClick,
    handleDragStart,
    handleDragOver,
    resetSelection: () => setSelectedPosition(null),
  };
};
