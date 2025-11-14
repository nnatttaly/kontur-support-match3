import { Goal } from "./goal";

export type Level = {
  id: number;
  name: string;
  description: string;
  goals: Goal[];
  moves: number;
  requiredScore: number;
};
