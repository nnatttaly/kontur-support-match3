import { Figure, Position, SpecialCell } from "types";
import { FIGURE_PATHS } from "consts";
import { CELL_SIZE, BIG_FIGURE_SIZE } from "consts";
import "./cell.styles.css";
import { isTeamImage } from "@utils/game-utils";

type CellProps = {
  figure: Figure | null;
  position: Position;
  isSelected: boolean;
  isMatched: boolean;
  specialCell?: SpecialCell;
  onClick: (position: Position) => void;
  onDragStart: (position: Position) => void;
  onDragOver: (position: Position) => void;
};

export const Cell = ({
  figure,
  position,
  isSelected,
  isMatched,
  specialCell,
  onClick,
  onDragStart,
  onDragOver,
}: CellProps) => {
  const handleClick = () => {
    onClick(position);
  };

  const handleMouseDown = () => {
    onDragStart(position);
  };

  const handleMouseEnter = () => {
    onDragOver(position);
  };

  const isStar = figure === "star";
  const offset = (BIG_FIGURE_SIZE - CELL_SIZE) / 2;

  return (
    <div
      className={`
        cell 
        ${isSelected ? "cell--selected" : ""}
        ${
          isMatched && !isStar ? "cell--matched" : ""
        }
        ${!figure ? "cell--empty" : ""}
        ${specialCell ? `cell--${specialCell.type}` : ""}
        ${isStar ? "cell--star" : ""}
      `}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
    >
      <div className="cell-content">
        {figure && (
          <img
            src={FIGURE_PATHS[figure]}
            alt={figure}
            className={`
              figure
              ${isStar ? "figure--star" : ""}
              ${figure ==="team" || isTeamImage(figure) ? "figure--big" : ""}
              ${isTeamImage(figure) ? "figure--big--image" : ""}
            `}
            draggable="false"
          />
        )}
      </div>
    </div>
  );
};
