import { Bonus, ActiveBonus } from "types";
import { BONUS_PATHS, BONUS_NAMES, BONUS_EFFECTS } from "consts";
import { useState, useRef, useEffect } from "react";
import "./bonus-item.styles.css";
import "./bonus-tooltip.styles.css";

type BonusItemProps = {
  bonus: Bonus;
  activeBonus: ActiveBonus | null;
  onUse: (type: Bonus["type"]) => void;
};

export const BonusItem = ({
  bonus,
  activeBonus,
  onUse,
}: BonusItemProps) => {
  const { type, count } = bonus;

  const [showTooltip, setShowTooltip] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const touchTimerRef = useRef<number | null>(null);
  const longPressRef = useRef(false);

  const isActive = activeBonus?.type === type && activeBonus.isActive;
  const canUse = count > 0 || isActive;

  useEffect(() => {
    setIsTouchDevice(
      "ontouchstart" in window || navigator.maxTouchPoints > 0
    );
  }, []);

  /* =========================
     TOUCH (MOBILE)
     ========================= */

  const handleTouchStart = () => {
    if (!canUse) return;

    longPressRef.current = false;

    touchTimerRef.current = window.setTimeout(() => {
      longPressRef.current = true;
      setShowTooltip(true);
    }, 500);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }

    // If it was a long press → block click
    if (longPressRef.current) {
      e.preventDefault();
      e.stopPropagation();

      setTimeout(() => {
        setShowTooltip(false);
        longPressRef.current = false;
      }, 150);
    }
  };

  const handleTouchMove = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  /* =========================
     MOUSE (PC)
     ========================= */

  const handleMouseEnter = () => {
    if (!canUse || isTouchDevice) return;
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    setShowTooltip(false);
  };

  /* =========================
     CLICK
     ========================= */

  const handleClick = (e: React.MouseEvent) => {
    // Block ghost click after long-press
    if (isTouchDevice && longPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (!canUse) return;

    onUse(type);
  };

  return (
    <div
      className={`
        bonus-item
        ${isActive ? "bonus-item--active" : ""}
        ${!canUse ? "bonus-item--disabled" : ""}
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchCancel={handleTouchEnd}
    >
      <div className="bonus-circle">
        <img
          src={BONUS_PATHS[type]}
          alt={type}
          className="bonus-icon"
          draggable={false}
        />
        <div className="bonus-count">{count}</div>
      </div>

      {showTooltip && canUse && (
        <div className="bonus-tooltip bonus-tooltip--top">
          <div className="bonus-tooltip-title">
            {BONUS_NAMES[type]}
          </div>
          <div className="bonus-tooltip-effect">
            {BONUS_EFFECTS[type]}
          </div>
        </div>
      )}
    </div>
  );
};