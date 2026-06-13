import { Board, Figure, FigureType, Match, Position } from "types";
import { BOARD_ROWS, BOARD_COLS, MIN_MATCH_LENGTH } from "consts";

const normalizeBoard = (inputBoard: Board): Board => {
  return Array.from({ length: BOARD_ROWS }, (_, row) => {
    const rowData = inputBoard[row] || [];
    const normalized = rowData.slice(0, BOARD_COLS);
    while (normalized.length < BOARD_COLS) normalized.push(null);
    return normalized;
  });
};

const getFigureType = (figure: Figure | FigureType | null | undefined): FigureType | null => {
  if (!figure) return null;
  return typeof figure === "string" ? figure : figure.type;
};

export const isTeamImage = (figure: Figure | FigureType | null): boolean => {
  const type = getFigureType(figure);
  return (
    type === "teamImage0" ||
    type === "teamImage1" ||
    type === "teamImage2" ||
    type === "teamImage3"
  );
};

export const isBigFigure = (figure: Figure | null): boolean => {
  if (!figure) return false;
  return figure.type === "team" || isTeamImage(figure.type);
};

export const isSpecialFigure = (figure: Figure | FigureType | null): boolean => {
  const type = getFigureType(figure);
  if (!type) return false;
  return (
    type === "team" ||
    type === "teamCell" ||
    type === "goldenCell" ||
    type === "diamond" ||
    type === "star" ||
    type === "bomb" ||
    isTeamImage(type)
  );
};

export const willCreateMatch = (
  board: Board,
  pos1: Position,
  pos2: Position
): boolean => {
  const safeBoard = normalizeBoard(board);

  if (!safeBoard[pos1.row]?.[pos1.col] || !safeBoard[pos2.row]?.[pos2.col]) {
    return false;
  }

  const testBoard = safeBoard.map((row) => [...row]);
  const temp = testBoard[pos1.row][pos1.col];
  testBoard[pos1.row][pos1.col] = testBoard[pos2.row][pos2.col];
  testBoard[pos2.row][pos2.col] = temp;

  return findAllMatches(testBoard).length > 0;
};

export const findAllMatches = (board: Board): Match[] => {
  const safeBoard = normalizeBoard(board);
  const matches: Match[] = [];

  for (let row = 0; row < BOARD_ROWS; row++) {
    let col = 0;

    while (col < BOARD_COLS - 2) {
      const figure = safeBoard[row][col]?.type ?? null;

      if (
        !figure ||
        figure === "star" ||
        figure === "diamond" ||
        figure === "team" ||
        figure === "bomb" ||
        isTeamImage(figure)
      ) {
        col++;
        continue;
      }

      let matchLength = 1;
      while (
        col + matchLength < BOARD_COLS &&
        safeBoard[row][col + matchLength]?.type === figure
      ) {
        matchLength++;
      }

      if (matchLength >= MIN_MATCH_LENGTH) {
        const positions: Position[] = [];
        for (let i = 0; i < matchLength; i++) {
          positions.push({ row, col: col + i });
        }
        matches.push({ positions, figure });
        col += matchLength;
      } else {
        col++;
      }
    }
  }

  for (let col = 0; col < BOARD_COLS; col++) {
    let row = 0;

    while (row < BOARD_ROWS - 2) {
      const figure = safeBoard[row][col]?.type ?? null;

      if (
        !figure ||
        figure === "star" ||
        figure === "diamond" ||
        figure === "team" ||
        figure === "bomb" ||
        isTeamImage(figure)
      ) {
        row++;
        continue;
      }

      let matchLength = 1;
      while (
        row + matchLength < BOARD_ROWS &&
        safeBoard[row + matchLength][col]?.type === figure
      ) {
        matchLength++;
      }

      if (matchLength >= MIN_MATCH_LENGTH) {
        const positions: Position[] = [];
        for (let i = 0; i < matchLength; i++) {
          positions.push({ row: row + i, col });
        }
        matches.push({ positions, figure });
        row += matchLength;
      } else {
        row++;
      }
    }
  }

  return matches;
};

