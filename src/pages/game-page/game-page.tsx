import { GameField } from "@components/game-field/game-field";
import { Score } from "@components/score/score";
import { Moves } from "@components/moves/moves";
import { Goals } from "@components/goals/goals";
import { Bonuses } from "@components/bonuses/bonuses";
import { LevelTransition } from "@components/level-transition/level-transition/level-transition";
import { useGameLogic } from "@hooks/use-game-logic";
import { Window } from "@components/window/window";
import {
  LEVELS,
  LAST_LEVEL,
  SOUND_PATHS,
  MUSIC_LOOP_START,
  MUSIC_LOOP_END,
} from "consts";
import { useEffect, useState, useRef } from "react";
import { TUTORIALS } from "@components/tutorial/tutorial-data";
import { Tutorial } from "@components/tutorial/tutorial";
import { ShuffleWarning } from "@components/shuffle-warning/shuffle-warning";
import { Position, FigureType } from "types";
import { GoalAnimation as GoalAnimationComponent } from "@components/goal-animation/goal-animation";
import logoKontur from "@/assets/logo/logo-kontur.png";
import soundOffIcon from "@/assets/icons/sound-off.svg";
import soundMediumIcon from "@/assets/icons/sound-medium.svg";
import soundLoudIcon from "@/assets/icons/sound-loud.svg";
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
  const [volume, setVolume] = useState(50);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicStartedRef = useRef(false);
  const soundControlRef = useRef<HTMLDivElement | null>(null);

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

  const gameLogic = useGameLogic(onGoalCollected);
  const currentLevelId = gameLogic.levelState.currentLevel;

  const volumeIcon =
    volume === 0 ? soundOffIcon : volume < 60 ? soundMediumIcon : soundLoudIcon;

  useEffect(() => {
    const audio = new Audio(SOUND_PATHS.background);
    audioRef.current = audio;
    audio.volume = volume / 100;

    const playMusic = async () => {
      try {
        audio.volume = volume / 100;
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
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!showVolumeSlider) return;

      const target = event.target as Node;
      if (soundControlRef.current && !soundControlRef.current.contains(target)) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showVolumeSlider]);

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
          volume={volume}
          onVolumeChange={setVolume}
        />
      );
    }

    return (
      <LevelTransition
        currentLevel={gameLogic.levelState.currentLevel}
        onLevelStart={gameLogic.handleLevelStart}
        promotionLink="https://kontur.ru/lp/support?utm_ad=%7Bad_id%7D&p=1210&utm_medium=cpc&utm_source=YandexDirect&utm_campaign=vacancy-hr_brand_rsya&utm_content=uks_stranitsa_sayta%7Cad%7C%7Bad_id%7D%7Cgid%7C%7Bgbid%7D%7Ccid%7C%7Bcampaign_id%7D%7Ccpn%7C%7Bcampaign_name_lat%7D%7Csrc%7C%7Bsource_type%7D%7Cdev%7C%7Bdevice_type%7D%7Crgn%7C%7Bregion_name%7D%7Cmtp%7C%7Bmatch_type%7D%7Ctid%7C%7Bphrase_id%7D_%7Bretargeting_id%7D%7Cref%7C%7Bsource%7D&utm_term=%7BSupport_game%7D"
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

      <ShuffleWarning
        isVisible={gameLogic.isShuffleWarning}
        onClose={gameLogic.hideShuffleWarning}
      />

      {goalAnimations.map((anim) => (
        <GoalAnimationComponent
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
            <img src={logoKontur} alt="Logo Kontur" className="game-logo" />
            <Goals goals={gameLogic.goals} onGoalPositionsChange={setGoalPositions} />
          </div>

          <div className="game-field-section">
            <div className="game-info">
              <Score score={gameLogic.score} />
              <div className="level-name" data-text={gameLogic.currentLevel?.name}>
                {gameLogic.currentLevel?.name}
              </div>
              <Moves moves={gameLogic.moves} />

              <div className="sound-control" ref={soundControlRef}>
                <button
                  type="button"
                  className="sound-toggle"
                  onClick={() => setShowVolumeSlider((prev) => !prev)}
                  aria-label={showVolumeSlider ? "Скрыть громкость" : "Показать громкость"}
                  aria-expanded={showVolumeSlider}
                >
                  <img src={volumeIcon} alt="" className="sound-icon" />
                </button>

                {showVolumeSlider && (
                  <div className="sound-panel">
                    <input
                      className="sound-slider"
                      type="range"
                      min={0}
                      max={100}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      aria-label="Громкость музыки"
                    />
                  </div>
                )}
              </div>
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