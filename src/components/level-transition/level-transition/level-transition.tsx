import { useState, useEffect } from "react";
import { BonusType } from "types";
import { LEVELS } from "consts/levels";
import { PromotionHeader } from "../promotion-header/promotion-header";
import { BonusSelectionCard } from "../bonus-selection-card/bonus-selection-card";
import "./level-transition.styles.css";
import ChoiceLevel from "@components/choice/main-choice/choice-level";

type LevelTransitionProps = {
  currentLevel: number;
  onLevelStart: (nextLevel: number, selectedBonuses: BonusType[]) => void;
  isLevelFailed: boolean; // Новый пропс
};

export const LevelTransition = ({
  currentLevel,
  onLevelStart,
  isLevelFailed,
}: LevelTransitionProps) => {
  const [selectedBonuses, setSelectedBonuses] = useState<BonusType[]>([]);
  const [selectedLevel, setselectedLevel] = useState(NaN);

  // Сброс selectedLevel при провале уровня 3
  useEffect(() => {
    if (isLevelFailed && currentLevel === 3) {
      setselectedLevel(NaN);
    }
  }, [isLevelFailed, currentLevel]);

  // Определяем следующий уровень
  let nextLevel = currentLevel;
  
  // Если уровень не провален, вычисляем следующий уровень как обычно
  if (!isLevelFailed) {
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
  }
  
  // Если уровень провален, остаемся на том же уровне (nextLevel = currentLevel)

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
          isFirstLevel={currentLevel === 0 && !isLevelFailed}
          isLevelFailed={isLevelFailed}
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
          {isLevelFailed 
            ? 'Попробовать снова' 
            : (currentLevel === 0 ? 'Начать игру' : 'Продолжить игру')}
        </button>
      </div>
    </div>
  );
};