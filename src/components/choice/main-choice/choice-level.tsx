import Congr from '../choice-congr/choice-congr';
import ChoiceCard from '../choice-card/choice-card';
import './choice-level.css';

type ChoiceLevelProps = {
  onChoiceConfirm: (level: number) => void; 
}

function ChoiceLevel({ onChoiceConfirm }: ChoiceLevelProps) {

  return (
    <div className="main-wrapper">
      <Congr />
      <div className="cards-container">
        <ChoiceCard 
          title="Эксперт"
          description="Эксперт — тот самый человек, к которому идут, когда «никто больше не смог». Самые сложные задачи дрожат, когда слышат твое имя." 
          onSelect={() => onChoiceConfirm(4)}
        />
        <ChoiceCard 
          title="Тимлид"
          description="Тимлиду не нужно самому общаться с клиентами. Его задача помогать им работать лучше и поддерживать по сложным вопросам от клиентов." 
          onSelect={() => onChoiceConfirm(5)}
        />
      </div>
    </div>
  );
}

export default ChoiceLevel;