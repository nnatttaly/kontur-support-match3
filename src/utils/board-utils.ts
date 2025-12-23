import { Board, Figure, Level } from "types";
import { BOARD_ROWS, BOARD_COLS } from "consts";
import { findAllMatches } from "@utils/game-logic";

// Список особых фигур, которые не должны перемешиваться
const SPECIAL_FIGURES: Figure[] = [
  "goldenCell",
  "star",
  "diamond",
  "teamCell",
  "teamImage0",
  "teamImage1",
  "teamImage2",
  "teamImage3",
  "team",
] as const;

export const shuffleBoardWithoutMatches = (
  originalBoard: Board,
  level?: Level
): Board => {
  const allFigures: Figure[] = [];
  const availableFigures = level?.availableFigures || [
    "roundMessage",
    "letter",
    "smartphone",
    "star",
    "phone",
  ];

  // Собираем только те фигуры, которые доступны для уровня и НЕ являются особыми
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const figure = originalBoard[row][col];
      if (
        figure &&
        availableFigures.includes(figure) &&
        !SPECIAL_FIGURES.includes(figure)
      ) {
        allFigures.push(figure);
      }
    }
  }

  const shuffledFigures = [...allFigures];
  
  // Перемешиваем только обычные фигуры
  for (let i = shuffledFigures.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledFigures[i], shuffledFigures[j]] = [
      shuffledFigures[j],
      shuffledFigures[i],
    ];
  }

  const maxAttempts = 50;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const newBoard: Board = originalBoard.map((row) => [...row]);
    let figureIndex = 0;

    // Заполняем доску: особые фигуры остаются на месте, обычные - перемешиваются
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const originalFigure = originalBoard[row][col];
        
        if (originalFigure) {
          if (SPECIAL_FIGURES.includes(originalFigure)) {
            // Оставляем особую фигуру на месте
            newBoard[row][col] = originalFigure;
          } else if (
            availableFigures.includes(originalFigure) &&
            figureIndex < shuffledFigures.length
          ) {
            // Заменяем обычную фигуру на перемешанную
            newBoard[row][col] = shuffledFigures[figureIndex];
            figureIndex++;
          }
          // Если фигура не в availableFigures, она остается как есть
        }
      }
    }

    const matches = findAllMatches(newBoard);
    if (matches.length === 0) {
      return newBoard;
    }

    attempts++;

    // Перемешиваем снова для следующей попытки
    for (let i = shuffledFigures.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledFigures[i], shuffledFigures[j]] = [
        shuffledFigures[j],
        shuffledFigures[i],
      ];
    }
  }

  return originalBoard;
};