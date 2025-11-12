import { Figure, FIGURES } from "types";

export const getRandomFigure = (): Figure => {
  return FIGURES[Math.floor(Math.random() * FIGURES.length)];
};
