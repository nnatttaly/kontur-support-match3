import { Button } from '@components/button/button';
import './end-transition.css';
import { CUP_ICON_PATH } from 'consts/paths';
import { getPointsWord } from '@utils/common-utils';

type EndTransitionProps = {
  score: number;
  onRestart: () => void;
};

export const EndTransition = ({
    score,
  onRestart,
}: EndTransitionProps) => {

  const handleLearnMore = () => {
    window.open('https://kontur.ru/lp/support?utm_ad=%7Bad_id%7D&p=1210&utm_medium=cpc&utm_source=YandexDirect&utm_campaign=vacancy-hr_brand_rsya&utm_content=uks_stranitsa_sayta%7Cad%7C%7Bad_id%7D%7Cgid%7C%7Bgbid%7D%7Ccid%7C%7Bcampaign_id%7D%7Ccpn%7C%7Bcampaign_name_lat%7D%7Csrc%7C%7Bsource_type%7D%7Cdev%7C%7Bdevice_type%7D%7Crgn%7C%7Bregion_name%7D%7Cmtp%7C%7Bmatch_type%7D%7Ctid%7C%7Bphrase_id%7D_%7Bretargeting_id%7D%7Cref%7C%7Bsource%7D&utm_term=%7BSupport_game%7D', '_blank');
  };

  return (
    <div className="final-level-content">
        
        <img className="final-icon" src={CUP_ICON_PATH} alt="cup" />
        <p className="final-score">Отличный результат: {score} {getPointsWord(score)}!</p>
        <h2 className="final-title">Поздравляем!</h2>
        
        <div className="final-message-wrapper">
            <p className="final-message">
            {"Теперь ты знаешь о карьере в клиентской поддержке Контура чуть больше! Приходи воплощать игровой путь в реальной жизни."}
            </p>
            <button 
            className="learn-more-button"
            onClick={handleLearnMore}
            >
            Узнать больше
            </button>
        </div>

        <div className="play-again">
        <p className="play-again-text">
            Если хочешь, можешь попробовать набрать еще больше очков!
        </p>
        <div className="button-wrapper">
            <Button 
            text="Сыграть еще" 
            onClick={onRestart}
            />
        </div>
        </div>
    </div>
        

  );
};
