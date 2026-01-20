// components/shuffle-warning/shuffle-warning.tsx
import { useEffect } from 'react';
import './shuffle-warning.css';

export type ShuffleWarningProps = {
  onClose: () => void;
  isVisible: boolean;
};

export const ShuffleWarning = ({
  onClose,
  isVisible,
}: ShuffleWarningProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500); // Автоматически закрываем через 1.5 секунды
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="shuffle-warning-overlay">
      <div className="shuffle-warning-content">
        <h2>Нет возможных ходов</h2>
        <p className="shuffle-message">
          Поле перемешивается для продолжения игры...
        </p>
      </div>
    </div>
  );
};