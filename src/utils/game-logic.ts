import { Board, Figure, Level, Match, Position } from "types";
import { BOARD_ROWS, BOARD_COLS, MIN_MATCH_LENGTH } from "consts";
import { shuffleBoardWithoutMatches } from "@utils/board-utils";
import { isTeamImage } from "@utils/game-utils";

export { shuffleBoardWithoutMatches };

const normalizeBoard = (inputBoard: Board): Board => {
  const normalized: Board = [];

  for (let row = 0; row < BOARD_ROWS; row++) {
    const rowData = inputBoard[row] || [];
    const normalizedRow = rowData.slice(0, BOARD_COLS);

    while (normalizedRow.length < BOARD_COLS) {
      normalizedRow.push(null);
    }

    normalized.push(normalizedRow);
  }

  return normalized;
};

const SPECIAL_FIGURES: Figure[] = [
  "goldenCell",
  "star",
  "diamond",
  "teamCell",
  "teamImage0",
  "teamImage1",
  "teamImage2",
  "teamImage3",
  "team",
];

const isSpecialFigure = (figure: Figure | null): boolean => {
  if (!figure) return false;
  return SPECIAL_FIGURES.includes(figure);
};

export const createInitialBoard = (level?: Level): Board => {
  const availableFigures = level?.availableFigures || [
    "pencil",
    "questionBook",
    "openBook",
    "briefcase",
    "bonnet",
  ];

  const normalizedFigures = availableFigures.filter(
    (fig) => !isSpecialFigure(fig)
  );

  const generateBoard = (): Board => {
    const board: Board = Array.from({ length: BOARD_ROWS }, () =>
      Array.from({ length: BOARD_COLS }, () => null)
    );

    if (level?.starPositions) {
      level.starPositions.forEach((position: Position) => {
        if (position.row < BOARD_ROWS && position.col < BOARD_COLS) {
          board[position.row][position.col] = "star";
        }
      });
    }

    if (level?.diamondPositions) {
      level.diamondPositions.forEach((position: Position) => {
        if (position.row < BOARD_ROWS && position.col < BOARD_COLS) {
          board[position.row][position.col] = "diamond";
        }
      });
    }

    if (level?.teamPositions) {
      level.teamPositions.forEach((position: Position) => {
        if (position.row < BOARD_ROWS && position.col < BOARD_COLS) {
          board[position.row][position.col] = "team";
        }
      });
    }

    if (level?.teamImagePosition) {
      if (
        level.teamImagePosition.row < BOARD_ROWS &&
        level.teamImagePosition.col < BOARD_COLS
      ) {
        board[level.teamImagePosition.row][level.teamImagePosition.col] =
          "teamImage0";
      }
    }

    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        if (board[row][col] !== null) continue;

        let chosen: Figure | null = null;
        const candidates = [...normalizedFigures];
        let safety = 0;

        while (chosen === null && candidates.length > 0 && safety < 100) {
          safety++;
          const index = Math.floor(Math.random() * candidates.length);
          const candidate = candidates[index];

          const horizontalMatch =
            col >= 2 &&
            board[row][col - 1] === candidate &&
            board[row][col - 2] === candidate;

          const verticalMatch =
            row >= 2 &&
            board[row - 1][col] === candidate &&
            board[row - 2][col] === candidate;

          if (!horizontalMatch && !verticalMatch) {
            chosen = candidate;
            break;
          }

          candidates.splice(index, 1);
        }

        board[row][col] =
          chosen ||
          normalizedFigures[Math.floor(Math.random() * normalizedFigures.length)];
      }
    }

    return board;
  };

  let newBoard = generateBoard();

  let matches = findAllMatches(newBoard);
  if (matches.length > 0) {
    for (let attempt = 0; attempt < 30 && matches.length > 0; attempt++) {
      newBoard = generateBoard();
      matches = findAllMatches(newBoard);
    }
  }

  if (findAllMatches(newBoard).length > 0) {
    newBoard = shuffleBoardWithoutMatches(newBoard, level);
  }

  if (findAllMatches(newBoard).length > 0) {
    return createInitialBoard(level);
  }

  return normalizeBoard(newBoard);
};

