import { Cell } from "@components/game-field/cell/cell";
import { Board, Position, Match, SpecialCell } from "types";
import "./game-field.styles.css";

type GameFieldProps = {
  board: Board;
  selectedPosition: Position | null;
  matches: Match[];
  specialCells: SpecialCell[];
  onCellClick: (position: Position) => void;
  onDragStart: (position: Position) => void;
  onDragOver: (position: Position) => void;
};

export const GameField = ({
  board,
  selectedPosition,
  matches,
  specialCells,
  onCellClick,
  onDragStart,
  onDragOver,
}: GameFieldProps) => {
  const isPartOfMatch = (row: number, col: number): boolean => {
    return matches.some((match) =>
      match.positions.some((pos) => pos.row === row && pos.col === col)
    );
  };

  const getSpecialCell = (
    row: number,
    col: number
  ): SpecialCell | undefined => {
    return specialCells.find(
      (cell) => cell.row === row && cell.col === col && cell.isActive
    );
  };

  return (
    <div className="field">
      {board.map((row, rowIndex) =>
        row.map((figure, colIndex) => {
          const specialCell = getSpecialCell(rowIndex, colIndex);

          return (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              figure={figure}
              position={{ row: rowIndex, col: colIndex }}
              isSelected={
                selectedPosition?.row === rowIndex &&
                selectedPosition?.col === colIndex
              }
              isMatched={isPartOfMatch(rowIndex, colIndex)}
              specialCell={specialCell}
              onClick={onCellClick}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
            />
          );
        })
      )}
    </div>
  );
};
