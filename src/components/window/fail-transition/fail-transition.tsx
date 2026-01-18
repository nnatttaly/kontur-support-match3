import { Button } from '@components/button/button';
import './fail-transition.css';

type FailTransitionProps = {
  onRestart: () => void;
};

export const FailTransition = ({
  onRestart,
}: FailTransitionProps) => {
  
  return (
    <div className="fail-content">
      <p className="fail-message">
        {"Не вышло… но это нормально! У всех бывают неудачи — даже у самых опытных специалистов. Сделай вдох, соберись и попробуй ещё раз. Ты точно справишься!"}
      </p>
      <Button text='Перепройти уровень' onClick={onRestart} />
    </div>
  );
};
