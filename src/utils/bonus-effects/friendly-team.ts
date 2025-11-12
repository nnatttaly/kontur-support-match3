import { Board } from "types";
import { shuffleBoardWithoutMatches } from "@utils/board-utils";

export const applyFriendlyTeamEffect = (board: Board): Board => {
  return shuffleBoardWithoutMatches(board);
};
