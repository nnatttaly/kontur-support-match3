import { Bonus, ActiveBonus } from "types";
import { BONUS_PATHS, BONUS_NAMES, BONUS_EFFECTS } from "consts";
import { useState, useRef, useEffect } from "react";
import "./bonus-item.styles.css";
import "./bonus-tooltip.styles.css";

type BonusItemProps = {
  bonus: Bonus;
  activeBonus: ActiveBonus | null;
  onUse: (type: Bonus["type"]) => void;
  index: number;
};

export const BonusItem = ({
  bonus,
  activeBonus,
  onUse,
  index,
}: BonusItemProps) => {
  const { type, count } = bonus;

  const [showTooltip, setShowTooltip] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const touchTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const tooltipPosition = index === 0 ? "left" : "right";

  const isActive = activeBonus?.type === type && activeBonus.isActive;
  const canUse = count > 0 || isActive;

  useEffect(() => {
    const detectTouch = () => {
      setIsTouchDevice(
        "ontouchstart" in window || navigator.maxTouchPoints > 0
      );
    };

    detectTouch();
    window.addEventListener("resize", detectTouch);

    return () => {
      window.removeEventListener("resize", detectTouch);
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }
    };
  }, []);

  /* =========================
     TOUCH (MOBILE)
     ========================= */

  const handleTouchStart = () => {
    if (!canUse) return;

    longPressTriggeredRef.current = false;

    touchTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setShowTooltip(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }

    if (longPressTriggeredRef.current) {
      setTimeout(() => setShowTooltip(false), 150);
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

  const handleClick = () => {
    // Prevent click after long-press on mobile
    if (isTouchDevice && longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    if (canUse) {
      onUse(type);
    }
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
        <img src={BONUS_PATHS[type]} alt={type} className="bonus-icon" />
        <div className="bonus-count">{count}</div>
      </div>

      {showTooltip && canUse && (
        <div className={`bonus-tooltip bonus-tooltip--${tooltipPosition}`}>
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
