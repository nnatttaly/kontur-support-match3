import { Bonus } from "types";
import { BonusGrid } from "../bonus-grid/bonus-grid";
import "./bonus-selection-card.styles.css";

type BonusSelectionCardProps = {
  availableBonuses: Bonus[];
};

export const BonusSelectionCard = ({
  availableBonuses,
}: BonusSelectionCardProps) => {
  return (
    <div className="bsc-container">
      <div className="bsc-white-card">
        <h4 className="bsc-title">Доступны 2 бонуса:</h4>
        <BonusGrid
          bonuses={availableBonuses}
        />
      </div>
    </div>
  );
};