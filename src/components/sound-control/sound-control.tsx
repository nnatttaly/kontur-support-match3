import { useEffect, useRef, useState } from "react";
import "./sound-control.styles.css";
import { SOUND_ICON_PATHS } from "consts";

export type SoundControlProps = {
  volume: number;
  onVolumeChange: (volume: number) => void;
  containerClassName?: string;
};

export const SoundControl = ({
  volume,
  onVolumeChange,
  containerClassName = "",
}: SoundControlProps) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const soundControlRef = useRef<HTMLDivElement>(null);
  const className = ["sound-control", containerClassName].filter(Boolean).join(" ");

  const volumeIcon =
    volume === 0 ? SOUND_ICON_PATHS.soundOff : volume < 60 ? SOUND_ICON_PATHS.soundMedium : SOUND_ICON_PATHS.soundLoud;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showVolumeSlider &&
        soundControlRef.current &&
        !soundControlRef.current.contains(event.target as Node)
      ) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showVolumeSlider]);

  return (
    <div className={className} ref={soundControlRef}>
      <button
        type="button"
        className="sound-toggle"
        onClick={() => setShowVolumeSlider((prev) => !prev)}
        aria-label={
          showVolumeSlider ? "Скрыть громкость" : "Показать громкость"
        }
        aria-expanded={showVolumeSlider}
      >
        <img 
          src={volumeIcon} 
          alt="" 
          className={`sound-icon ${volumeIcon === SOUND_ICON_PATHS.soundLoud ? 'sound-icon--loud' : ''}`}
        />
      </button>

      {showVolumeSlider && (
        <div className="sound-panel">
          <input
            className="sound-slider"
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            aria-label="Громкость музыки"
          />
        </div>
      )}
    </div>
  );
};
