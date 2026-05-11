import { Button } from '@components/button/button';
import './fail-transition.css';
import soundOffIcon from "@/assets/icons/sound-off.svg";
import soundMediumIcon from "@/assets/icons/sound-medium.svg";
import soundLoudIcon from "@/assets/icons/sound-loud.svg";
import { useState } from 'react';

type FailTransitionProps = {
  onRestart: () => void;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
};

export const FailTransition = ({
  onRestart,
  volume = 50,
  onVolumeChange,
}: FailTransitionProps) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const volumeIcon =
    volume === 0 ? soundOffIcon : volume < 60 ? soundMediumIcon : soundLoudIcon;

  const handleVolumeChange = (newVolume: number) => {
    onVolumeChange?.(newVolume);
  };

  return (
    <div className="fail-content">
      <h2>Неудача</h2>
      <p className="fail-message">
        {"Не вышло… но это нормально! У всех бывают неудачи — даже у самых опытных специалистов. Сделай вдох, соберись и попробуй ещё раз. Ты точно справишься!"}
      </p>
      <div className="fail-actions">
        <Button text='Перепройти уровень' onClick={onRestart} />
        <div className="fail-sound-control">
          <button
            type="button"
            className="fail-sound-toggle"
            onClick={() => setShowVolumeSlider((prev) => !prev)}
            aria-label={showVolumeSlider ? "Скрыть громкость" : "Показать громкость"}
            aria-expanded={showVolumeSlider}
          >
            <img src={volumeIcon} alt="" className="fail-sound-icon" />
          </button>

          {showVolumeSlider && (
            <div className="fail-sound-panel">
              <input
                className="fail-sound-slider"
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                aria-label="Громкость музыки"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
