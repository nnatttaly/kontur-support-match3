import { Bonus, ActiveBonus } from "types";
import { BonusItem } from "@components/bonus-item/bonus-item";
import "./bonuses.styles.css";

type BonusesProps = {
  bonuses: Bonus[];
  activeBonus: ActiveBonus | null;
  onUseBonus: (type: Bonus["type"]) => void;
};

export const Bonuses = ({ bonuses, activeBonus, onUseBonus }: BonusesProps) => {
  return (
    <div className="bonuses-container">
      <div className="bonuses-list">
        {bonuses.map((bonus, index) => (
          <BonusItem
            key={index}
            bonus={bonus}
            activeBonus={activeBonus}
            onUse={onUseBonus}
          />
        ))}
      </div>
    </div>
  );
};
