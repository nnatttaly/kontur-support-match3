import { EndTransition } from './end-transition/end-transition';
import { FailTransition } from './fail-transition/fail-transition';
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
      <div className="lt-modal">
        {!isLastLevel ? <FailTransition onRestart={onRestart} volume={volume} onVolumeChange={onVolumeChange} /> : <EndTransition score={score} onRestart={onRestart} volume={volume} onVolumeChange={onVolumeChange} />}
      </div>
    </div>
  );
};