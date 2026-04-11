
import React from "react";
import { Goal } from "types";
import { GoalItem } from "@components/goal-item/goal-item";
import "./goals.styles.css";

type GoalsProps = {
  goals: Goal[];
  onGoalPositionsChange?: (positions: Record<number, { x: number; y: number; width: number; height: number }>) => void;
};

export const Goals = ({ goals, onGoalPositionsChange }: GoalsProps) => {
  const itemRefs = React.useRef<Record<number, HTMLDivElement | null>>({});

  React.useLayoutEffect(() => {
    if (!onGoalPositionsChange) return;
    const positions: Record<number, { x: number; y: number; width: number; height: number }> = {};
    Object.entries(itemRefs.current).forEach(([idx, el]) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        positions[Number(idx)] = {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        };
      }
    });
    onGoalPositionsChange(positions);
  }, [goals, onGoalPositionsChange]);

  return (
    <div className="goals-container">
      <div className="goals-content">
        <h3 className="goals-title">Цели:</h3>
        <div className="goals-list">
          {goals.map((goal, index) => (
            <GoalItem
              key={index}
              goal={goal}
              innerRef={(el) => {
                itemRefs.current[index] = el;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
