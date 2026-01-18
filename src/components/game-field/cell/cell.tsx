import React from "react";
import { Figure, Position, SpecialCell } from "types";
import { FIGURE_PATHS } from "consts";
import "./cell.styles.css";
import { isTeamImage } from "@utils/game-utils";

type CellProps = {
  figure: Figure | null;
  position: Position;
  isSelected: boolean;
  isModernProductsSource: boolean;
  isMatched: boolean;
  isBlocked: boolean;
  specialCell?: SpecialCell;
  onClick: (position: Position) => void;
  onDragStart: (position: Position) => void;
  onDragOver: (position: Position) => void;
};

export const Cell: React.FC<CellProps> = ({
  figure,
  position,
  isSelected,
  isModernProductsSource,
  isMatched,
  isBlocked,
  specialCell,
  onClick,
  onDragStart,
  onDragOver,
}) => {
  const handleClick = () => {
    if (isBlocked) return;
    onClick(position);
  };

  /* =====================
     DESKTOP (MOUSE)
     ===================== */
  const handleMouseDown = () => {
    if (isBlocked) return;
    onDragStart(position);
  };

  const handleMouseEnter = () => {
    if (isBlocked) return;
    onDragOver(position);
  };

  /* =====================
     MOBILE / POINTER
     ===================== */
  const handlePointerDown = () => {
    if (isBlocked) return;
    onDragStart(position);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isBlocked) return;
    if (e.pointerType === "mouse") return; // mouse handled separately

    const el = document.elementFromPoint(
      e.clientX,
      e.clientY
    ) as HTMLElement | null;

    if (!el) return;

    const cellEl = el.closest(".cell") as HTMLElement | null;
    if (!cellEl) return;

    const row = Number(cellEl.dataset.row);
    const col = Number(cellEl.dataset.col);

    if (!Number.isNaN(row) && !Number.isNaN(col)) {
      onDragOver({ row, col });
    }
  };

  /* =====================
     TOUCH (fallback)
     ===================== */
  const handleTouchStart = () => {
    if (isBlocked) return;
    onDragStart(position);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isBlocked) return;

    const t = e.touches[0];
    if (!t) return;

    const el = document.elementFromPoint(
      t.clientX,
      t.clientY
    ) as HTMLElement | null;

    if (!el) return;

    const cellEl = el.closest(".cell") as HTMLElement | null;
    if (!cellEl) return;

    const row = Number(cellEl.dataset.row);
    const col = Number(cellEl.dataset.col);

    if (!Number.isNaN(row) && !Number.isNaN(col)) {
      onDragOver({ row, col });
    }
  };

  const isStar = figure === "star";
  const isDiamond = figure === "diamond";
  const isTeamBigFigure = figure && (figure === "team" || isTeamImage(figure));

  return (
    <div
      data-row={position.row}
      data-col={position.col}
      className={`
        cell 
        ${isSelected ? "cell--selected" : ""}
        ${isModernProductsSource ? "cell--modern-source" : ""}
        ${isMatched && !isStar ? "cell--matched" : ""} 
        ${!figure ? "cell--empty" : ""} 
        ${specialCell ? `cell--${specialCell.type}` : ""} 
        ${isStar ? "cell--star" : ""}
        ${isBlocked ? "cell--blocked" : ""}
      `}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{ pointerEvents: isBlocked ? "none" : "auto" }}
    >
      <div className="cell-content">
        {figure && (
          <img
            src={FIGURE_PATHS[figure]}
            alt={figure}
            className={`
              figure 
              ${isStar ? "figure--star" : ""} 
              ${isDiamond ? "figure--diamond" : ""}
              ${isTeamBigFigure ? "figure--big" : ""}
              ${isTeamImage(figure) ? "figure--big--image" : ""}
            `}
            draggable={false}
          />
        )}
      </div>
    </div>
  );
};
