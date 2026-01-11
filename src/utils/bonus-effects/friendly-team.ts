import { Board, Level } from "types";
import { shuffleBoardWithoutMatches } from "@utils/board-utils";
import { LEVELS } from "consts"

export const applyFriendlyTeamEffect = (board: Board, currentLevel?: Level): Board => {
  const levelToUse = currentLevel || LEVELS[0];
  return shuffleBoardWithoutMatches(board, levelToUse);
};