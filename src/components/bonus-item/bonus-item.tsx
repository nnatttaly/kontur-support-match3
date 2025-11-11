import { Bonus } from "types";
import { BONUS_PATHS } from "consts";
import "./bonus-item.styles.css";

type BonusItemProps = {
  bonus: Bonus;
  onUse: (type: Bonus["type"]) => void;
};

export const BonusItem = ({ bonus, onUse }: BonusItemProps) => {
  const { type, count } = bonus;

  const handleClick = () => {
    if (count > 0) {
      onUse(type);
    }
  };

  return (
    <div
      className={`bonus-item ${count === 0 ? "bonus-item--disabled" : ""}`}
      onClick={handleClick}
    >
      <div className="bonus-circle">
        <img src={BONUS_PATHS[type]} alt={type} className="bonus-icon" />
      </div>
      <div className="bonus-count">{count}</div>
    </div>
  );
};
