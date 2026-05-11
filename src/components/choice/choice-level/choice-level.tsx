import { Congr } from '../choice-congr/choice-congr';
import { ChoiceCard } from '../choice-card/choice-card';
import './choice-level.css';

type ChoiceLevelProps = {
  onChoiceConfirm: (level: number) => void; 
}

export function ChoiceLevel({ onChoiceConfirm }: ChoiceLevelProps) {
  return (
    <div className="main-wrapper">
      <Congr />
      <div className="cards-container">
        <ChoiceCard 
          title="Руководитель группы"
          description="Твоя задача: организовать работу команды консультантов и поддерживать их по сложным вопросам, чтобы клиенты получали качественную помощь." 
          onSelect={() => onChoiceConfirm(5)}
        />
        <ChoiceCard 
          title="Эксперт"
          description="Эксперт — мастер поддержки. Если ты хочешь очень глубоко разбираться в продукте и помогать по сложным вопросам — этот путь для тебя." 
          onSelect={() => onChoiceConfirm(4)}
        />
      </div>
    </div>
  );
}
