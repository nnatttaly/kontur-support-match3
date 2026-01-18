import { useState, useEffect } from "react";
import { Bonus } from "types";
import { LEVELS } from "consts/levels";
import { getRandomBonusesForLevel6 } from "@utils/bonus-utils";
import { PromotionHeader } from "../promotion-header/promotion-header";
import { BonusSelectionCard } from "../bonus-selection-card/bonus-selection-card";
import "./level-transition.styles.css";
import ChoiceLevel from "@components/choice/main-choice/choice-level";
import { Button } from "@components/button/button";

type LevelTransitionProps = {
  currentLevel: number;
  onLevelStart: (nextLevel: number, selectedBonuses: Bonus[]) => void;
};

export const LevelTransition = ({
  currentLevel,
  onLevelStart,
}: LevelTransitionProps) => {
  const [selectedLevel, setselectedLevel] = useState(NaN);
  const [bonusesForNextLevel, setBonusesForNextLevel] = useState<Bonus[]>([]);
  const [showChoiceLevel, setShowChoiceLevel] = useState(false);

  // Определяем следующий уровень
  let nextLevel = currentLevel + 1;
  
  // Обрабатываем специальные случаи (уровень 3 и выбор пути)
  if (currentLevel === 3 && selectedLevel) {
    nextLevel = selectedLevel;
  } else if (currentLevel === 4) {
    nextLevel += 1;
  }
  
  const nextLevelInfo = LEVELS.find((level) => level.id === nextLevel);

  // Эффект для сброса выбора при провале уровня 3
  useEffect(() => {
    if (currentLevel === 3) {
      setselectedLevel(NaN);
      setShowChoiceLevel(true);
    } else {
      setShowChoiceLevel(false);
    }
  }, [currentLevel]);

  // Генерируем бонусы для следующего уровня (особенно для 6 уровня)
  useEffect(() => {
    if (nextLevelInfo) {
      if (nextLevel === 6) {
        // Для 6 уровня генерируем случайные бонусы
        const randomBonuses = getRandomBonusesForLevel6();
        setBonusesForNextLevel(randomBonuses);
      } else {
        // Для остальных уровней используем бонусы из конфига
        setBonusesForNextLevel(nextLevelInfo.bonuses);
      }
    }
  }, [nextLevel, nextLevelInfo]);

  const handleChoiceConfirm = (choice: number) => {
    setselectedLevel(choice);
    setShowChoiceLevel(false);
  };

  const handleStart = () => {
    if (nextLevelInfo) {
      // Передаем сгенерированные бонусы (для уровня 6 - случайные)
      onLevelStart(nextLevel, bonusesForNextLevel);
    }
  };

  // Если нужно показать выбор уровня (уровень 3 и выбор еще не сделан)
  if (showChoiceLevel && currentLevel === 3) {
    return <ChoiceLevel onChoiceConfirm={handleChoiceConfirm} />;
  }

  // Если следующий уровень не найден, не рендерим ничего
  if (!nextLevelInfo) {
    return null;
  }

  return (
    <div className="lt-overlay">
      <div className="lt-modal">
        <PromotionHeader
          nextLevelName={nextLevelInfo.name}
          levelDescription={nextLevelInfo.description}
          isFirstLevel={currentLevel === 0}
        />
        <BonusSelectionCard availableBonuses={bonusesForNextLevel} />
        <Button text={currentLevel === 0 ? 'Начать игру' : 'Продолжить игру'} onClick={handleStart} />
      </div>
    </div>
  );
};