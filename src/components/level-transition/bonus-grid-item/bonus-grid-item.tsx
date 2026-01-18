import { Bonus } from "types";
import { BONUS_PATHS, BONUS_NAMES, BONUS_EFFECTS, BONUS_DESCRIPTIONS } from "consts";
import "./bonus-grid-item.styles.css";

type BonusGridItemProps = {
  bonus: Bonus;
};

export const BonusGridItem = ({
  bonus,
}: BonusGridItemProps) => {
  return (
    <div className={`bgi-item`} >
      <div className="bgi-circle">
        <img src={BONUS_PATHS[bonus.type]} alt={bonus.type} className="bgi-icon" />
      </div>
      <div className="bgi-text-block">
        <span className="bgi-name">{BONUS_NAMES[bonus.type]}</span>
        <p className="bgi-description">{BONUS_DESCRIPTIONS[bonus.type]}</p>
        <p className="bgi-effect">{BONUS_EFFECTS[bonus.type]}</p>
      </div>
    </div>
  );
};