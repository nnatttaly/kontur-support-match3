import { Figure } from "./figure";
import { SpecialCell } from "./special-cell";

export interface BoardCell {
  figure: Figure | null;
  specialCell?: SpecialCell;
}
