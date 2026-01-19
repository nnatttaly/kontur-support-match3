import React, { useState, useEffect, useCallback } from 'react';
import './tutorial.css';
import { TutorialStep } from './tutorial-data';
import { DIALOG_BUBBLE_ICON_PATH, HERO_ICON_PATH } from 'consts/paths';

interface Props {
  steps: TutorialStep[];
  onComplete: () => void;
}

interface ElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const Tutorial = ({ steps, onComplete }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coordsArray, setCoordsArray] = useState<ElementRect[]>([]);
  // Храним размер окна для viewBox
  const [viewBox, setViewBox] = useState(`0 0 ${window.innerWidth} ${window.innerHeight}`);
  
  const step = steps[currentStep];

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete, steps.length]);

  // 1. Эффект блокировки скролла и отслеживания размера окна
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const handleResize = () => {
      setViewBox(`0 0 ${window.innerWidth} ${window.innerHeight}`);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 2. Эффект расчета координат
  useEffect(() => {
    const updateCoords = () => {
      if (step.highlightSelector) {
        const elements = document.querySelectorAll(step.highlightSelector);
        if (elements.length > 0) {
          const newCoords: ElementRect[] = Array.from(elements).map(el => {
            const rect = el.getBoundingClientRect();
            return {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height
            };
          });
          setCoordsArray(newCoords);
        } else {
          setCoordsArray([]);
        }
      } else {
        setCoordsArray([]);
      }
    };

    // Небольшая задержка помогает Safari корректно вычислить rect после рендера
    const timer = requestAnimationFrame(updateCoords);
    return () => cancelAnimationFrame(timer);
  }, [currentStep, step.highlightSelector]);

  // 3. Обработка бонусов
  useEffect(() => {
    const bonusesContainer = document.querySelector('.bonuses-container') as HTMLElement;
    if (!bonusesContainer) return;

    if (step.highlightBonus) {
      bonusesContainer.style.zIndex = '10001';
      bonusesContainer.addEventListener('click', handleNext);
      
      return () => {
        bonusesContainer.removeEventListener('click', handleNext);
        bonusesContainer.style.zIndex = '';
      };
    }
  }, [currentStep, step.highlightBonus, handleNext]);

  const defaultPosition = {
    bottom: '10%',
    left: '50%',
    transform: 'translateX(-50%)'
  };

  const currentStyle = step.position || defaultPosition;

  return (
    <div className="tutorial-overlay" onClick={handleNext}>
      <svg 
        className="tutorial-svg-mask" 
        viewBox={viewBox} 
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <mask id="tutorial-hole">
            <rect width="100%" height="100%" fill="white" />
            {coordsArray.map((coords, index) => (
              <rect
                key={`${currentStep}-${index}`}
                x={coords.x - 8}
                y={coords.y - 8}
                width={coords.width + 16}
                height={coords.height + 16}
                fill="black"
                rx="12"
                style={{ transition: 'all 0.3s ease' }}
              />
            ))}
          </mask>
        </defs>
        <rect 
          width="100%" 
          height="100%" 
          fill="rgba(0,0,0,0.7)" 
          mask="url(#tutorial-hole)" 
        />
      </svg>

      <div
        className={`tutorial-content ${step.characterPos}`}
        style={currentStyle as React.CSSProperties}
      >
        <div className="character-icon">
          <img src={HERO_ICON_PATH} alt="hero" />
        </div>
        
        <div className="dialog-container">
          <div className={`dialog-bubble ${step.characterPos}`}>
            <img src={DIALOG_BUBBLE_ICON_PATH} alt="dialog-bubble" />
            <p>{step.text}</p>
          </div>
          <span className="click-hint">Кликни, чтобы продолжить</span>
        </div>
      </div>
    </div>
  );
};