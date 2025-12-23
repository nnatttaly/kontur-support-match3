import { Goal, Match, GameModifiers } from "types";

/**
 * Обновляет цели на основе найденных матчей
 */
export const updateGoalsWithModifiers = (
  goals: Goal[],
  matches: Match[],
  modifiers: GameModifiers,
  board: any
): Goal[] => {
  const updatedGoals = goals.map(goal => ({ ...goal }));
  
  // Создаем карту подсчета фигур
  const figureCountMap = new Map<string, number>();
  
  // Подсчитываем все фигуры в матчах
  matches.forEach(match => {
    match.positions.forEach(pos => {
      const figure = board[pos.row][pos.col];
      if (figure && figure !== "teamCell" && figure !== "goldenCell") {
        const currentCount = figureCountMap.get(figure) || 0;
        figureCountMap.set(figure, currentCount + 1);
      }
    });
  });
  
  // Обновляем цели
  updatedGoals.forEach(goal => {
    const count = figureCountMap.get(goal.figure);
    if (count !== undefined) {
      const increment = modifiers.doubleGoalProgress ? count * 2 : count;
      goal.collected = Math.min(goal.collected + increment, goal.target);
    }
  });
  
  return updatedGoals;
};

export const calculateRoundScore = (
  matches: Match[],
  modifiers: GameModifiers
): number => {
  let score = 0;
  
  matches.forEach(match => {
    // Базовые очки: 10 за каждую фигуру в матче
    score += match.positions.length * 10;
    
    // Бонус за длинные матчи
    if (match.positions.length >= 5) {
      score += 50;
    } else if (match.positions.length >= 4) {
      score += 20;
    }
  });
  
  if (modifiers.doublePoints) {
    score *= 2;
  }
  
  return score;
};