import { Figure, FIGURES } from "types";

export const getRandomFigure = (availableFigures?: Figure[]): Figure => {
  const figures = availableFigures || FIGURES;
  return figures[Math.floor(Math.random() * figures.length)];
};

export const getPointsWord = (score: number): string => {
  const lastDigit = score % 10;
  const lastTwoDigits = score % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'очков';
  }
  
  if (lastDigit === 1) return 'очко';
  if (lastDigit >= 2 && lastDigit <= 4) return 'очка';
  return 'очков';
};