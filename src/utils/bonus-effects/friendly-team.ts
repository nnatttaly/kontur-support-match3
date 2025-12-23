import { Board } from "types";
import { shuffleBoardWithoutMatches } from "@utils/board-utils";
import { LEVELS } from "consts"

export const applyFriendlyTeamEffect = (board: Board): Board => {
  return shuffleBoardWithoutMatches(board, LEVELS[0]);
};
