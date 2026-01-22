import { BonusType } from "types/bonus-type";

export const BONUS_NAMES: Record<BonusType, string> = {
  friendlyTeam: "Дружная команда",
  careerGrowth: "Буст карьеры",
  sportCompensation: "Компенсация на спорт",
  knowledgeBase: "База знаний",
  remoteWork: "Удаленка",
  openGuide: "Открытое руководство",
  modernProducts: "Современные продукты",
  itSphere: "IT-сфера",
  dms: "Забота о здоровье",
};

export const BONUS_PATHS: Record<BonusType, string> = {
  friendlyTeam: "src/assets/bonuses/friendlyTeam.svg",
  careerGrowth: "src/assets/bonuses/careerGrowth.svg",
  sportCompensation: "src/assets/bonuses/sportCompensation.svg",
  knowledgeBase: "src/assets/bonuses/knowledgeBase.svg",
  remoteWork: "src/assets/bonuses/remoteWork.svg",
  openGuide: "src/assets/bonuses/openGuide.svg",
  modernProducts: "src/assets/bonuses/modernProducts.svg",
  itSphere: "src/assets/bonuses/itSphere.svg",
  dms: "src/assets/bonuses/dms.svg",
};

export const BONUS_EFFECTS: Record<BonusType, string> = {
  friendlyTeam: "Перемешивает все фигурки на поле",
  careerGrowth: "Дает 3 дополнительных хода",
  sportCompensation: "Дает дополнительный ход",
  knowledgeBase: "Дает 2 дополнительных хода",
  remoteWork: "Удаляет выбранную фигурку с поля",
  openGuide: "Автоматически засчитывает 1 ряд для цели",
  modernProducts: "Заменяет фигурку на выбранную",
  itSphere: "Удваивает очки и прогресс за все ряды следующего хода",
  dms: "Убирает все фигурки выбранного типа на поле"
};

export const BONUS_DESCRIPTIONS: Record<BonusType, string> = {
  friendlyTeam: "Комфортная и поддерживающая команда, где легко работать и быть собой.",
  careerGrowth: "Возможность начать без опыта и вырасти в профессии меньше чем за год.",
  sportCompensation: "Дополнительная поддержка для занятий спортом и повышения выносливости.",
  knowledgeBase: "Быстрый доступ к информации, которая помогает принимать решения увереннее и быстрее.",
  remoteWork: "Возможность работать из дома. Отправим технику по России и компенсируем расходы на интернет.",
  openGuide: "Прозрачное общение, понятные цели и уверенность в том, что тебя слышат.",
  modernProducts: "Работа с актуальными сервисами, которые упрощают жизнь каждого третьего бизнеса в России.",
  itSphere: "Погружение в технологичную среду, где можно открыто высказывать свое мнение и расти среди профи.",
  dms: 'ДМС с выбором из двух страховых, психолог и реальный work-life balance.'
};