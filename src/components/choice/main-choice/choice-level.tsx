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
          title="Тимлид"
          description="Тимлид — тот, кто организовывает работу группы консультантов. Если тебе близко быть лидером, взаимодействовать и развивать других, выбирай этот путь." 
          onSelect={() => onChoiceConfirm(5)}
        />
        <ChoiceCard 
          title="Эксперт"
          description="Эксперт - мастер поддержки. Если ты хочешь очень глубоко разбираться в продукте и помогать по сложным вопросам — этот путь для тебя." 
          onSelect={() => onChoiceConfirm(4)}
        />
      </div>
    </div>
  );
}

export default ChoiceLevel;