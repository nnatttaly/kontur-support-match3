import { Cell } from "@components/game-field/cell/cell";
import { Board, Position, Match } from "types";
import "./game-field.styles.css";

type GameFieldProps = {
  board: Board;
  selectedPosition: Position | null;
  matches: Match[];
  onCellClick: (position: Position) => void;
  onDragStart: (position: Position) => void;
  onDragOver: (position: Position) => void;
};

export const GameField = ({
  board,
  selectedPosition,
  matches,
  onCellClick,
  onDragStart,
  onDragOver,
}: GameFieldProps) => {
  const isPartOfMatch = (row: number, col: number): boolean => {
    return matches.some((match) =>
      match.positions.some((pos) => pos.row === row && pos.col === col)
    );
  };

  return (
    <div className="field">
      {board.map((row, rowIndex) =>
        row.map((figure, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            figure={figure}
            position={{ row: rowIndex, col: colIndex }}
            isSelected={
              selectedPosition?.row === rowIndex &&
              selectedPosition?.col === colIndex
            }
            isMatched={isPartOfMatch(rowIndex, colIndex)}
            onClick={onCellClick}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
          />
        ))
      )}
    </div>
  );
};
