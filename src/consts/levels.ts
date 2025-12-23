import { Level } from "types";

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Новичок",
    description: "Начни свой путь в IT!",
    goals: [
      { figure: "pencil", target: 3, collected: 0 },
      { figure: "bonnet", target: 3, collected: 0 },
      { figure: "briefcase", target: 3, collected: 0 },
    ],
    bonuses: ["knowledgeBase", "friendlyTeam", "careerGrowth"], // ["knowledgeBase", "friendlyTeam", "careerGrowth"]
    moves: 21,
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
    description: "Ты освоил основы!",
    goals: [
      {
        figure: "goldenCell",
        target: 9,
        collected: 0,
      },
    ],
    // ["careerGrowth", "knowledgeBase", "sportCompensation"]
    // ["openGuide", "remoteWork", "itSphere"]
    // ["modernProducts", "friendlyTeam", "sportCompensation"]
    bonuses: ["sportCompensation", "modernProducts", "remoteWork"],
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
    description: "Растёшь над собой!",
    goals: [
      { figure: "star", target: 5, collected: 0 }, // Цель - собрать 5 звезд
    ],
    bonuses: ["remoteWork", "sportCompensation", "itSphere"],
    moves: 23,
    availableFigures: ["roundMessage", "letter", "smartphone", "rectangleMessage", "phone"],
    starPositions: [
      // Начальные позиции звезд
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
    description: "Растёшь над собой!",
    goals: [
      { figure: "diamond", target: 5, collected: 0 }, // Цель - собрать 5 звезд
      {
        figure: "goldenCell",
        target: 10,
        collected: 0,
      }
    ],
    bonuses: ["remoteWork", "dms", "itSphere"],
    moves: 23,
    availableFigures: ["roundMessage", "letter", "bulb", "rectangleMessage", "phone"],
    diamondPositions: [
      // Начальные позиции звезд
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
    description: "Растёшь над собой!",
    goals: [
      {
        figure: "teamCell",
        target: 14,
        collected: 0,
      }
    ],
    bonuses: ["itSphere", "openGuide", "remoteWork"],
    moves: 23,
    availableFigures: ["question", "heart", "handshake", "kpi", "bulb"],
    teamPositions: [
      /*
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 1, col: 4 },
      { row: 1, col: 5 },

      { row: 4, col: 1 },
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
      { row: 4, col: 5 },

      { row: 2, col: 1 },
      { row: 3, col: 1 },
      { row: 2, col: 5 },
      { row: 3, col: 5 },
      */

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
];

export const LEVEL_NAMES: Record<number, string> = {
  1: "Новичок",
  2: "Консультант",
  3: "Специалист",
  4: "Эксперт",
  5: "Тимлид",
};
