import { EndTransition } from './end-transition/end-transition';
import { FailTransition } from './fail-transition/fail-transition'

type WindowProps = {
  isLastLevel: boolean;
  score: number;
  onRestart: () => void;
};

export const Window = ({
  isLastLevel,
  score,
  onRestart,
}: WindowProps) => {

  return (
    <div className="lt-overlay">
      <div className="lt-modal">
        {!isLastLevel ? <FailTransition onRestart={onRestart} /> : <EndTransition score={score} onRestart={onRestart} />}
      </div>
    </div>
  );
};