export const applyGravityFillLoop = (inputBoard: Board, level?: Level): Board => {
  let board = normalizeBoard(inputBoard);
  let iterations = 0;
  const maxIterations = 50;

  while (
    board.some((row) => row.some((cell) => cell === null)) &&
    iterations < maxIterations
  ) {
    board = applyGravity(board);
    board = fillEmptySlots(board, level);
    iterations++;
  }

  return normalizeBoard(board);
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
      const figure = safeBoard[row][col];

      if (
        !figure ||
        figure === "star" ||
        figure === "diamond" ||
        figure === "team" ||
        isTeamImage(figure)
      ) {
        col++;
        continue;
      }

      let matchLength = 1;
      while (
        col + matchLength < BOARD_COLS &&
        safeBoard[row][col + matchLength] === figure
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
      const figure = safeBoard[row][col];

      if (
        !figure ||
        figure === "star" ||
        figure === "diamond" ||
        figure === "team" ||
        isTeamImage(figure)
      ) {
        row++;
        continue;
      }

      let matchLength = 1;
      while (
        row + matchLength < BOARD_ROWS &&
        safeBoard[row + matchLength][col] === figure
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

export const updateBoardAfterMatches = (board: Board): Board => {
  const newBoard = normalizeBoard(board).map((row) => [...row]);
  const matches = findAllMatches(newBoard);

  matches.forEach((match) => {
    match.positions.forEach(({ row, col }) => {
      const figure = newBoard[row][col];
      if (figure !== "teamCell") {
        newBoard[row][col] = null;
      }
    });
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
        current !== "team" &&
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

export const fillEmptySlots = (board: Board, level?: Level): Board => {
  const newBoard = normalizeBoard(board);

  const availableFigures = level?.availableFigures || [
    "pencil",
    "questionBook",
    "openBook",
    "briefcase",
    "bonnet",
  ];

  const figuresWithoutStarsAndDiamondsAndTeam = availableFigures.filter(
    (fig) => fig !== "star" && fig !== "diamond" && fig !== "team" && !isTeamImage(fig)
  );

  for (let col = 0; col < BOARD_COLS; col++) {
    if (newBoard[0][col] === null) {
      const randomFigure =
        figuresWithoutStarsAndDiamondsAndTeam[
          Math.floor(Math.random() * figuresWithoutStarsAndDiamondsAndTeam.length)
        ];
      newBoard[0][col] = randomFigure;
    }
  }

  return normalizeBoard(newBoard);
};

// ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ: горизонтальная гравитация с предотвращением конфликтов
// Только уровень 5, только 2 нижних ряда, 1 клетка за вызов
export const applyHorizontalGravity = (
  board: Board
): { board: Board; isChanged: boolean } => {
  const newBoard: Board = normalizeBoard(board).map((row) => [...row]);
  let isChanged = false;

  // ⚙️ Настройки: только уровень 5, только 2 нижних ряда
  const TARGET_LEFT = 2;      // Левая целевая колонка
  const TARGET_RIGHT = 3;     // Правая целевая колонка
  const ROWS_TO_PROCESS = [BOARD_ROWS - 1, BOARD_ROWS - 2]; // Только 2 нижних ряда

  for (const rowIndex of ROWS_TO_PROCESS) {
    if (rowIndex < 0 || rowIndex >= BOARD_ROWS) continue;

    // Работаем с копией строки для безопасного чтения/записи
    const row = [...newBoard[rowIndex]];

    // 🛡️ Отслеживаем ячейки, участвующие в перемещениях (и источник, и цель)
    // Это предотвращает конфликты: две фигуры не попадут в одну клетку
    const cellsInvolved = new Set<number>();

    // === ФАЗА 1: Сбор всех валидных потенциальных перемещений ===
    type Move = { from: number; to: number; figure: Figure };
    const moves: Move[] = [];

    // ➡️ ПРАВАЯ СТОРОНА: фигуры двигаются ВЛЕВО к TARGET_RIGHT
    // Обрабатываем слева направо для консистентности
    for (let col = TARGET_RIGHT + 1; col < BOARD_COLS-1; col++) {
      const cell = row[col];
      
      // Пропускаем пустые и нефизические фигуры
      if (!cell || cell === "teamCell" || cell === "team" || isTeamImage(cell)) continue;
      
      const targetCol = col - 1;
      
      // Можно двигать, если:
      // 1. Целевая ячейка пуста
      // 2. Ни исходная, ни целевая ячейка не задействованы в другом перемещении
      if (
        !row[targetCol] && 
        !cellsInvolved.has(col) && 
        !cellsInvolved.has(targetCol)
      ) {
        moves.push({ from: col, to: targetCol, figure: cell });
      }
    }

    // ⬅️ ЛЕВАЯ СТОРОНА: фигуры двигаются ВПРАВО к TARGET_LEFT
    // Обрабатываем справа налево для консистентности
    for (let col = TARGET_LEFT - 1; col >= 1; col--) {
      const cell = row[col];
      
      if (!cell || cell === "teamCell" || cell === "team" || isTeamImage(cell)) continue;
      
      const targetCol = col + 1;
      
      if (
        !row[targetCol] && 
        !cellsInvolved.has(col) && 
        !cellsInvolved.has(targetCol)
      ) {
        moves.push({ from: col, to: targetCol, figure: cell });
      }
    }

    // === ФАЗА 2: Выполнение перемещений с финальной проверкой конфликтов ===
    for (const move of moves) {
      // Финальная проверка: условия могли измениться после предыдущих перемещений
      if (cellsInvolved.has(move.from) || cellsInvolved.has(move.to)) continue;
      if (row[move.to] !== null) continue;

      // ✅ Выполняем перемещение: фигура сдвигается ровно на 1 клетку
      row[move.to] = move.figure;
      row[move.from] = null;
      
      // Помечаем ячейки как задействованные
      cellsInvolved.add(move.from);
      cellsInvolved.add(move.to);
      isChanged = true;
      
      // 🔁 Не делаем break — разрешаем параллельные неконфликтующие перемещения
      // (как в applyGravity: несколько фигур могут падать одновременно)
    }

    newBoard[rowIndex] = row;
  }

  return { board: normalizeBoard(newBoard), isChanged };
};

export const hasPossibleMoves = (board: Board): boolean => {
  const safeBoard = normalizeBoard(board);
  const rows = safeBoard.length;
  const cols = safeBoard[0].length;

  const UNMOVABLE_FIGURES: Figure[] = [
    "team",
    "teamImage0",
    "teamImage1",
    "teamImage2",
    "teamImage3",
  ];

  const canSwapFigure = (figure: Figure | null): boolean => {
    if (!figure) return false;
    if (UNMOVABLE_FIGURES.includes(figure)) return false;
    return true;
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const currentFigure = safeBoard[row][col];
      if (!canSwapFigure(currentFigure)) continue;

      if (col < cols - 1) {
        const rightFigure = safeBoard[row][col + 1];
        if (canSwapFigure(rightFigure)) {
          if (currentFigure === "star" && rightFigure === "star") continue;
          if (currentFigure === "diamond" && rightFigure === "diamond") continue;

          const tempBoard = safeBoard.map((r) => [...r]);
          tempBoard[row][col] = rightFigure;
          tempBoard[row][col + 1] = currentFigure;

          if (findAllMatches(tempBoard).length > 0) {
            return true;
          }
        }
      }

      if (row < rows - 1) {
        const bottomFigure = safeBoard[row + 1][col];
        if (canSwapFigure(bottomFigure)) {
          if (currentFigure === "star" && bottomFigure === "star") continue;
          if (currentFigure === "diamond" && bottomFigure === "diamond") continue;

          const tempBoard = safeBoard.map((r) => [...r]);
          tempBoard[row][col] = bottomFigure;
          tempBoard[row + 1][col] = currentFigure;

          if (findAllMatches(tempBoard).length > 0) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

export const isValidPosition = (position: Position): boolean => {
  return (
    position.row >= 0 &&
    position.row < BOARD_ROWS &&
    position.col >= 0 &&
    position.col < BOARD_COLS
  );
};

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