import { useEffect, useState, useRef } from "react";
import { useGameLogic } from "@hooks/use-game-logic";
import {
  GameField,
  Score,
  Moves,
  Goals,
  Bonuses,
  LevelTransition,
  Window,
  Tutorial,
  ShuffleWarning,
  GoalAnimation,
  SoundControl
} from "../../components";
import { GameToast } from "../../components/game-toast/game-toast";
import {
  LEVELS,
  LAST_LEVEL,
  SOUND_PATHS,
  MUSIC_LOOP_START,
  MUSIC_LOOP_END,
  TUTORIALS,
  BOMB_TUTORIAL,
  KONTUR_SUPPORT_LINK,
} from "consts";
import { Position, FigureType } from "types";
import logoKontur from "@/assets/logo/logo-kontur.png";
import "./game-page.styles.css";

type GoalAnimationItem = {
  id: string;
  position: Position;
  figureType: FigureType;
  goalIndex: number;
  start?: { x: number; y: number; width: number; height: number };
  end?: { x: number; y: number; width: number; height: number };
};

export default function GamePage() {
  const [goalAnimations, setGoalAnimations] = useState<GoalAnimationItem[]>([]);
  const [cellPositions, setCellPositions] = useState<
    Record<
      string,
      { x: number; y: number; width: number; height: number; row: number; col: number }
    >
  >({});
  const [goalPositions, setGoalPositions] = useState<
    Record<number, { x: number; y: number; width: number; height: number }>
  >({});
  const [showTutorial, setShowTutorial] = useState(false);
  const [viewedTutorials, setViewedTutorials] = useState<number[]>([]);
  const [showBombTutorial, setShowBombTutorial] = useState(false);
  const [bombTutorialShown, setBombTutorialShown] = useState(false);
  const [volume, setVolume] = useState(15);
  const [bonusToast, setBonusToast] = useState<{ message: string; id: number } | null>(null);
  const bonusToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bonusToastIdRef = useRef(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicStartedRef = useRef(false);

  const onBonusIncompatibleClick = (message: string) => {
    if (bonusToastTimerRef.current) clearTimeout(bonusToastTimerRef.current);
    bonusToastIdRef.current += 1;
    setBonusToast({ message, id: bonusToastIdRef.current });
    bonusToastTimerRef.current = setTimeout(() => setBonusToast(null), 2200);
  };

  const onGoalCollected = (
    position: Position,
    figureType: FigureType,
    goalIndex: number
  ) => {
    const cellEntry = Object.entries(cellPositions).find(
      ([, v]) => v.row === position.row && v.col === position.col
    );

    const start = cellEntry ? cellEntry[1] : undefined;
    const end = goalPositions[goalIndex];

    setGoalAnimations((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        position,
        figureType,
        goalIndex,
        start,
        end,
      },
    ]);
  };

  const gameLogic = useGameLogic(onGoalCollected, onBonusIncompatibleClick);
  const currentLevelId = gameLogic.levelState.currentLevel;

  useEffect(() => {
    const audio = new Audio(SOUND_PATHS.background);
    audioRef.current = audio;
    audio.volume = volume / 600;

    const playMusic = async () => {
      try {
        audio.volume = volume / 600;
        await audio.play();
        musicStartedRef.current = true;
      } catch (error) {
        console.warn("Не удалось воспроизвести фоновую музыку:", error);
      }
    };

    const handleTimeUpdate = () => {
      if (audio.currentTime >= MUSIC_LOOP_END) {
        audio.currentTime = MUSIC_LOOP_START;
      }
    };

    const handleEnded = () => {
      audio.currentTime = MUSIC_LOOP_START;
      audio.play().catch(() => {});
    };

    const handleFirstClick = () => {
      if (!musicStartedRef.current) {
        playMusic();
        document.removeEventListener("click", handleFirstClick);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    document.addEventListener("click", handleFirstClick);

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      document.removeEventListener("click", handleFirstClick);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 600;
    }
  }, [volume]);

  useEffect(() => {
    if (
      !gameLogic.levelState.isLevelTransition &&
      TUTORIALS[currentLevelId] &&
      !viewedTutorials.includes(currentLevelId)
    ) {
      setShowTutorial(true);
    }
  }, [gameLogic.levelState.isLevelTransition, currentLevelId, viewedTutorials]);

  // Показываем туториал про бомбу когда она впервые появляется на поле
  useEffect(() => {
    if (bombTutorialShown || showBombTutorial || gameLogic.levelState.isLevelTransition) return;
    const hasBomb = gameLogic.board.some((row) => row.some((cell) => cell?.type === "bomb"));
    if (hasBomb) setShowBombTutorial(true);
  }, [gameLogic.board, bombTutorialShown, showBombTutorial, gameLogic.levelState.isLevelTransition]);

  // Очищаем анимации засчитывания при переходе на новый уровень
  useEffect(() => {
    if (gameLogic.levelState.isLevelTransition) {
      setGoalAnimations([]);
    }
  }, [gameLogic.levelState.isLevelTransition]);

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
          volume={volume}
          onVolumeChange={setVolume}
        />
      );
    }

    return (
      <LevelTransition
        currentLevel={gameLogic.levelState.currentLevel}
        onLevelStart={gameLogic.handleLevelStart}
        promotionLink={KONTUR_SUPPORT_LINK}
        volume={volume}
        onVolumeChange={setVolume}
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

      {showBombTutorial && !gameLogic.isAnimating && (
        <Tutorial
          steps={BOMB_TUTORIAL}
          onComplete={() => {
            setShowBombTutorial(false);
            setBombTutorialShown(true);
          }}
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
          onComplete={(id) =>
            setGoalAnimations((prev) => prev.filter((a) => a.id !== id))
          }
        />
      ))}

      <div className="game-main">
        <div className="game-content">
          <div className="left-panel">
            <div className="header-row">
              <SoundControl
                volume={volume}
                onVolumeChange={setVolume}
                containerClassName="gp-sound-control header-sound-control"
              />
              <img src={logoKontur} alt="Logo Kontur" className="game-logo" />
            </div>
            <Goals goals={gameLogic.goals} onGoalPositionsChange={setGoalPositions} />
          </div>

          <div className="game-field-section">
            <div className="game-info">
              <Score score={gameLogic.score} />
              <div
                className={`level-name${currentLevelId === 5 ? " level-name--long" : ""}`}
                data-text={gameLogic.currentLevel?.name}
              >
                {gameLogic.currentLevel?.name}
              </div>
              <Moves moves={gameLogic.moves} />
              <SoundControl
                volume={volume}
                onVolumeChange={setVolume}
                containerClassName="gp-sound-control game-info-sound-control"
              />
            </div>

            <GameField
              board={gameLogic.board}
              selectedPosition={gameLogic.selectedPosition}
              modernProductsSourcePos={gameLogic.modernProductsSourcePos}
              activeBonusType={gameLogic.activeBonus?.type}
              matches={gameLogic.matches}
              specialCells={gameLogic.specialCells}
              explosionPositions={gameLogic.explosionPositions}
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
      {bonusToast && <GameToast key={bonusToast.id} message={bonusToast.message} />}
    </div>
  );
}