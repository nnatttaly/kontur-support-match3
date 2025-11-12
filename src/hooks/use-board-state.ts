import { useState } from "react";
import { Board } from "types";
import { createInitialBoard } from "@utils/game-logic";

export const useBoardState = () => {
  const [board, setBoard] = useState<Board>(createInitialBoard());

  return {
    board,
    setBoard,
  };
};
