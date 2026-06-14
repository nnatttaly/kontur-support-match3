import { EndTransition } from '../end-transition/end-transition';
import { FailTransition } from '../fail-transition/fail-transition';
import { SoundControl } from '@components/sound-control/sound-control';
import './window.css'

type WindowProps = {
  isLastLevel: boolean;
  score: number;
  onRestart: () => void;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
};

export const Window = ({
  isLastLevel,
  score,
  onRestart,
  volume = 50,
  onVolumeChange,
}: WindowProps) => {
  return (
    <div className="lt-overlay">
      <div className="lt-center-wrapper">
        <div className="lt-modal">
          {!isLastLevel
            ? <FailTransition onRestart={onRestart} />
            : <EndTransition score={score} onRestart={onRestart} />}
        </div>
        <SoundControl
          volume={volume}
          onVolumeChange={onVolumeChange ?? (() => {})}
          containerClassName="lt-sound-control"
        />
      </div>
    </div>
  );
};
