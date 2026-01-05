import "./promotion-header.styles.css";

type PromotionHeaderProps = {
  nextLevelName: string;
  levelDescription: string;
  isFirstLevel?: boolean;
};

export const PromotionHeader = ({
  nextLevelName,
  levelDescription,
  isFirstLevel = false
}: PromotionHeaderProps) => {
  return (
    <div className="ph-container">
      <div className="ph-promotion">
        {!isFirstLevel && <h2>Повышение!</h2>}
        {!isFirstLevel ? ( 
            <h1>Теперь ты <span className="highlight">{nextLevelName}</span></h1>
        ) : (
            <h1 className="highlight">{nextLevelName}</h1>
        )}
        <p>{levelDescription}</p>
      </div>
    </div>
  );
};
