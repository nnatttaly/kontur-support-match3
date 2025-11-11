import { Bonus } from "types";
import { BonusItem } from "@components/bonus-item/bonus-item";
import "./bonuses.styles.css";

type BonusesProps = {
  bonuses: Bonus[];
  onUseBonus: (type: Bonus["type"]) => void;
};

export const Bonuses = ({ bonuses, onUseBonus }: BonusesProps) => {
  return (
    <div className="bonuses-container">
      <div className="bonuses-list">
        {bonuses.map((bonus, index) => (
          <BonusItem key={index} bonus={bonus} onUse={onUseBonus} />
        ))}
      </div>
    </div>
  );
};
