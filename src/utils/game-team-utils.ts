import { Board } from "types";
import { BOARD_ROWS, BOARD_COLS } from "consts";
import { isTeamImage } from "./game-utils";

export const progressTeamHappyOne = (board: Board): Board => {
  const newBoard = board.map((row) => [...row]);

  for (let col = 0; col < BOARD_COLS; col++) {
    for (let row = BOARD_ROWS - 1; row >= 0; row--) {
        if (isTeamImage(newBoard[row][col])) {
            newBoard[row][col] = "teamImage1";
        }
    }
  }
  return newBoard;
};

export const progressTeamHappyTwo = (board: Board): Board => {
  const newBoard = board.map((row) => [...row]);

  for (let col = 0; col < BOARD_COLS; col++) {
    for (let row = BOARD_ROWS - 1; row >= 0; row--) {
        if (isTeamImage(newBoard[row][col])) {
            newBoard[row][col] = "teamImage2";
        }
    }
  }
  return newBoard;
};

export const progressTeamHappyThree = (board: Board): Board => {
  const newBoard = board.map((row) => [...row]);

  for (let col = 0; col < BOARD_COLS; col++) {
    for (let row = BOARD_ROWS - 1; row >= 0; row--) {
        if (isTeamImage(newBoard[row][col])) {
            newBoard[row][col] = "teamImage3";
        }
    }
  }
  return newBoard;
};