import { useEffect, useRef, useState } from "react";
import "./sound-control.styles.css";
import { SOUND_ICON_PATHS } from "consts";

export type SoundControlProps = {
  volume: number;
  onVolumeChange: (volume: number) => void;
  containerClassName?: string;
  audioRef?: React.RefObject<HTMLAudioElement>;
};

export const SoundControl = ({
  volume,
  onVolumeChange,
  containerClassName = "",
  audioRef,
}: SoundControlProps) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const soundControlRef = useRef<HTMLDivElement>(null);
  const className = ["sound-control", containerClassName].filter(Boolean).join(" ");

  const volumeIcon =
    volume === 0 ? SOUND_ICON_PATHS.soundOff : volume < 60 ? SOUND_ICON_PATHS.soundMedium : SOUND_ICON_PATHS.soundLoud;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        showVolumeSlider &&
        soundControlRef.current &&
        !soundControlRef.current.contains(event.target as Node)
      ) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener("click", handleClickOutside as EventListener);
    document.addEventListener("touchend", handleClickOutside as EventListener);
    return () => {
      document.removeEventListener("click", handleClickOutside as EventListener);
      document.removeEventListener("touchend", handleClickOutside as EventListener);
    };
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
        <div 
          className="sound-panel"
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            className="sound-slider"
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            onInput={(e) => {
              const newVolume = Number((e.target as HTMLInputElement).value);
              onVolumeChange(newVolume);
              if (audioRef?.current) {
                audioRef.current.volume = newVolume / 600;
              }
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            aria-label="Громкость музыки"
          />
        </div>
      )}
    </div>
  );
};
