import { useState, useCallback, useLayoutEffect, useRef} from 'react';
import { createPortal } from 'react-dom';
import './tutorial.css';
import { TutorialStep } from './tutorial-data';
import { DIALOG_BUBBLE_ICON_PATH, HERO_ICON_PATH } from 'consts/paths';

// ПАРАМЕТРЫ СДВИГА (если маска съезжает вправо-вниз, ставим отрицательные значения)
const IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const OFFSET_X = IS_IOS ? -50 : 0; // Сдвиг влево на 10px для iOS
const OFFSET_Y = IS_IOS ? -50 : 0; // Сдвиг вверх на 10px для iOS

interface Props {
  steps: TutorialStep[];
  onComplete: () => void;
}

export const Tutorial = ({ steps, onComplete }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coordsArray, setCoordsArray] = useState<any[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const step = steps[currentStep];

  const updateCoords = useCallback(() => {
    if (step.highlightSelector && svgRef.current) {
      const elements = document.querySelectorAll(step.highlightSelector);
      
      // На iOS координаты лучше брать относительно вьюпорта с учетом visualViewport
      const vv = window.visualViewport;
      const vOffsetX = vv ? vv.offsetLeft : 0;
      const vOffsetY = vv ? vv.offsetTop : 0;

      if (elements.length > 0) {
        const newCoords = Array.from(elements).map(el => {
          const rect = el.getBoundingClientRect();
          return {
            // Применяем ручной сдвиг + учитываем смещение вьюпорта
            x: rect.left - vOffsetX + OFFSET_X,
            y: rect.top - vOffsetY + OFFSET_Y,
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

  useLayoutEffect(() => {
    updateCoords();
    // Слушаем ресайз и скролл
    window.addEventListener('resize', updateCoords);
    window.visualViewport?.addEventListener('resize', updateCoords);
    window.visualViewport?.addEventListener('scroll', updateCoords);
    
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.visualViewport?.removeEventListener('resize', updateCoords);
      window.visualViewport?.removeEventListener('scroll', updateCoords);
    };
  }, [updateCoords, currentStep]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const tutorialJSX = (
    <div className="tutorial-overlay" onClick={handleNext}>
      <svg ref={svgRef} className="tutorial-svg-mask">
        <defs>
          <mask id="hole" maskUnits="userSpaceOnUse">
            <rect width="100%" height="100%" fill="white" />
            {coordsArray.map((coords, index) => (
              <rect
                key={`${currentStep}-${index}`}
                x={coords.x - 8}
                y={coords.y - 8}
                width={coords.width + 16}
                height={coords.height + 16}
                fill="black"
                rx="14"
              />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#hole)" />
      </svg>

      <div
        className={`tutorial-content ${step.characterPos}`}
        style={(step.position || { bottom: '10%', left: '50%', transform: 'translateX(-50%)' }) as React.CSSProperties}
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

  return createPortal(tutorialJSX, document.body);
};