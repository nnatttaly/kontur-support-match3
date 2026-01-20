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

// Функция для определения устройств Apple
const useIsAppleDevice = () => {
  const [isAppleDevice, setIsAppleDevice] = useState(false);

  useEffect(() => {
    const checkAppleDevice = () => {
      // Проверяем user agent на наличие ключевых слов Apple
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);

      
      setIsAppleDevice(isIOS);
    };

    checkAppleDevice();
  }, []);

  return isAppleDevice;
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

export const Tutorial = ({ steps, onComplete }: Props) => {
  const isMobile = useIsMobile();
  const isAppleDevice = useIsAppleDevice();
  const [currentStep, setCurrentStep] = useState(0);
  const [coordsArray, setCoordsArray] = useState<ElementRect[]>([]);

  const step = steps[currentStep];

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete, steps.length]);

  // Определяем, нужно ли применять обычное выделение через SVG маску
  const shouldApplySvgHighlight = useCallback(() => {
    // Если это устройство Apple и есть селектор для мобильных устройств, 
    // или если это не устройство Apple и есть обычный селектор
    if (isAppleDevice) {
      // На устройствах Apple не используем SVG маску
      return false;
    }
    
    // Для не-Apple устройств используем обычную логику
    return !!step.highlightSelector;
  }, [isAppleDevice, step.highlightSelector]);

  // Определяем, нужно ли показывать полное затемнение
  const shouldShowFullOverlay = useCallback(() => {
    // Если это устройство Apple - никогда не показываем полное затемнение
    if (isAppleDevice) return false;
    
    // На не-телефонах Apple показываем полное затемнение если нет highlightSelector
    return !step.highlightSelector;
  }, [isAppleDevice, step.highlightSelector]);

  // Определяем, нужно ли применять мобильное выделение (clickable элементы)
  const shouldApplyMobileHighlight = useCallback(() => {
    // На устройствах Apple всегда применяем мобильное выделение, если есть селектор
    if (isAppleDevice && step.highlightSelector) {
      return true;
    }
    
    // Для не-Apple устройств используем существующую логику
    return !!step.highlightBonus 
  }, [isAppleDevice, step.highlightSelector, step.highlightBonus]);

  // Определяем селектор для мобильного выделения
  const getMobileSelector = useCallback(() => {
    // На устройствах Apple используем основной селектор
    if (isAppleDevice) {
      return step.highlightSelectorMobile || step.highlightSelector;
    }
    
    // Для не-Apple устройств используем существующую логику
    return step.highlightSelectorMobile || step.highlightSelector;
  }, [isAppleDevice, step.highlightSelector, step.highlightSelectorMobile]);

  useEffect(() => {
    if (shouldApplySvgHighlight()) {
      // Находим ВСЕ элементы по селектору
      const elements = document.querySelectorAll(step.highlightSelector!);
      
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
  }, [currentStep, step.highlightSelector, shouldApplySvgHighlight]);

  useEffect(() => {
    // Если не нужно применять мобильное выделение, выходим
    if (!shouldApplyMobileHighlight()) return;

    const mobileSelector = getMobileSelector();
    if (!mobileSelector) return;

    const elements = document.querySelectorAll(mobileSelector);
    const elementsArray = Array.from(elements) as HTMLElement[];

    if (elementsArray.length === 0) return;

    // Применяем стили и обработчики к каждому найденному элементу
    elementsArray.forEach(el => {
      el.style.zIndex = '9999999';
      el.style.position = el.style.position || 'relative'; // z-index работает только с позиционированием
      el.style.pointerEvents = 'auto'; // На случай, если перекрыто чем-то другим
      
      // Для устройств Apple добавляем визуальную подсветку
      if (isAppleDevice) {
        el.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.5)';
        el.style.borderRadius = '6px';
        el.style.transition = 'box-shadow 0.3s ease';
      }
      
      el.addEventListener('click', handleNext);
    });

    // Cleanup функция: возвращаем всё как было
    return () => {
      elementsArray.forEach(el => {
        el.style.zIndex = '';
        el.style.position = '';
        el.style.boxShadow = '';
        el.style.borderRadius = '';
        el.removeEventListener('click', handleNext);
      });
    };
  }, [currentStep, shouldApplyMobileHighlight, getMobileSelector, handleNext, isAppleDevice]);

  // Дефолтные стили, если позиция не передана (по центру внизу)
  const defaultPosition = {
    bottom: '10%',
    left: '50%',
    transform: 'translateX(-50%)'
  };

  const currentStyle =
    isMobile && step.mobilePosition
      ? step.mobilePosition
      : step.position || defaultPosition;

  return (
    <div className="tutorial-overlay" onClick={handleNext}>
      {/* Показываем полное затемнение на не-телефонах Apple если нет highlightSelector */}
      {shouldShowFullOverlay() && (
        <div className="full-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)',
          pointerEvents: 'none'
        }} />
      )}
      
      {/* Показываем SVG маску только если нужно и есть что выделять */}
      {shouldApplySvgHighlight() && coordsArray.length > 0 && (
        <svg className="tutorial-svg-mask">
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
      )}

      {/* Для устройств Apple без SVG маски показываем просто затемнение */}
      {isAppleDevice && !shouldApplySvgHighlight() && !shouldShowFullOverlay() && (
        <div className="apple-device-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)',
          pointerEvents: 'none'
        }} />
      )}

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
          <span className="click-hint">
            Кликни по экрану, чтобы продолжить
          </span>
        </div>
      </div>
    </div>
  );
};