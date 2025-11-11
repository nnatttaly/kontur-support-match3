import { Goal } from "types";
import { FIGURE_PATHS } from "consts";
import "./goal-item.styles.css";

type GoalItemProps = {
  goal: Goal;
};

export const GoalItem = ({ goal }: GoalItemProps) => {
  const { figure, collected, target } = goal;

  return (
    <div className="goal-item">
      <img src={FIGURE_PATHS[figure]} alt={figure} className="goal-figure" />
      <div className="goal-progress">
        {collected}/{target}
      </div>
    </div>
  );
};
