import { BonusType } from "types";
import { BonusGridItem } from "../bonus-grid-item/bonus-grid-item";
import "./bonus-grid.styles.css";

type BonusGridProps = {
  bonuses: BonusType[];
  selected: BonusType[];
  onToggle: (bonus: BonusType) => void;
};

export const BonusGrid = ({ bonuses, selected, onToggle }: BonusGridProps) => {
  return (
    <div className="bg-grid">
      {bonuses.map((bonus) => (
        <BonusGridItem
          key={bonus}
          type={bonus}
          isSelected={selected.includes(bonus)}
          isDisabled={selected.length >= 2 && !selected.includes(bonus)}
          onClick={() => onToggle(bonus)}
        />
      ))}
    </div>
  );
};
