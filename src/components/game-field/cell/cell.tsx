import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Position, SpecialCell, Figure } from "types";
import { FIGURE_PATHS, ANIMATION_DURATION } from "consts";
import { isTeamImage } from "@utils/game-utils";
import "./cell.styles.css";

type CellOffset = { x: number; y: number };
type MotionAxis = "x" | "y" | "xy" | "none";

type CellProps = {
  figure: Figure | null;
  figureId: string;
  motionKey: string;
  motionAxis: MotionAxis;
  disableAnimation?: boolean;
  offset?: CellOffset;
  hasRealOffset?: boolean;
  isSwapping?: boolean;
  position: Position;
  isSelected: boolean;
  isModernProductsSource: boolean;
  isMatched: boolean;
  isBlocked: boolean;
  specialCell?: SpecialCell;
  onClick: (position: Position) => void;
  onDragStart: (position: Position) => void;
  onDragOver: (position: Position) => void;
  innerRef?: React.Ref<HTMLDivElement>;
};

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const Cell: React.FC<CellProps> = ({
  figure,
  figureId,
  motionKey,
  motionAxis,
  disableAnimation = false,
  offset = { x: 0, y: 0 },
  hasRealOffset = false,
  isSwapping = false,
  position,
  isSelected,
  isModernProductsSource,
  isMatched,
  isBlocked,
  specialCell,
  onClick,
  onDragStart,
  onDragOver,
  innerRef,
}) => {
  const [animateToOrigin, setAnimateToOrigin] = useState(false);
  const rafRef = useRef<number | null>(null);

  const shouldAnimate = !!figure && hasRealOffset && !disableAnimation;

  useIsomorphicLayoutEffect(() => {
    if (!figure || disableAnimation) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!shouldAnimate) {
      setAnimateToOrigin(false);
      return;
    }

    setAnimateToOrigin(false);

    rafRef.current = requestAnimationFrame(() => {
      setAnimateToOrigin(true);
      rafRef.current = null;
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [motionKey, shouldAnimate, offset.x, offset.y, figure, figureId, disableAnimation]);

  const handleClick = () => {
    if (isBlocked) return;
    onClick(position);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isBlocked) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    onDragStart(position);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isBlocked) return;
    if (e.pointerType === "mouse" && e.buttons === 0) return;

    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    if (!el) return;

    const cellEl = el.closest(".cell") as HTMLElement | null;
    if (!cellEl) return;

    const row = Number(cellEl.dataset.row);
    const col = Number(cellEl.dataset.col);

    if (!Number.isNaN(row) && !Number.isNaN(col)) {
      onDragOver({ row, col });
    }
  };

  const isStar = figure?.type === "star";
  const isDiamond = figure?.type === "diamond";
  const isTeamBigFigure =
    figure?.type === "team" || isTeamImage(figure?.type ?? null);

  const startTransform = (() => {
    if (disableAnimation) return "translate3d(0px, 0px, 0) scale(1)";
    if (!shouldAnimate) return "translate3d(0px, 0px, 0) scale(1)";

    if (motionAxis === "x") {
      return `translate3d(${offset.x}px, 0px, 0) scale(${isSwapping ? 1.08 : 1})`;
    }
    if (motionAxis === "y") {
      return `translate3d(0px, ${offset.y}px, 0) scale(${isSwapping ? 1.08 : 1})`;
    }
    if (motionAxis === "xy") {
      return `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${isSwapping ? 1.08 : 1})`;
    }
    return "translate3d(0px, 0px, 0) scale(1)";
  })();

  const endTransform = "translate3d(0px, 0px, 0) scale(1)";

  const transitionTimingFunction =
    motionAxis === "x"
      ? "cubic-bezier(0.16, 1, 0.3, 1)"
      : motionAxis === "y"
      ? "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      : motionAxis === "xy"
      ? "cubic-bezier(0.22, 1, 0.36, 1)"
      : "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

  return (
    <div
      ref={innerRef}
      data-row={position.row}
      data-col={position.col}
      data-figure-id={figureId}
      className={[
        "cell",
        isSelected ? "cell--selected" : "",
        isModernProductsSource ? "cell--modern-source" : "",
        isMatched && !isStar ? "cell--matched" : "",
        !figure ? "cell--empty" : "",
        specialCell ? `cell--${specialCell.type}` : "",
        isStar ? "cell--star" : "",
        isDiamond ? "cell--diamond" : "",
        isBlocked ? "cell--blocked" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      style={{ pointerEvents: isBlocked ? "none" : "auto" }}
    >
      <div className="cell-content">
        {figure && (
          <div
            key={motionKey}
            className={[
              "figure-motion",
              isSwapping ? "figure-motion--swap" : "",
              disableAnimation ? "figure-motion--disabled" : "",
              motionAxis === "x"
                ? "figure-motion--horizontal"
                : motionAxis === "y"
                ? "figure-motion--vertical"
                : motionAxis === "xy"
                ? "figure-motion--swap-axis"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              transform: disableAnimation
                ? endTransform
                : animateToOrigin
                ? endTransform
                : startTransform,
              opacity: 1,
              transition: disableAnimation
                ? "none"
                : animateToOrigin
                ? `transform ${ANIMATION_DURATION}ms ${transitionTimingFunction}`
                : "none",
            }}
          >
            <img
              src={FIGURE_PATHS[figure.type]}
              alt={figure.type}
              className={[
                "figure",
                isStar ? "figure--star" : "",
                isDiamond ? "figure--diamond" : "",
                isTeamBigFigure ? "figure--big" : "",
                isTeamImage(figure.type) ? "figure--big--image" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              draggable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};