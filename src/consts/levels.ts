import { Level } from "types";

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Новичок",
    description: "Сегодня твой первый день в команде поддержки. Твоя цель — накапливать знания по продуктам Контура, задавать вопросы наставнику и погружаться в жизнь Контура. Удачи!",
    goals: [
      { figure: "pencil", target: 3, collected: 0 },
      { figure: "bonnet", target: 3, collected: 0 },
      { figure: "briefcase", target: 3, collected: 0 },
    ],
    bonuses: [
      { type: "knowledgeBase", count: 2 },
      { type: "openGuide", count: 3 }
    ],
    moves: 1,
    availableFigures: [
      "pencil",
      "questionBook",
      "openBook",
      "briefcase",
      "bonnet",
    ],
  },
  {
    id: 2,
    name: "Консультант",
    description: "Обучение позади — начинается настоящее приключение! Клиентам нужна помощь по продуктам Контура. Ты получаешь письма, звонки, сообщения в чате. Вперёд, консультант!",
    goals: [
      {
        figure: "goldenCell",
        target: 9,
        collected: 0,
      },
    ],
    bonuses: [
      { type: "itSphere", count: 3 },
      { type: "openGuide", count: 3 }
    ],
    moves: 22,
    availableFigures: [
      "roundMessage",
      "rectangleMessage",
      "letter",
      "phone",
      "smartphone",
    ],
    specialCells: [
      { row: 2, col: 2, type: "golden", isActive: true },
      { row: 2, col: 3, type: "golden", isActive: true },
      { row: 2, col: 4, type: "golden", isActive: true },
      { row: 3, col: 2, type: "golden", isActive: true },
      { row: 3, col: 3, type: "golden", isActive: true },
      { row: 3, col: 4, type: "golden", isActive: true },
      { row: 4, col: 2, type: "golden", isActive: true },
      { row: 4, col: 3, type: "golden", isActive: true },
      { row: 4, col: 4, type: "golden", isActive: true },
    ],
  },
  {
    id: 3,
    name: "Специалист",
    description: "Ты уже знаешь, как находить решения и собирать идеальные комбинации. Пора переходить на роль специалиста поддержки. Покажи своё мастерство!",
    goals: [
      { figure: "star", target: 5, collected: 0 },
    ],
    bonuses: [
      { type: "remoteWork", count: 3 },
      { type: "openGuide", count: 3 }
    ],
    moves: 23,
    availableFigures: ["roundMessage", "letter", "smartphone", "rectangleMessage", "phone"],
    starPositions: [
      { row: 3, col: 1 },
      { row: 0, col: 2 },
      { row: 3, col: 3 },
      { row: 0, col: 4 },
      { row: 3, col: 5 },
    ],
  },
  {
    id: 4,
    name: "Эксперт",
    description: "Эксперт — тот самый человек, к которому идут, когда «никто больше не смог». Самые сложные задачи дрожат, когда слышат твое имя.",
    goals: [
      { figure: "diamond", target: 5, collected: 0 },
      {
        figure: "goldenCell",
        target: 10,
        collected: 0,
      }
    ],
    bonuses: [
      { type: "remoteWork", count: 2 },
      { type: "openGuide", count: 3 }
    ],
    moves: 23,
    availableFigures: ["roundMessage", "letter", "bulb", "rectangleMessage", "phone"],
    diamondPositions: [
      { row: 0, col: 1 },
      { row: 1, col: 2 },
      { row: 0, col: 3 },
      { row: 1, col: 4 },
      { row: 0, col: 5 },
    ],
    specialCells: [
      { row: 3, col: 0, type: "golden", isActive: true },
      { row: 2, col: 1, type: "golden", isActive: true },
      { row: 4, col: 1, type: "golden", isActive: true },
      { row: 3, col: 2, type: "golden", isActive: true },
      { row: 2, col: 3, type: "golden", isActive: true },
      { row: 4, col: 3, type: "golden", isActive: true },
      { row: 3, col: 4, type: "golden", isActive: true },
      { row: 2, col: 5, type: "golden", isActive: true },
      { row: 4, col: 5, type: "golden", isActive: true },
      { row: 3, col: 6, type: "golden", isActive: true },
    ],
  },
  {
    id: 5,
    name: "Тимлид",
    description: "Тимлиду не нужно самому общаться с клиентами. Его задача помогать им работать лучше и поддерживать по сложным вопросам от клиентов.",
    goals: [
      {
        figure: "teamCell",
        target: 14,
        collected: 0,
      }
    ],
    bonuses: [
      { type: "itSphere", count: 2 },
      { type: "openGuide", count: 3 }
    ],
    moves: 23,
    availableFigures: ["question", "heart", "handshake", "kpi", "bulb"],
    teamPositions: [
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
    ],
    teamImagePosition : { row: 3, col: 4 },
    specialCells: [
      { row: 1, col: 2, type: "team", isActive: true },
      { row: 1, col: 3, type: "team", isActive: true },
      { row: 1, col: 4, type: "team", isActive: true },
      { row: 4, col: 2, type: "team", isActive: true },
      { row: 4, col: 3, type: "team", isActive: true },
      { row: 4, col: 4, type: "team", isActive: true },
      { row: 2, col: 1, type: "team", isActive: true },
      { row: 3, col: 1, type: "team", isActive: true },
      { row: 2, col: 5, type: "team", isActive: true },
      { row: 3, col: 5, type: "team", isActive: true },
    ],
  },
  {
    id: 6,
    name: "Профессионал",
    description: "Собирай фигуры по три в ряд и получай как можно больше очков! Достигай целей, чтобы получить случайные бонусы, и продолжай улучшать свой результат.",
    goals: [
      { figure: "roundMessage", target: 8, collected: 0 },
      { figure: "letter", target: 8, collected: 0 },
      { figure: "smartphone", target: 8, collected: 0 },
    ],
    bonuses: [], // Бонусы будут выбираться случайно с разным количеством
    moves: 5,
    availableFigures: [
      "roundMessage",
      "rectangleMessage",
      "letter",
      "phone",
      "smartphone",
    ],
  },
];