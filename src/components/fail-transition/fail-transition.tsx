import './fail-transition.css';

type FailTransitionProps = {
  onRestart: () => void;
};

export const FailTransition = ({
  onRestart,
}: FailTransitionProps) => {


  return (
    <div className="lt-overlay">
      <div className="lt-modal">
        
        <p className="fail-message">
          {"Не вышло… но это нормально! У всех бывают неудачи — даже у самых опытных специалистов. Сделай вдох, соберись и попробуй ещё раз. Ты точно справишься!"}
        </p>

        <button
          className="lt-start-button"
          onClick={onRestart}
        >
          { 'Перепройти уровень' }
        </button>
      </div>
    </div>
  );
};

