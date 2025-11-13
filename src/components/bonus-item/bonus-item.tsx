import { Bonus, ActiveBonus, BonusType } from "types";
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
  const isToggleable = type === "careerGrowth";
  const canUse = count > 0 || isActive;

  const getBonusName = (bonusType: BonusType) => {
    switch (bonusType) {
      case "friendlyTeam":
        return "Дружная команда";
      case "careerGrowth":
        return "Карьерный рост";
      case "barbell":
        return "Штанга";
      default:
        return bonusType;
    }
  };

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
        ${isToggleable ? "bonus-item--toggleable" : ""}
      `}
      onClick={handleClick}
    >
      <div className="bonus-circle">
        <img src={BONUS_PATHS[type]} alt={type} className="bonus-icon" />
        <div className="bonus-count">{count}</div>
      </div>
      <div className="bonus-name">{getBonusName(type)}</div>
    </div>
  );
};
