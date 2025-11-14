import { GameField } from "@components/game-field/game-field";
import { Score } from "@components/score/score";
import { Moves } from "@components/moves/moves";
import { Goals } from "@components/goals/goals";
import { Bonuses } from "@components/bonuses/bonuses";
import { LevelTransition } from "@components/level-transition/level-transition";
import { useGameLogic } from "@hooks/use-game-logic";
import "./game-page.styles.css";

export default function GamePage() {
  const gameLogic = useGameLogic();

  // Если переход между уровнями
  if (gameLogic.levelState.isLevelTransition) {
    return (
      <LevelTransition
        currentLevel={gameLogic.levelState.currentLevel}
        nextLevel={gameLogic.levelState.currentLevel + 1}
        onLevelStart={gameLogic.handleLevelStart}
      />
    );
  }

  // Основной игровой экран
  return (
    <div className="page">
      <div className="game-main">
        <div className="game-info">
          <Score score={gameLogic.score} />
          <Moves moves={gameLogic.moves} />
        </div>
        <div className="game-content">
          <Goals goals={gameLogic.goals} />
          <div className="game-field-section">
            <GameField
              board={gameLogic.board}
              selectedPosition={gameLogic.selectedPosition}
              matches={gameLogic.matches}
              onCellClick={gameLogic.handleCellClick}
              onDragStart={gameLogic.handleDragStart}
              onDragOver={gameLogic.handleDragOver}
            />
            <Bonuses
              bonuses={gameLogic.bonuses}
              activeBonus={gameLogic.activeBonus}
              onUseBonus={gameLogic.useBonus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
