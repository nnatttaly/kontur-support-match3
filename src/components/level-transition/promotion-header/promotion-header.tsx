import "./promotion-header.styles.css";

type PromotionHeaderProps = {
  nextLevelName: string;
  levelDescription: string;
  isFirstLevel?: boolean;
  isLevelFailed?: boolean; // Новый пропс
};

export const PromotionHeader = ({
  nextLevelName,
  levelDescription,
  isFirstLevel = false,
  isLevelFailed = false
}: PromotionHeaderProps) => {
  return (
    <div className="ph-container">
      <div className="ph-promotion">
        {!isFirstLevel && !isLevelFailed && <h2>Повышение!</h2>}
        {!isFirstLevel && !isLevelFailed ? ( 
          <h1>Теперь ты <span className="highlight">{nextLevelName}</span></h1>
        ) : (
          <h1 className="highlight">{nextLevelName}</h1>
        )}
        {isLevelFailed && (
          <p className="retry-message">Попробуй ещё раз! Выбери бонусы и продолжай.</p>
        )}
        <p>{levelDescription}</p>
      </div>
    </div>
  );
};