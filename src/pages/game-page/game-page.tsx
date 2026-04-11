// pages/game-page/game-page.tsx
import { GameField } from "@components/game-field/game-field";
import { Score } from "@components/score/score";
import { Moves } from "@components/moves/moves";
import { Goals } from "@components/goals/goals";
import { Bonuses } from "@components/bonuses/bonuses";
import { LevelTransition } from "@components/level-transition/level-transition/level-transition";
import { useGameLogic } from "@hooks/use-game-logic";
import { Window } from "@components/window/window";
import { LEVELS, LAST_LEVEL } from "consts";
import { useEffect, useState } from "react";
import { TUTORIALS } from "@components/tutorial/tutorial-data";
import { Tutorial } from "@components/tutorial/tutorial";
import { ShuffleWarning } from "@components/shuffle-warning/shuffle-warning";
import { Position, FigureType } from "types";
import { GoalAnimation } from "@components/goal-animation/goal-animation";
import logoKontur from "@/assets/logo/logo-kontur.png"; // ✅ импорт логотипа
import "./game-page.styles.css";

type GoalAnimation = {
  id: string;
  position: Position;
  figureType: FigureType;
  goalIndex: number;
  start?: { x: number; y: number; width: number; height: number };
  end?: { x: number; y: number; width: number; height: number };
};

export default function GamePage() {
  const [goalAnimations, setGoalAnimations] = useState<GoalAnimation[]>([]);
  const [cellPositions, setCellPositions] = useState<Record<string, { x: number; y: number; width: number; height: number; row: number; col: number }>>({});
  const [goalPositions, setGoalPositions] = useState<Record<number, { x: number; y: number; width: number; height: number }>>({});

  const onGoalCollected = (position: Position, figureType: FigureType, goalIndex: number) => {
    // Найти id фигуры в cellPositions по позиции
    const cellEntry = Object.entries(cellPositions).find(([, v]) => v.row === position.row && v.col === position.col);
    const start = cellEntry ? cellEntry[1] : undefined;
    const end = goalPositions[goalIndex];
    setGoalAnimations(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      position,
      figureType,
      goalIndex,
      start,
      end,
    }]);
  };

  const gameLogic = useGameLogic(onGoalCollected);

  const [showTutorial, setShowTutorial] = useState(false);
  const [viewedTutorials, setViewedTutorials] = useState<number[]>([]);
  const currentLevelId = gameLogic.levelState.currentLevel;

  useEffect(() => {
    if (
      !gameLogic.levelState.isLevelTransition &&
      TUTORIALS[currentLevelId] &&
      !viewedTutorials.includes(currentLevelId)
    ) {
      setShowTutorial(true);
    }
  }, [gameLogic.levelState.isLevelTransition, currentLevelId, viewedTutorials]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    setViewedTutorials((prev) => [...prev, currentLevelId]);
  };

  if (gameLogic.levelState.isLevelTransition) {
    if (gameLogic.levelState.isLevelFailed) {
      return (
        <Window
          isLastLevel={gameLogic.levelState.currentLevel === LAST_LEVEL}
          score={gameLogic.score}
          onRestart={() => {
            const fixedBonuses =
              LEVELS[gameLogic.levelState.currentLevel - 1].bonuses;
            gameLogic.handleLevelStart(
              gameLogic.levelState.currentLevel,
              fixedBonuses
            );
          }}
        />
      );
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
      {showTutorial && (
        <Tutorial
          steps={TUTORIALS[currentLevelId]}
          onComplete={handleCloseTutorial}
        />
      )}

      <ShuffleWarning
        isVisible={gameLogic.isShuffleWarning}
        onClose={gameLogic.hideShuffleWarning}
      />

      {goalAnimations.map((anim) => (
        <GoalAnimation
          key={anim.id}
          id={anim.id}
          position={anim.position}
          figureType={anim.figureType}
          goalIndex={anim.goalIndex}
          startRect={anim.start}
          endRect={anim.end}
          onComplete={(id) => setGoalAnimations(prev => prev.filter(a => a.id !== id))}
        />
      ))}

      <div className="game-main">
        <div className="game-content">
          <div className="left-panel">
            {/* ✅ Используем импортированный логотип */}
            <img src={logoKontur} alt="Logo Kontur" className="game-logo" />
            <Goals goals={gameLogic.goals} onGoalPositionsChange={setGoalPositions} />
          </div>

          <div className="game-field-section">
            <div className="game-info">
              <Score score={gameLogic.score} />
              <div
                className="level-name"
                data-text={gameLogic.currentLevel?.name}
              >
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
              onCellPositionsChange={setCellPositions}
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
