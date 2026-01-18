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
  index 
}: BonusItemProps) => {
  const { type, count } = bonus;
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const touchTimerRef = useRef<number | null>(null);
  const tooltipPosition = index === 0 ? 'left' : 'right';
  
  const isActive = activeBonus?.type === type && activeBonus.isActive;
  const canUse = count > 0 || isActive;
  
  useEffect(() => {
    // Определяем, является ли устройство сенсорным
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);
    
    return () => {
      window.removeEventListener('resize', checkTouchDevice);
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }
    };
  }, []);
  
  const handleTouchStart = () => {
    if (!canUse) return;
    
    // Устанавливаем таймер для показа подсказки через 500мс (долгое нажатие)
    touchTimerRef.current = window.setTimeout(() => {
      setShowTooltip(true);
    }, 500);
  };
  
  const handleTouchEnd = () => {
    // Очищаем таймер при отпускании
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
    
    // Скрываем подсказку с небольшой задержкой для плавности
    if (showTooltip) {
      window.setTimeout(() => setShowTooltip(false), 100);
    }
  };
  
  const handleTouchMove = () => {
    // При движении пальца отменяем показ подсказки
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };
  
  const handleMouseEnter = () => {
    if (!canUse || isTouchDevice) return;
    setShowTooltip(true);
  };
  
  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    setShowTooltip(false);
  };
  
  const handleClick = () => {
    // Предотвращаем срабатывание клика при долгом нажатии (когда показана подсказка)
    if (showTooltip) {
      setShowTooltip(false);
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
      onTouchCancel={handleTouchEnd} // На случай отмены жеста
    >
      <div className="bonus-circle">
        <img src={BONUS_PATHS[type]} alt={type} className="bonus-icon" />
        <div className="bonus-count">{count}</div>
      </div>
      
      {showTooltip && canUse && (
        <div className={`bonus-tooltip bonus-tooltip--${tooltipPosition}`}>
          <div className="bonus-tooltip-title">{BONUS_NAMES[type]}</div>
          <div className="bonus-tooltip-effect">{BONUS_EFFECTS[type]}</div>
        </div>
      )}
    </div>
  );
};