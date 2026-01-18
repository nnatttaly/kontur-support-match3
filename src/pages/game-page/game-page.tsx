import { GameField } from "@components/game-field/game-field";
import { Score } from "@components/score/score";
import { Moves } from "@components/moves/moves";
import { Goals } from "@components/goals/goals";
import { Bonuses } from "@components/bonuses/bonuses";
import { LevelTransition } from "@components/level-transition/level-transition/level-transition";
import { useGameLogic } from "@hooks/use-game-logic";
import "./game-page.styles.css";
import { Window } from "@components/window/window";
import { LEVELS, LAST_LEVEL } from "consts";

export default function GamePage() {
  const gameLogic = useGameLogic();

  if (gameLogic.levelState.isLevelTransition) {
    if (gameLogic.levelState.isLevelFailed) {
      return (
        <Window
          isLastLevel={gameLogic.levelState.currentLevel === LAST_LEVEL}
          score={gameLogic.score}
          onRestart={() => {
            const fixedBonuses = LEVELS[gameLogic.levelState.currentLevel - 1].bonuses;
            gameLogic.handleLevelStart(gameLogic.levelState.currentLevel, fixedBonuses);
          }}
          
        />
      )
    }
    return (
      <LevelTransition
        currentLevel={gameLogic.levelState.currentLevel}
        onLevelStart={gameLogic.handleLevelStart}
      />
    );
  }

  return (
    <div className="page">
      <div className="game-main">

        <div className="game-content">
          <div className="left-panel">
            <img src="src/assets/logo/logo-kontur.png" alt="Logo Kontur" className="game-logo" />
            <Goals goals={gameLogic.goals} />
          </div>

          <div className="game-field-section">
            <div className="game-info">
              <Score score={gameLogic.score} />
              <div className="level-name" data-text={gameLogic.currentLevel?.name}>
                {gameLogic.currentLevel?.name}
              </div>
              <Moves moves={gameLogic.moves} />
            </div>

            <GameField
              board={gameLogic.board}
              selectedPosition={gameLogic.selectedPosition}
              modernProductsSourcePos={gameLogic.modernProductsSourcePos}
              activeBonusType={gameLogic.activeBonus?.type}
              matches={gameLogic.matches}
              specialCells={gameLogic.specialCells}
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