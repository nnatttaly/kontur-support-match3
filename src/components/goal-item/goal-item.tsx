import React from "react";
import { Goal } from "types";
import { FIGURE_PATHS } from "consts";
import "./goal-item.styles.css";

type GoalItemProps = {
  goal: Goal;
  innerRef?: React.Ref<HTMLDivElement>;
};

export const GoalItem = ({ goal, innerRef }: GoalItemProps) => {
  const { figure, collected, target } = goal;
  const isCompleted = collected >= target;

  return (
    <div ref={innerRef} className={`goal-item ${isCompleted ? "goal-item--completed" : ""}`}>
      <img src={FIGURE_PATHS[figure]} alt={figure} className="goal-figure" />
      <div className="goal-progress">
        {collected}/{target}
      </div>
    </div>
  );
};
