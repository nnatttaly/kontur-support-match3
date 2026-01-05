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
          description="Эксперт — мастер поддержки, который способен справиться с любой задачей. Если ты хочешь глубже погружаться в продукты и быть тем самым человеком, к которому идут, когда “никто больше не смог” — этот путь для тебя." 
          onSelect={() => onChoiceConfirm(4)}
        />
        <ChoiceCard 
          title="Тимлид"
          description="Тимлид — тот, кто организовывает работу группы консультантов, помогает им работать лучше и поддерживает по сложным вопросам от клиентов. Здесь не нужно самому общаться с клиентами.  Если тебе близко быть лидером, взаимодействовать и развивать других — выбирай этот путь." 
          onSelect={() => onChoiceConfirm(5)}
        />
      </div>
    </div>
  );
}

export default ChoiceLevel;