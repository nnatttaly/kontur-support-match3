import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [viewBox, setViewBox] = useState(`0 0 ${window.innerWidth} ${window.innerHeight}`);
  
  const step = steps[currentStep];

  // Проверка, является ли устройство iOS
  const isIOS = useMemo(() => {
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete, steps.length]);

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

  useEffect(() => {
    const updateCoords = () => {
      if (step.highlightSelector) {
        const elements = document.querySelectorAll(step.highlightSelector);
        
        // На iOS берем смещение визуального вьюпорта
        const offsetX = window.visualViewport?.offsetLeft || 0;
        const offsetY = window.visualViewport?.offsetTop || 0;

        if (elements.length > 0) {
          const newCoords: ElementRect[] = Array.from(elements).map(el => {
            const rect = el.getBoundingClientRect();
            
            // Если это айфон, применяем корректировку
            // Если зона съезжает вниз и вправо, нам нужно ВЫЧЕСТЬ смещение
            const correctionX = isIOS ? -2 : 0; // Можно подправить на 1-5 пикселей
            const correctionY = isIOS ? -2 : 0; 

            return {
              x: rect.left - offsetX + correctionX,
              y: rect.top - offsetY + correctionY,
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

    // На iOS вычисления лучше делать после микрозадержки
    const timer = setTimeout(() => {
      requestAnimationFrame(updateCoords);
    }, 30);
    
    return () => clearTimeout(timer);
  }, [currentStep, step.highlightSelector, isIOS]);

  useEffect(() => {
    const bonusesContainer = document.querySelector('.bonuses-container') as HTMLElement;
    if (bonusesContainer && step.highlightBonus) {
      bonusesContainer.style.zIndex = '10001';
      bonusesContainer.addEventListener('click', handleNext);
      return () => {
        bonusesContainer.removeEventListener('click', handleNext);
        bonusesContainer.style.zIndex = '';
      };
    }
  }, [currentStep, step.highlightBonus, handleNext]);

  const defaultPosition = { bottom: '10%', left: '50%', transform: 'translateX(-50%)' };
  const currentStyle = step.position || defaultPosition;

  return (
    <div className="tutorial-overlay" onClick={handleNext}>
      <svg 
        className="tutorial-svg-mask" 
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
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