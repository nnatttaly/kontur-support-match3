import { useMatchProcessing } from "./use-match-processing";
import { useSwapLogic } from "./use-swap-logic";
import {
  Board,
  Match,
  GameModifiers,
  ActiveBonus,
  Bonus,
  Goal,
  Level,
  SpecialCell,
} from "types";

type UseGameActionsProps = {
  board: Board;
  setBoard: (board: Board) => void;
  setIsSwapping: (swapping: boolean) => void;
  setIsAnimating: (animating: boolean) => void;
  setMatches: (matches: Match[]) => void;
  setScore: (updater: (score: number) => number) => void;
  setGoals: (updater: (goals: Goal[]) => Goal[]) => void;
  modifiers: GameModifiers;
  setModifiers: (modifiers: GameModifiers) => void;
  activeBonus: ActiveBonus | null;
  setActiveBonus: (bonus: ActiveBonus | null) => void;
  setBonuses: (updater: (bonuses: Bonus[]) => Bonus[]) => void;
  currentLevel?: Level;
  onSpecialCellsUpdate?: (specialCells: SpecialCell[]) => void; // Добавляем колбек
};

export const useGameActions = ({
  board,
  setBoard,
  setIsSwapping,
  setIsAnimating,
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
}: UseGameActionsProps) => {
  const { processMatches } = useMatchProcessing({
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
  });

  const { areAdjacent, swapFigures } = useSwapLogic(
    board,
    setIsSwapping,
    setIsAnimating,
    setBoard,
    processMatches
  );

  return {
    areAdjacent,
    processMatches,
    swapFigures,
  };
};
