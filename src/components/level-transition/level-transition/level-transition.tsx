import { useState } from "react";
import { BonusType } from "types";
import { LEVELS } from "consts/levels";
import { PromotionHeader } from "../promotion-header/promotion-header";
import { BonusSelectionCard } from "../bonus-selection-card/bonus-selection-card";
import "./level-transition.styles.css";
import ChoiceLevel from "@components/choice/main-choice/choice-level";

type LevelTransitionProps = {
  currentLevel: number;
  onLevelStart: (nextLevel: number, selectedBonuses: BonusType[]) => void;
};

export const LevelTransition = ({
  currentLevel,
  onLevelStart,
}: LevelTransitionProps) => {
  const [selectedBonuses, setSelectedBonuses] = useState<BonusType[]>([]);

  let nextLevel = currentLevel + 1;
  const [selectedLevel, setselectedLevel] = useState(NaN);

  if (currentLevel === 3 && !selectedLevel) {
    return <ChoiceLevel onChoiceConfirm = {setselectedLevel} />
  }

  if (currentLevel === 3 && selectedLevel) {
    nextLevel = selectedLevel;
  } else if (currentLevel === 4) {
    nextLevel += 1;
  }

  const nextLevelInfo = LEVELS.find((level) => level.id === nextLevel)!;

  const handleStart = () => {
    onLevelStart(nextLevel, selectedBonuses);
  };

  return (
    <div className="lt-overlay">
      <div className="lt-modal">
        <PromotionHeader
          nextLevelName={nextLevelInfo.name}
          levelDescription={nextLevelInfo.description}
          isFirstLevel={currentLevel===0}
        />
        <BonusSelectionCard
          availableBonuses={nextLevelInfo.bonuses}
          selectedBonuses={selectedBonuses}
          onToggle={setSelectedBonuses}
        />
        <button
          className="lt-start-button"
          onClick={handleStart}
          disabled={selectedBonuses.length !== 2}
        >
          Продолжить игру
        </button>
      </div>
    </div>
  );
};
