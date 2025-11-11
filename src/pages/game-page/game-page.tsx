import { GameField } from "@components/game-field/game-field";
import { Score } from "@components/score/score";
import { Moves } from "@components/moves/moves";
import { Goals } from "@components/goals/goals";
import { useGameLogic } from "@hooks/use-game-logic";
import "./game-page.styles.css";

export default function GamePage() {
  const gameLogic = useGameLogic();

  return (
    <div className="page">
      <div className="game-info">
        <Score score={gameLogic.score} />
        <Moves moves={gameLogic.moves} />
      </div>
      <div className="game-content">
        <Goals goals={gameLogic.goals} />
        <GameField
          board={gameLogic.board}
          selectedPosition={gameLogic.selectedPosition}
          matches={gameLogic.matches}
          onCellClick={gameLogic.handleCellClick}
          onDragStart={gameLogic.handleDragStart}
          onDragOver={gameLogic.handleDragOver}
        />
      </div>
    </div>
  );
}
