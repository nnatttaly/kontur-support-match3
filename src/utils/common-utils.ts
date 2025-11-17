import { Figure, FIGURES } from "types";

export const getRandomFigure = (availableFigures?: Figure[]): Figure => {
  const figures = availableFigures || FIGURES;
  return figures[Math.floor(Math.random() * figures.length)];
};
