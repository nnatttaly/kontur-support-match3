// components/tutorial/tutorial.tsx
import { useState, useEffect, useCallback } from 'react';
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

  const step = steps[currentStep];
      // Туть
  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete, steps.length]);

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

    // Вызываем сразу
    updateCoords();

    // Добавляем слушатель на ресайз (важно для iOS Safari)
    window.addEventListener('resize', updateCoords);
    // На случай, если в игре есть внутренний скролл
    window.addEventListener('scroll', updateCoords, true);

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [currentStep, step.highlightSelector]);

  useEffect(() => {
      if (step.highlightSelector) {
        // Находим ВСЕ элементы по селектору
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
    }, [currentStep, step.highlightSelector]);

  useEffect(() => {
    const bonusesContainer = document.querySelector('.bonuses-container') as HTMLElement;
    if (!bonusesContainer) return;

    if (step.highlightBonus) {
      bonusesContainer.style.zIndex = '9999999';
      // Добавляем обработчик клика на бонусы для переход к следующему шагу
      bonusesContainer.addEventListener('click', handleNext);
      
      return () => {
        bonusesContainer.removeEventListener('click', handleNext);
        bonusesContainer.style.zIndex = '';
      };
    } else {
      bonusesContainer.style.zIndex = '';
    }
  }, [currentStep, step.highlightBonus, handleNext]);

  // Дефолтные стили, если позиция не передана (по центру внизу)
  const defaultPosition = {
    bottom: '10%',
    left: '50%',
    transform: 'translateX(-50%)'
  };

  const currentStyle = step.position || defaultPosition;

  return (
    <div className="tutorial-overlay" onClick={handleNext}>
    <svg className="tutorial-svg-mask" viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}>
      <defs>
        <mask id="hole">
          {/* Белый фон — всё, что под ним, будет темным */}
          <rect width="100%" height="100%" fill="white" />
          
          {/* Отрисовываем "дырку" для каждого найденного элемента */}
          {coordsArray.map((coords, index) => (
            <rect 
              key={index}
              x={coords.x - 8} // небольшой отступ
              y={coords.y - 8} 
              width={coords.width + 16} 
              height={coords.height + 16} 
              fill="black" // Черный цвет в маске = прозрачность в итоговом слое
              rx="12"      // скругление
              style={{ transition: 'all 0.3s ease' }} // плавно, если элементы меняются
            />
          ))}
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#hole)" />
    </svg>

      {/* Применяем динамические стили здесь */}
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