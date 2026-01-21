import { BonusType } from "types/bonus-type";
import friendlyTeamImg from "@/assets/bonuses/friendlyTeam.svg";
import careerGrowthImg from "@/assets/bonuses/careerGrowth.svg";
import sportCompensationImg from "@/assets/bonuses/sportCompensation.svg";
import knowledgeBaseImg from "@/assets/bonuses/knowledgeBase.svg";
import remoteWorkImg from "@/assets/bonuses/remoteWork.svg";
import openGuideImg from "@/assets/bonuses/openGuide.svg";
import modernProductsImg from "@/assets/bonuses/modernProducts.svg";
import itSphereImg from "@/assets/bonuses/itSphere.svg";
import dmsImg from "@/assets/bonuses/dms.svg";

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
  friendlyTeam: friendlyTeamImg,
  careerGrowth: careerGrowthImg,
  sportCompensation: sportCompensationImg,
  knowledgeBase: knowledgeBaseImg,
  remoteWork: remoteWorkImg,
  openGuide: openGuideImg,
  modernProducts: modernProductsImg,
  itSphere: itSphereImg,
  dms: dmsImg,
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
  friendlyTeam: "Помогаем и создаем друг для друга комфортную атмосферу.",
  careerGrowth: "В поддержку Контура можно прийти без опыта и вырасти меньше чем за год.",
  sportCompensation: "Дополнительная поддержка для занятий спортом и поддержания энергии.",
  knowledgeBase: "Быстрый доступ к информации, которая помогает принимать решения увереннее и быстрее.",
  remoteWork: "Можно работать из дома. Отправим технику по России и компенсируем расходы на интернет.",
  openGuide: "Прозрачное общение, понятные цели и уверенность в том, что тебя слышат.",
  modernProducts: "Работа с актуальными сервисами, которые упрощают жизнь каждого третьего бизнеса в России.",
  itSphere: "Погружение в технологичную среду, где можно открыто высказывать свое мнение и расти в среде профи.",
  dms: 'ДМС с выбором из двух страховых, психолог и реальный work-life balance.'
};