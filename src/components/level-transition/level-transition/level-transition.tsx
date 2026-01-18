import { useState, useEffect } from "react";
import { BonusType } from "types";
import { LEVELS } from "consts/levels";
import { PromotionHeader } from "../promotion-header/promotion-header";
import { BonusSelectionCard } from "../bonus-selection-card/bonus-selection-card";
import "./level-transition.styles.css";
import ChoiceLevel from "@components/choice/main-choice/choice-level";
import { Button } from "@components/button/button";

type LevelTransitionProps = {
  currentLevel: number;
  onLevelStart: (nextLevel: number, selectedBonuses: BonusType[]) => void;
};

export const LevelTransition = ({
  currentLevel,
  onLevelStart,
}: LevelTransitionProps) => {
  const [selectedLevel, setselectedLevel] = useState(NaN);

  // Сброс selectedLevel при провале уровня 3
  useEffect(() => {
    if (currentLevel === 3) {
      setselectedLevel(NaN);
    }
  }, [currentLevel]);

  // Определяем следующий уровень
  let nextLevel = currentLevel;
  nextLevel = currentLevel + 1;
  
  // Обрабатываем специальные случаи (уровень 3 и выбор пути)
  if (currentLevel === 3 && !selectedLevel) {
    return <ChoiceLevel onChoiceConfirm={setselectedLevel} />;
  }
  
  if (currentLevel === 3 && selectedLevel) {
    nextLevel = selectedLevel;
  } else if (currentLevel === 4) {
    nextLevel += 1;
  }
  
  const nextLevelInfo = LEVELS.find((level) => level.id === nextLevel)!;

  const handleStart = () => {
    onLevelStart(nextLevel, LEVELS[nextLevel - 1].bonuses);
  };

  return (
    <div className="lt-overlay">
      <div className="lt-modal">
        <PromotionHeader
          nextLevelName={nextLevelInfo.name}
          levelDescription={nextLevelInfo.description}
          isFirstLevel={currentLevel === 0}
        />
        <BonusSelectionCard availableBonuses={nextLevelInfo.bonuses} />
        <Button text={currentLevel === 0 ? 'Начать игру' : 'Продолжить игру'} onClick={handleStart} />
      </div>
    </div>
  );
};