// Group matches that share at least one position into clusters.
// A cluster with >= 4 total unique positions creates one bomb.
const groupOverlappingMatches = (matches: Match[]): Match[][] => {
  const groups: Match[][] = [];

  for (const match of matches) {
    const matchKeys = new Set(match.positions.map((p) => `${p.row},${p.col}`));

    const overlapping: number[] = [];
    groups.forEach((group, idx) => {
      const hasOverlap = group.some((m) =>
        m.positions.some((p) => matchKeys.has(`${p.row},${p.col}`))
      );
      if (hasOverlap) overlapping.push(idx);
    });

    if (overlapping.length === 0) {
      groups.push([match]);
    } else {
      const merged: Match[] = [match];
      [...overlapping].reverse().forEach((idx) => {
        merged.push(...groups[idx]);
        groups.splice(idx, 1);
      });
      groups.push(merged);
    }
  }

  return groups;
};

const bombPositionForGroup = (
  group: Match[],
  uniqueKeys: Set<string>,
  movedToPosition?: Position
): Position | null => {
  if (movedToPosition) {
    const movedKey = `${movedToPosition.row},${movedToPosition.col}`;
    if (uniqueKeys.has(movedKey)) return movedToPosition;
  }

  // Prefer intersection (position in multiple matches)
  const counts = new Map<string, number>();
  group.forEach((m) =>
    m.positions.forEach((p) => {
      const k = `${p.row},${p.col}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    })
  );
  const intersectionKey = [...counts.entries()].find(([, n]) => n > 1)?.[0];
  if (intersectionKey) {
    const [r, c] = intersectionKey.split(",").map(Number);
    return { row: r, col: c };
  }

  // Fallback: center of longest match
  const longest = group.reduce((a, b) =>
    a.positions.length >= b.positions.length ? a : b
  );
  return longest.positions[Math.floor(longest.positions.length / 2)];
};

export const updateBoardAfterMatches = (
  board: Board,
  movedToPosition?: Position
): Board => {
  const newBoard = normalizeBoard(board).map((row) => [...row]);
  const matches = findAllMatches(newBoard);

  if (matches.length === 0) return normalizeBoard(newBoard);

  const matchGroups = groupOverlappingMatches(matches);

  const bombPlacements: Array<{ row: number; col: number; id: string }> = [];
  let movedPosUsed = false;

  matchGroups.forEach((group) => {
    const uniqueKeys = new Set<string>(
      group.flatMap((m) => m.positions.map((p) => `${p.row},${p.col}`))
    );

    if (uniqueKeys.size < 4) return;

    const bombPos = bombPositionForGroup(
      group,
      uniqueKeys,
      movedPosUsed ? undefined : movedToPosition
    );

    if (!bombPos) return;

    if (
      movedToPosition &&
      !movedPosUsed &&
      bombPos.row === movedToPosition.row &&
      bombPos.col === movedToPosition.col
    ) {
      movedPosUsed = true;
    }

    bombPlacements.push({
      row: bombPos.row,
      col: bombPos.col,
      id: `bomb-${bombPos.row}-${bombPos.col}-${Math.random().toString(36).slice(2, 9)}`,
    });
  });

  // Clear all matched positions
  matches.forEach((match) => {
    match.positions.forEach(({ row, col }) => {
      const figure = newBoard[row][col];
      if (figure?.type !== "teamCell") {
        newBoard[row][col] = null;
      }
    });
  });

  // Place bombs last so they overwrite cleared positions
  bombPlacements.forEach(({ row, col, id }) => {
    newBoard[row][col] = { id, type: "bomb" };
  });

  return normalizeBoard(newBoard);
};

export const applyGravity = (board: Board): Board => {
  const newBoard = normalizeBoard(board).map((row) => [...row]);

  for (let col = 0; col < BOARD_COLS; col++) {
    for (let row = BOARD_ROWS - 2; row >= 0; row--) {
      const current = newBoard[row][col];
      const below = newBoard[row + 1][col];

      if (
        current !== null &&
        current.type !== "team" &&
        !isTeamImage(current) &&
        below === null
      ) {
        newBoard[row + 1][col] = current;
        newBoard[row][col] = null;
      }
    }
  }

  return normalizeBoard(newBoard);
};

export const isValidPosition = (position: Position): boolean =>
  position.row >= 0 &&
  position.row < BOARD_ROWS &&
  position.col >= 0 &&
  position.col < BOARD_COLS;

export const getUniquePositions = (matches: Match[]): Position[] => {
  const uniquePositions = new Set<string>();
  const positions: Position[] = [];

  matches.forEach((match) => {
    match.positions.forEach((position) => {
      const key = `${position.row}-${position.col}`;
      if (!uniquePositions.has(key)) {
        uniquePositions.add(key);
        positions.push(position);
      }
    });
  });

  return positions;
};