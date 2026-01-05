import { BonusType } from "types";
import { BonusGrid } from "../bonus-grid/bonus-grid";
import "./bonus-selection-card.styles.css";

type BonusSelectionCardProps = {
  availableBonuses: BonusType[];
  selectedBonuses: BonusType[];
  onToggle: (
    bonuses: BonusType[] | ((prev: BonusType[]) => BonusType[])
  ) => void;
};

export const BonusSelectionCard = ({
  availableBonuses,
  selectedBonuses,
  onToggle,
}: BonusSelectionCardProps) => {
  const handleToggle = (bonus: BonusType) => {
    const updater = (prev: BonusType[]): BonusType[] => {
      if (prev.includes(bonus)) {
        return prev.filter((b) => b !== bonus);
      } else if (prev.length < 2) {
        return [...prev, bonus];
      }
      return prev;
    };

    onToggle(updater);
  };

  return (
    <div className="bsc-container">
      <div className="bsc-white-card">
        <h4 className="bsc-title">Выбери 2 бонуса:</h4>
        <BonusGrid
          bonuses={availableBonuses}
          selected={selectedBonuses}
          onToggle={handleToggle}
        />
        <p className="bsc-hint">Выбрано: {selectedBonuses.length}/2</p>
      </div>
    </div>
  );
};