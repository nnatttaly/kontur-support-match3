import { BonusType } from "types";
import { BONUS_PATHS, BONUS_NAMES, BONUS_EFFECTS, BONUS_DESCRIPTIONS } from "consts";
import "./bonus-grid-item.styles.css";

type BonusGridItemProps = {
  type: BonusType;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
};

export const BonusGridItem = ({
  type,
  isSelected,
  isDisabled,
  onClick,
}: BonusGridItemProps) => {
  return (
    <div
      className={`
        bgi-item
        ${isSelected ? "bgi-item--selected" : ""}
        ${isDisabled ? "bgi-item--disabled" : ""}
      `}
      onClick={onClick}
    >
      <div className="bgi-circle">
        <img src={BONUS_PATHS[type]} alt={type} className="bgi-icon" />
        {isSelected && <div className="bgi-check">✓</div>}
      </div>
      <div className="bgi-text-block">
        <span className="bgi-name">{BONUS_NAMES[type]}</span>
        <p className="bgi-description">{BONUS_DESCRIPTIONS[type]}</p>
        <p className="bgi-effect">{BONUS_EFFECTS[type]}</p>
      </div>
    </div>
  );
};