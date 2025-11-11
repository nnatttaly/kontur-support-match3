import { MOVES_ICON_PATH } from "consts";
import "./moves.styles.css";

type MovesProps = {
  moves: number;
};

export const Moves = ({ moves }: MovesProps) => {
  return (
    <div className="moves-container">
      <div className="moves">
        <img src={MOVES_ICON_PATH} alt="Moves" className="moves-icon" />
        <span className="moves-value">{moves}</span>
      </div>
    </div>
  );
};
