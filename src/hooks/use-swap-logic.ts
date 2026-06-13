import { useCallback, useRef } from "react";
import { Board, Position, SpecialCell } from "types";
import { ANIMATION_DURATION } from "consts";
import { willCreateMatch } from "@utils/game-logic";
import { isTeamImage } from "@utils/game-utils";

export const useSwapLogic = (
  board: Board,
  setIsSwapping: (swapping: boolean) => void,
  setIsAnimating: (animating: boolean) => void,
  setBoard: (board: Board) => void,
  processMatches: (
    board: Board,
    specialCells: SpecialCell[],
    options?: { skipGoldenRestore: boolean; movedToPosition?: Position }
  ) => Promise<Board>
) => {
  const isSwappingInProgress = useRef(false);

  const areAdjacent = useCallback((pos1: Position, pos2: Position): boolean => {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }, []);

  const canSwap = useCallback((board: Board, pos1: Position, pos2: Position): boolean => {
    const figure1 = board[pos1.row][pos1.col];
    const figure2 = board[pos2.row][pos2.col];

    if (
      figure1?.type === "team" ||
      figure2?.type === "team" ||
      figure1?.type === "bomb" ||
      figure2?.type === "bomb" ||
      isTeamImage(figure1) ||
      isTeamImage(figure2)
    ) {
      return false;
    }

    return true;
  }, []);

  const swapFigures = useCallback(
    async (
      pos1: Position,
      pos2: Position,
      moves: number,
      setMoves: (updater: (moves: number) => number) => void,
      specialCells: SpecialCell[]
    ): Promise<boolean> => {
      if (isSwappingInProgress.current) {
        return false;
      }

      if (moves <= 0) return false;

      isSwappingInProgress.current = true;
      setIsSwapping(true);
      setIsAnimating(true);

      if (!canSwap(board, pos1, pos2)) {
        setIsSwapping(false);
        setIsAnimating(false);
        isSwappingInProgress.current = false;
        return false;
      }

      const figure1 = board[pos1.row][pos1.col];
      const figure2 = board[pos2.row][pos2.col];

      if (figure1?.type === "star" && figure2?.type === "star") {
        setIsSwapping(false);
        setIsAnimating(false);
        isSwappingInProgress.current = false;
        return false;
      }

      if (!willCreateMatch(board, pos1, pos2)) {
        setIsSwapping(false);
        setIsAnimating(false);
        isSwappingInProgress.current = false;
        return false;
      }

      const newBoard = board.map((row) => [...row]);
      const temp = newBoard[pos1.row][pos1.col];
      newBoard[pos1.row][pos1.col] = newBoard[pos2.row][pos2.col];
      newBoard[pos2.row][pos2.col] = temp;

      setBoard(newBoard);
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));
      setIsSwapping(false);

      setMoves((prevMoves) => (prevMoves <= 0 ? 0 : prevMoves - 1));

      await processMatches(newBoard, specialCells, {
        skipGoldenRestore: false,
        movedToPosition: pos2,
      });
      setIsAnimating(false);

      isSwappingInProgress.current = false;
      return true;
    },
    [board, setIsSwapping, setIsAnimating, processMatches, setBoard, canSwap]
  );

  return {
    areAdjacent,
    swapFigures,
  };
};