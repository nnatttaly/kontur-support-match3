import { useState, useCallback, useLayoutEffect, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom'; // Импортируем портал
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
  const svgRef = useRef<SVGSVGElement>(null);

  const step = steps[currentStep];

  // Метод для точного расчета координат относительно SVG-контейнера
  const updateCoords = useCallback(() => {
    if (step.highlightSelector && svgRef.current) {
      const elements = document.querySelectorAll(step.highlightSelector);
      const svgRect = svgRef.current.getBoundingClientRect();

      if (elements.length > 0) {
        const newCoords = Array.from(elements).map(el => {
          const rect = el.getBoundingClientRect();
          // Вычитаем положение самого SVG, чтобы нивелировать любые сдвиги оверлея
          return {
            x: rect.left - svgRect.left,
            y: rect.top - svgRect.top,
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

  // Следим за изменениями экрана и шага
  useLayoutEffect(() => {
    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords);
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
    };
  }, [updateCoords, currentStep]);

  // Блокируем скролл страницы на время обучения
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleNext = useCallback((e: React.MouseEvent) => {
    // Предотвращаем срабатывание клика по элементам "под" оверлеем
    e.stopPropagation();
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete, steps.length]);

  const defaultPosition = {
    bottom: '10%',
    left: '50%',
    transform: 'translateX(-50%)'
  };

  const currentStyle = step.position || defaultPosition;

  // Сама разметка туториала
  const tutorialJSX = (
    <div className="tutorial-overlay" onClick={handleNext}>
      <svg 
        ref={svgRef}
        className="tutorial-svg-mask"
      >
        <defs>
          <mask id="hole">
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
          mask="url(#hole)" 
        />
      </svg>

      <div
        className={`tutorial-content ${step.characterPos}`}
        style={currentStyle as React.CSSProperties}
        onClick={(e) => e.stopPropagation()} // Клик по самому тексту не закрывает шаг
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

  // Рендерим всё это в body, а не туда, где вызван компонент
  return createPortal(tutorialJSX, document.body);
};