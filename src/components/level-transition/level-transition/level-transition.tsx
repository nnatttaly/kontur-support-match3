import { useEffect, useState } from "react";
import { Bonus } from "types";
import { getRandomBonusesForLevel6 } from "@utils/bonus-utils";
import { 
  SoundControl,
  Button,
  PromotionHeader,
  BonusSelectionCard,
  ChoiceLevel
} from "../../../components";
import "./level-transition.styles.css";
import { LEVELS } from "consts";

type LevelTransitionProps = {
  currentLevel: number;
  onLevelStart: (nextLevel: number, selectedBonuses: Bonus[]) => void;
  promotionLink?: string;
  promotionLinkText?: string;
  hideAlternateLevelButton?: boolean;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
};

const getBonusesForLevel = (levelId: number): Bonus[] => {
  if (levelId === 6) {
    return getRandomBonusesForLevel6();
  }

  return LEVELS.find((level) => level.id === levelId)?.bonuses ?? [];
};

export const LevelTransition = ({
  currentLevel,
  onLevelStart,
  promotionLink,
  promotionLinkText = "Узнать о карьере в поддержке",
  hideAlternateLevelButton = false,
  volume = 50,
  onVolumeChange,
}: LevelTransitionProps) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(NaN);
  const [bonusesForNextLevel, setBonusesForNextLevel] = useState<Bonus[]>([]);
  const [showChoiceLevel, setShowChoiceLevel] = useState(false);

  const isChoiceLevel = currentLevel === 3;

  let nextLevel = currentLevel + 1;

  if (isChoiceLevel && !Number.isNaN(selectedLevel)) {
    nextLevel = selectedLevel;
  } else if (currentLevel === 4) {
    nextLevel += 1;
  }

  const nextLevelInfo = LEVELS.find((level) => level.id === nextLevel);

  const alternateLevel = currentLevel === 4 ? 5 : currentLevel === 5 ? 4 : null;

  const alternateLevelInfo =
    alternateLevel !== null
      ? LEVELS.find((level) => level.id === alternateLevel)
      : null;

  useEffect(() => {
    if (isChoiceLevel) {
      setSelectedLevel(NaN);
      setShowChoiceLevel(true);
    } else {
      setShowChoiceLevel(false);
    }
  }, [isChoiceLevel]);

  useEffect(() => {
    if (!nextLevelInfo) {
      setBonusesForNextLevel([]);
      return;
    }

    if (nextLevel === 6) {
      setBonusesForNextLevel(getRandomBonusesForLevel6());
    } else {
      setBonusesForNextLevel(nextLevelInfo.bonuses);
    }
  }, [nextLevel, nextLevelInfo]);

  const handleChoiceConfirm = (choice: number) => {
    setSelectedLevel(choice);
    setShowChoiceLevel(false);
  };

  const handleStartMain = () => {
    if (nextLevelInfo) {
      onLevelStart(nextLevel, bonusesForNextLevel);
    }
  };

  const handleStartAlternate = () => {
    if (!alternateLevelInfo || alternateLevel === null) {
      return;
    }

    onLevelStart(alternateLevel, getBonusesForLevel(alternateLevel));
  };

  const handleVolumeChange = (newVolume: number) => {
    onVolumeChange?.(newVolume);
  };

  if (showChoiceLevel && isChoiceLevel) {
    return <ChoiceLevel onChoiceConfirm={handleChoiceConfirm} />;
  }

  if (!nextLevelInfo) {
    return null;
  }

  const shouldShowPromotionLink = Boolean(promotionLink) && nextLevel >= 2;

  const shouldShowAlternateButton =
    (currentLevel === 4 || currentLevel === 5) && !hideAlternateLevelButton;

  const alternateButtonText =
    currentLevel === 4
      ? "Пройти уровень Эксперт"
      : "Пройти уровень Руководитель группы";

  return (
    <div className="overlay">
      <div className="center-wrapper">
        <div className="modal">
          <PromotionHeader
            nextLevelName={nextLevelInfo.name}
            levelDescription={nextLevelInfo.description}
            isFirstLevel={currentLevel === 0}
          />

          <BonusSelectionCard availableBonuses={bonusesForNextLevel} />

          <div className="actions">
            <Button
              text={currentLevel === 0 ? "Начать игру" : "Продолжить игру"}
              onClick={handleStartMain}
            />

            {shouldShowAlternateButton && (
              <Button text={alternateButtonText} onClick={handleStartAlternate} />
            )}

            {shouldShowPromotionLink && (
              <a
                className="link-button link-button--small"
                href={promotionLink}
                target="_blank"
                rel="noreferrer noopener"
              >
                {promotionLinkText}
              </a>
            )}
          </div>
        </div>

        <SoundControl
          volume={volume}
          onVolumeChange={handleVolumeChange}
          containerClassName="lt-sound-control"
        />
      </div>
    </div>
  );
};
