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
      <button className="select-button" onClick={onSelect}>
        Выбрать
      </button>
    </div>
  );
};

export default ChoiceCard;
