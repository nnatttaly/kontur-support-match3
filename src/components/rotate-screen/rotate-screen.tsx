import heroImg from "@/assets/images/tutorial/hero.svg";
import "./rotate-screen.css";

export const RotateScreen = () => (
  <div className="rotate-overlay">
    <img src={heroImg} alt="" className="rotate-hero" />
    <div className="rotate-card">
      <div className="rotate-icon-wrap">
        <div className="rotate-phone" />
      </div>
      <p className="rotate-title">Переверни экран</p>
      <p className="rotate-subtitle">
        Поверни устройство в{" "}
        <span className="rotate-accent">вертикальное положение</span>,
        чтобы продолжить игру
      </p>
    </div>
  </div>
);
