import { Figure, Position, SpecialCell } from "types";
import { FIGURE_PATHS } from "consts";
import "./cell.styles.css";
import { isTeamImage } from "@utils/game-utils";

type CellProps = {
  figure: Figure | null;
  position: Position;
  isSelected: boolean;
  isModernProductsSource: boolean;
  isMatched: boolean;
  isBlocked: boolean;
  specialCell?: SpecialCell;
  onClick: (position: Position) => void;
  onDragStart: (position: Position) => void;
  onDragOver: (position: Position) => void;
};

export const Cell = ({
  figure,
  position,
  isSelected,
  isModernProductsSource,
  isMatched,
  isBlocked,
  specialCell,
  onClick,
  onDragStart,
  onDragOver,
}: CellProps) => {
  const handleClick = () => {
    if (isBlocked) return;
    onClick(position);
  };

  const handleMouseDown = () => {
    if (isBlocked) return;
    onDragStart(position);
  };

  const handleMouseEnter = () => {
    if (isBlocked) return;
    onDragOver(position);
  };

  const isStar = figure === "star";

  return (
    <div
      className={`
        cell 
        ${isSelected ? "cell--selected" : ""}
        ${isModernProductsSource ? "cell--modern-source" : ""}
        ${isMatched && !isStar ? "cell--matched" : ""} 
        ${!figure ? "cell--empty" : ""} 
        ${specialCell ? `cell--${specialCell.type}` : ""} 
        ${isStar ? "cell--star" : ""}
        ${isBlocked ? "cell--blocked" : ""}
      `}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      style={{ pointerEvents: isBlocked ? 'none' : 'auto' }}
    >
      <div className="cell-content">
        {figure && (
          <img
            src={FIGURE_PATHS[figure]}
            alt={figure}
            className={`
              figure 
              ${isStar ? "figure--star" : ""} 
              ${isTeamBigFigure ? "figure--big" : ""}
              ${isTeamImage(figure) ? "figure--big--image" : ""}
            `}
            draggable="false"
          />
        )}
      </div>
    </div>
  );
};