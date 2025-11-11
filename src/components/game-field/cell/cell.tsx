import { Figure, Position } from "types";
import { FIGURE_PATHS } from "consts";
import "./cell.styles.css";

type CellProps = {
  figure: Figure | null;
  position: Position;
  isSelected: boolean;
  isMatched: boolean;
  onClick: (position: Position) => void;
  onDragStart: (position: Position) => void;
  onDragOver: (position: Position) => void;
};

export const Cell = ({
  figure,
  position,
  isSelected,
  isMatched,
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

  return (
    <div
      className={`
        cell 
        ${isSelected ? "cell--selected" : ""}
        ${isMatched ? "cell--matched" : ""}
        ${!figure ? "cell--empty" : ""}
      `}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
    >
      {figure && (
        <img
          src={FIGURE_PATHS[figure]}
          alt={figure}
          className="figure"
          draggable="false"
        />
      )}
    </div>
  );
};
