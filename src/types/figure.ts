export const FIGURES = {
  pencil: "pencil",
  questionBook: "questionBook",
  openBook: "openBook",
  briefcase: "briefcase",
  bonnet: "bonnet",
  roundMessage: "roundMessage",
  rectangleMessage: "rectangleMessage",
  letter: "letter",
  phone: "phone",
  microphone: "microphone",
  goldenCell: "goldenCell",
  star: "star",
  diamond: "diamond",
  teamCell: "teamCell",
  teamImage0: "teamImage0",
  teamImage1: "teamImage1",
  teamImage2: "teamImage2",
  teamImage3: "teamImage3",
  team: "team",
  question: "question",
  heart: "heart",
  handshake: "handshake",
  kpi: "kpi",
  bulb: "bulb",
} as const;

export type FigureType = typeof FIGURES[keyof typeof FIGURES];

export type Figure = {
  id: string;
  type: FigureType;
};

const createFigureId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `figure-${Math.random().toString(36).slice(2)}-${Date.now()}`;
};

export const createFigure = (type: FigureType, id?: string): Figure => ({
  id: id ?? createFigureId(),
  type,
});

export const isFigureType = (value: unknown): value is FigureType =>
  typeof value === "string" &&
  (Object.values(FIGURES) as FigureType[]).includes(value as FigureType);