import { useState } from "react";
import { BonusType } from "types";
import { LEVEL_NAMES } from "consts/levels";
import { BONUS_NAMES } from "consts/bonus-names";
import "./level-transition.styles.css";

type LevelTransitionProps = {
  currentLevel: number;
  nextLevel: number;
  onLevelStart: (selectedBonuses: BonusType[]) => void;
};

export const LevelTransition = ({
  currentLevel,
  nextLevel,
  onLevelStart,
}: LevelTransitionProps) => {
  const [selectedBonuses, setSelectedBonuses] = useState<BonusType[]>([]);

  const availableBonuses: BonusType[] = [
    "friendlyTeam",
    "careerGrowth",
    "sportCompensation",
  ];

  const handleBonusToggle = (bonusType: BonusType) => {
    setSelectedBonuses((prev) => {
      if (prev.includes(bonusType)) {
        return prev.filter((b) => b !== bonusType);
      } else if (prev.length < 2) {
        return [...prev, bonusType];
      }
      return prev;
    });
  };

  const handleStartLevel = () => {
    onLevelStart(selectedBonuses);
  };

  const currentLevelName =
    LEVEL_NAMES[currentLevel] || `Уровень ${currentLevel}`;
  const nextLevelName = LEVEL_NAMES[nextLevel] || `Уровень ${nextLevel}`;

  return (
    <div className="level-transition-overlay">
      <div className="level-transition-modal">
        <div className="level-transition-header">
          <h2>Поздравляем!</h2>
          <p>
            Вы успешно завершили уровень <strong>{currentLevelName}</strong>
          </p>
        </div>

        <div className="promotion-section">
          <h3>Повышение!</h3>
          <p>
            Теперь вы <strong>{nextLevelName}</strong>
          </p>
        </div>

        <div className="bonus-selection-section">
          <h4>Выберите 2 бонуса для следующего уровня:</h4>
          <div className="bonus-selection-grid">
            {availableBonuses.map((bonusType) => (
              <div
                key={bonusType}
                className={`bonus-selection-item ${
                  selectedBonuses.includes(bonusType)
                    ? "bonus-selection-item--selected"
                    : ""
                } ${
                  selectedBonuses.length >= 2 &&
                  !selectedBonuses.includes(bonusType)
                    ? "bonus-selection-item--disabled"
                    : ""
                }`}
                onClick={() => handleBonusToggle(bonusType)}
              >
                <div className="bonus-selection-icon">
                  {BONUS_NAMES[bonusType]
                    .split(" ")
                    .map((word) => word[0])
                    .join("")}
                </div>
                <span className="bonus-selection-name">
                  {BONUS_NAMES[bonusType]}
                </span>
                {selectedBonuses.includes(bonusType) && (
                  <div className="bonus-selection-check">✓</div>
                )}
              </div>
            ))}
          </div>
          <p className="bonus-selection-hint">
            Выбрано: {selectedBonuses.length}/2
          </p>
        </div>

        <button
          className="start-level-button"
          onClick={handleStartLevel}
          disabled={selectedBonuses.length !== 2}
        >
          Продолжить игру
        </button>
      </div>
    </div>
  );
};
