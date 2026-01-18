import { Button } from '@components/button/button';
import './choice-card.css';

interface ChoiceCardProps {
  title: string;
  description: string;
  onSelect: () => void;
}

function ChoiceCard ({ title, description, onSelect } : ChoiceCardProps)  {
  return (
    <div className="choice-card">
      <h2 className="card-title">{title}</h2>
      <p className="card-description">{description}</p>
      <Button text='Выбрать' onClick={onSelect} />
    </div>
  );
};

export default ChoiceCard;
