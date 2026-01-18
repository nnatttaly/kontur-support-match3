import { BonusType } from "types";
import { BonusGridItem } from "../bonus-grid-item/bonus-grid-item";
import "./bonus-grid.styles.css";

type BonusGridProps = {
  bonuses: BonusType[];
};

export const BonusGrid = ({ bonuses }: BonusGridProps) => {
  return (
    <div className="bg-grid">
      {bonuses.map((bonus) => (
        <BonusGridItem
          key={bonus}
          type={bonus}
        />
      ))}
    </div>
  );
};
