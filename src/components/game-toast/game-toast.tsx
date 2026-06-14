import "./game-toast.css";

type GameToastProps = { message: string };

export const GameToast = ({ message }: GameToastProps) => (
  <div className="game-toast">{message}</div>
);
