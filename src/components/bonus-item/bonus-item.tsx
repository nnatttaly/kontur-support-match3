import { Bonus, ActiveBonus } from "types";
import { BONUS_PATHS } from "consts";
import "./bonus-item.styles.css";

type BonusItemProps = {
  bonus: Bonus;
  activeBonus: ActiveBonus | null;
  onUse: (type: Bonus["type"]) => void;
};

export const BonusItem = ({ bonus, activeBonus, onUse }: BonusItemProps) => {
  const { type, count } = bonus;

  const isActive = activeBonus?.type === type && activeBonus.isActive;
  const canUse = count > 0 || isActive;

  const handleClick = () => {
    if (canUse) {
      onUse(type);
    }
  };

  return (
    <div
      className={`
        bonus-item 
        ${isActive ? "bonus-item--active" : ""}
        ${!canUse ? "bonus-item--disabled" : ""}
      `}
      onClick={handleClick}
    >
      <div className="bonus-circle">
        <img src={BONUS_PATHS[type]} alt={type} className="bonus-icon" />
        <div className="bonus-count">{count}</div>
      </div>
    </div>
  );
};
