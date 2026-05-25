import { useEffect, useRef, useState } from "react";
import "./sound-control.styles.css";
import { SOUND_ICON_PATHS } from "consts";

export type SoundControlProps = {
  volume: number;
  onVolumeChange: (volume: number) => void;
  containerClassName?: string;
  audioRef?: React.RefObject<HTMLAudioElement>;
  gainNodeRef?: React.RefObject<GainNode | null>;
};

// Определяем, является ли устройство iOS (iPhone, iPad, iPod)
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export const SoundControl = ({
  volume,
  onVolumeChange,
  containerClassName = "",
  audioRef,
  gainNodeRef,
}: SoundControlProps) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isIOSDevice] = useState(isIOS());
  const soundControlRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const className = ["sound-control", containerClassName].filter(Boolean).join(" ");

  const volumeIcon =
    volume === 0 ? SOUND_ICON_PATHS.soundOff : volume < 60 ? SOUND_ICON_PATHS.soundMedium : SOUND_ICON_PATHS.soundLoud;

  // Для iOS: включение/выключение воспроизведения (громкость только для чтения на iPhone)
  const handleIOSToggle = () => {
    if (audioRef?.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        onVolumeChange(60); // Показываем в UI как включено
      } else {
        audioRef.current.pause();
        onVolumeChange(0); // Показываем в UI как выключено
      }
    }
  };

  const handleSliderChange = (newVolume: number) => {
    const volumeValue = newVolume / 600;
    
    // На iOS управление громкостью работает только через Web Audio API GainNode
    // audio.volume на iOS читается только и не может быть изменен
    
    // Обновляем громкость в Web Audio API (работает на всех платформах включая iOS)
    if (gainNodeRef?.current) {
      gainNodeRef.current.gain.value = volumeValue;
    }
    
    // На ПК также обновляем audio.volume для резервности
    if (audioRef?.current && audioRef.current.volume !== undefined) {
      try {
        audioRef.current.volume = volumeValue;
      } catch (e) {
        // На iOS это может выбросить ошибку, но это ок - используем GainNode
      }
    }
    
    // Обновляем состояние компонента
    onVolumeChange(newVolume);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!sliderRef.current) return;
    
    const touch = e.touches[0];
    const slider = sliderRef.current;
    const rect = slider.getBoundingClientRect();
    
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newVolume = Math.round(percentage * 100);
    
    // Обновляем значение input
    slider.value = String(newVolume);
    
    const volumeValue = newVolume / 600;
    
    // Обновляем громкость через Web Audio API
    if (gainNodeRef?.current) {
      gainNodeRef.current.gain.value = volumeValue;
    }
    
    // На ПК также обновляем audio.volume
    if (audioRef?.current) {
      try {
        audioRef.current.volume = volumeValue;
      } catch (e) {
        // На iOS это может выбросить ошибку
      }
    }
    
    // Обновляем состояние
    onVolumeChange(newVolume);
  };

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
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showVolumeSlider]);

  return (
    <div className={className} ref={soundControlRef}>
      <button
        type="button"
        className="sound-toggle"
        onClick={isIOSDevice ? handleIOSToggle : () => setShowVolumeSlider((prev) => !prev)}
        aria-label={
          isIOSDevice 
            ? (volume > 0 ? "Выключить музыку" : "Включить музыку")
            : (showVolumeSlider ? "Скрыть громкость" : "Показать громкость")
        }
        aria-expanded={isIOSDevice ? undefined : showVolumeSlider}
      >
        <img 
          src={volumeIcon} 
          alt="" 
          className={`sound-icon ${volumeIcon === SOUND_ICON_PATHS.soundLoud ? 'sound-icon--loud' : ''}`}
        />
      </button>

      {!isIOSDevice && showVolumeSlider && (
        <div 
          className="sound-panel"
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={sliderRef}
            className="sound-slider"
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            onInput={(e) => handleSliderChange(Number((e.target as HTMLInputElement).value))}
            onTouchMove={handleTouchMove}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            aria-label="Громкость музыки"
          />
        </div>
      )}
    </div>
  );
};
