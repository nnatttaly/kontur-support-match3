import { BonusType } from "types";
import { BONUS_PATHS, BONUS_NAMES, BONUS_EFFECTS, BONUS_DESCRIPTIONS } from "consts";
import "./bonus-grid-item.styles.css";

type BonusGridItemProps = {
  type: BonusType;
};

export const BonusGridItem = ({
  type,
}: BonusGridItemProps) => {
  return (
    <div className={`bgi-item`} >
      <div className="bgi-circle">
        <img src={BONUS_PATHS[type]} alt={type} className="bgi-icon" />
      </div>
      <div className="bgi-text-block">
        <span className="bgi-name">{BONUS_NAMES[type]}</span>
        <p className="bgi-description">{BONUS_DESCRIPTIONS[type]}</p>
        <p className="bgi-effect">{BONUS_EFFECTS[type]}</p>
      </div>
    </div>
  );
};