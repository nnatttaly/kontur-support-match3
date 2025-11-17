import { Goal } from "./goal";
import { Figure } from "./figure";
import { SpecialCell } from "./special-cell";

export type Level = {
  id: number;
  name: string;
  description: string;
  goals: Goal[];
  moves: number;
  availableFigures: Figure[];
  specialCells?: SpecialCell[];
};
