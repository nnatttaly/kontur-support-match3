import { Goal } from "types";
import { GoalItem } from "@components/goal-item/goal-item";
import "./goals.styles.css";

type GoalsProps = {
  goals: Goal[];
};

export const Goals = ({ goals }: GoalsProps) => {
  return (
    <div className="goals-container">
      <div className="goals-content">
        <h3 className="goals-title">Цели:</h3>
        <div className="goals-list">
          {goals.map((goal, index) => (
            <GoalItem key={index} goal={goal} />
          ))}
        </div>
      </div>
    </div>
  );
};
