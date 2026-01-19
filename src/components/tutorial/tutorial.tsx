// components/tutorial/tutorial.tsx
import { useState, useEffect } from 'react';
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  // Дефолтные стили, если позиция не передана (по центру внизу)
  const defaultPosition = {
    bottom: '10%',
    left: '50%',
    transform: 'translateX(-50%)'
  };

  const currentStyle = step.position || defaultPosition;

  return (
    <div className="tutorial-overlay" onClick={handleNext}>
    <svg className="tutorial-svg-mask">
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