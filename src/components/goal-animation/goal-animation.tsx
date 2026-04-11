import { motion } from "framer-motion";
import { FIGURE_PATHS } from "consts";
import { FigureType, Position } from "types";
import "./goal-animation.styles.css";

type GoalAnimationProps = {
  id: string;
  position: Position;
  figureType: FigureType;
  goalIndex: number;
  startRect?: { x: number; y: number; width: number; height: number };
  endRect?: { x: number; y: number; width: number; height: number };
  onComplete: (id: string) => void;
};

export const GoalAnimation = ({ id, position, figureType, goalIndex, startRect, endRect, onComplete }: GoalAnimationProps) => {
  const offsetX = -10;
  const offsetY = -10;
  let startX = 0, startY = 0, goalX = 0, goalY = 0;
  if (startRect) {
    startX = startRect.x + startRect.width / 2 + offsetX;
    startY = startRect.y + startRect.height / 2 + offsetY;
  }
  if (endRect) {
    goalX = endRect.x + endRect.width / 2 + offsetX;
    goalY = endRect.y + endRect.height / 2 + offsetY;
  }
  // Если нет координат — fallback к row/col
  if (!startRect) {
    const cellSize = 60;
    startX = position.col * cellSize + cellSize / 2 + offsetX;
    startY = position.row * cellSize + cellSize / 2 + offsetY;
  }
  if (!endRect) {
    const goalItemHeight = 50;
    goalY = 100 + goalIndex * goalItemHeight + goalItemHeight / 2 + offsetY;
    goalX = 200 + offsetX;
  }

  const isFallingFigure = figureType === "star" || figureType === "diamond";
  const dropDistance = startRect ? Math.max(40, startRect.height * 0.8) : 40;
  const fallY = startY + dropDistance;
  const midX = (startX + goalX) / 2;
  const midY = Math.min(fallY, goalY) - 100;

  const xPath = isFallingFigure ? [startX, startX, midX, goalX] : [startX, midX, goalX];
  const yPath = isFallingFigure ? [startY, fallY, midY, goalY] : [startY, midY, goalY];

  return (
    <motion.div
      className="goal-animation"
      initial={{ x: startX, y: startY, scale: 1, opacity: 1 }}
      animate={{
        x: xPath,
        y: yPath,
        scale: [1, 1.2, 0.8],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 1.5,
        ease: [0.25, 0.46, 0.45, 0.94],
        opacity: { delay: 1, duration: 0.5 },
      }}
      onAnimationComplete={() => onComplete(id)}
    >
      <img src={FIGURE_PATHS[figureType]} alt={figureType} className="goal-animation-figure" />
    </motion.div>
  );
};