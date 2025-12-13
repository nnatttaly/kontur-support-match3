import { Goal } from "./goal";
import { Figure } from "./figure";
import { SpecialCell } from "./special-cell";
import { Position } from "./position";
import { BonusType } from "./bonus-type";

export type Level = {
  id: number;
  name: string;
  description: string;
  goals: Goal[];
  bonuses: BonusType[];
  moves: number;
  availableFigures: Figure[];
  specialCells?: SpecialCell[];
  starPositions?: Position[];
  diamondPositions?: Position[];
  teamPositions?: Position[];
  teamImagePosition?: Position;
};
