import { Cell } from "@components/game-field/cell/cell";
import { Board, Position, Match, SpecialCell } from "types";
import { isBigFigure } from "@utils/game-utils";
import "./game-field.styles.css";

type GameFieldProps = {
  board: Board;
  selectedPosition: Position | null;
  modernProductsSourcePos: Position | null;
  activeBonusType?: string;
  matches: Match[];
  specialCells: SpecialCell[];
  onCellClick: (position: Position) => void;
  onDragStart: (position: Position) => void;
  onDragOver: (position: Position) => void;
};

export const GameField = ({
  board,
  selectedPosition,
  modernProductsSourcePos,
  activeBonusType,
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

  // Функция для определения, заблокирована ли клетка большой иконкой
  const isCellBlocked = (row: number, col: number): boolean => {
    // Проверяем все соседние клетки на наличие большой иконки

    const figure = board[row][col];

    if (figure && isBigFigure(figure)) {
      return true;
    }

    return false;
  };

  return (
    <div className="field">
      {board.map((row, rowIndex) =>
        row.map((figure, colIndex) => {
          const specialCell = getSpecialCell(rowIndex, colIndex);
          const isSelected =
            selectedPosition?.row === rowIndex &&
            selectedPosition?.col === colIndex;
          
          const isModernProductsSource =
            activeBonusType === "modernProducts" &&
            modernProductsSourcePos?.row === rowIndex &&
            modernProductsSourcePos?.col === colIndex;
          
          const isBlocked = isCellBlocked(rowIndex, colIndex);
          const isMatched = isPartOfMatch(rowIndex, colIndex);

          return (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              figure={figure}
              position={{ row: rowIndex, col: colIndex }}
              isSelected={isSelected}
              isModernProductsSource={isModernProductsSource}
              isMatched={isMatched}
              isBlocked={isBlocked}
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