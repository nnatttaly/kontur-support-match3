import { Cell } from "@components/game-field/cell/cell";
import { useGameLogic } from "@hooks/use-game-logic";
import "./game-field.styles.css";

export const GameField = () => {
  const {
    board,
    selectedPosition,
    matches,
    handleCellClick,
    handleDragStart,
    handleDragOver,
  } = useGameLogic();


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
            onClick={handleCellClick}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
          />
        ))
      )}
    </div>
  );
};
