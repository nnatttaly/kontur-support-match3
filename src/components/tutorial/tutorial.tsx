import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
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
  const svgRef = useRef<SVGSVGElement>(null); // Реф для SVG

  const step = steps[currentStep];

  const updateCoords = useCallback(() => {
    if (step.highlightSelector && svgRef.current) {
      const elements = document.querySelectorAll(step.highlightSelector);
      const svgRect = svgRef.current.getBoundingClientRect(); // Замеряем сам SVG

      if (elements.length > 0) {
        const newCoords = Array.from(elements).map(el => {
          const rect = el.getBoundingClientRect();
          // ВЫЧИТАЕМ координаты SVG из координат элемента
          // Это гарантирует, что "дырка" будет ровно там, где элемент
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
    }
  }, [step.highlightSelector]);

  // Следим за всем: ресайз, скролл, смена шага
  useLayoutEffect(() => {
    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords); // На всякий случай
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
    };
  }, [updateCoords, currentStep]);

  // Блокировка скролла (Критично для iOS)
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none'; // Запрет жестов
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete, steps.length]);

  return (
    <div className="tutorial-overlay" onClick={handleNext}>
      <svg 
        ref={svgRef}
        className="tutorial-svg-mask"
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          pointerEvents: 'none' 
        }}
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
              />
            ))}
          </mask>
        </defs>
        <rect 
          width="100%" 
          height="100%" 
          fill="rgba(0,0,0,0.7)" 
          mask="url(#hole)" 
          style={{ pointerEvents: 'auto' }}
        />
      </svg>

      <div
        className={`tutorial-content ${step.characterPos}`}
        style={(step.position || { bottom: '10%', left: '50%', transform: 'translateX(-50%)' }) as React.CSSProperties}
      >
        {/* Контент (иконка, диалог) */}
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