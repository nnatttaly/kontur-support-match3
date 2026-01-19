import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
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

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

export const Tutorial = ({ steps, onComplete }: Props) => {
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [coordsArray, setCoordsArray] = useState<ElementRect[]>([]);
  // Храним размеры окна для viewBox
  const [viewPort, setViewPort] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  const step = steps[currentStep];

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete, steps.length]);

  const updateCoords = useCallback(() => {
    // Обновляем размеры вьюпорта для SVG
    setViewPort({ width: window.innerWidth, height: window.innerHeight });

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
  }, [step.highlightSelector]);

  // Используем useLayoutEffect для мгновенного пересчета перед отрисовкой
  useLayoutEffect(() => {
    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [updateCoords]);

  // Ваша логика с бонусами остается без изменений
  useEffect(() => {
    const bonusesContainer = document.querySelector('.bonuses-container') as HTMLElement;
    if (!bonusesContainer) return;

    if (step.highlightBonus) {
      bonusesContainer.style.zIndex = '9999999';
      bonusesContainer.addEventListener('click', handleNext);
      return () => {
        bonusesContainer.removeEventListener('click', handleNext);
        bonusesContainer.style.zIndex = '';
      };
    } else {
      bonusesContainer.style.zIndex = '';
    }
  }, [currentStep, step.highlightBonus, handleNext]);

  const defaultPosition = {
    bottom: '10%',
    left: '50%',
    transform: 'translateX(-50%)'
  };

  const currentStyle = isMobile && step.mobilePosition 
    ? step.mobilePosition 
    : (step.position || defaultPosition);

  return (
    <div className="tutorial-overlay" onClick={handleNext}>
      {/* viewBox гарантирует 1:1 соответствие пикселям JS */}
      <svg 
        className="tutorial-svg-mask" 
        viewBox={`0 0 ${viewPort.width} ${viewPort.height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <mask id="hole">
            <rect width="100%" height="100%" fill="white" />
            {coordsArray.map((coords, index) => (
              <rect 
                key={index}
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
          mask="url(#hole)" 
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
          <span className="click-hint">Кликни по экрану, чтобы продолжить</span>
        </div>
      </div>
    </div>
  );
};