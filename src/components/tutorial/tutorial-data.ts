export interface Position {
  top?: string;
  left?: string;
  bottom?: string;
  right?: string;
  transform?: string;
  width?: string;
}

export interface TutorialStep {
  text: string;
  characterPos: 'left' | 'right';
  highlightSelector?: string;
  // Новое поле для позиционирования всего блока обучения
  position?: Position; 
  mobilePosition?: Position;
  highlightBonus?: boolean;
  highlightSelectorMobile?: string;
}

export const TUTORIALS: Record<number, TutorialStep[]> = {
  1: [
    { text: "Привет! Я твой наставник", characterPos: 'left', highlightSelector: undefined, position: { top: '40%', left: '37%' }, mobilePosition: { top: '45%', left: '10%' }},
    { text: "Перетаскивай фигурки на поле и накапливай знания, которые пригодятся в дальнейшем", characterPos: 'left', highlightSelector: '.field', position: { top: '64%', left: '25%' }, mobilePosition: { top: '10%', left: '10%' } },
    { text: "Это твои цели уровня. Собери нужное количество рядов, чтобы перейти дальше", characterPos: 'right', highlightSelector: '.goals-container', position: { top: '35%', left: '30.5%' }, mobilePosition: { top: '30%', left: '10%' } },

    { text: "Это количество оставшихся ходов", characterPos: 'right', highlightSelector: undefined, position: { top: '17%', left: '40%' }, mobilePosition: { top: '35%', left: '15%' }, highlightSelectorMobile: '.moves-container'  },
    //{ text: "А тут будет отображаться твой прогресс. Попробуй набрать как можно больше очков!", characterPos: 'left', highlightSelector: '.score-container', position: { top: '17%', left: '23%' }, mobilePosition: { top: '35%', left: '5%' }, highlightBonus: true, highlightSelectorMobile: '.score-container' },
    //{ text: "Здесь твои бонусы — пользуйся ими, чтобы быстрее достичь целей", characterPos: 'left', highlightSelector: '.bonuses-container', highlightBonus: true, position: { top: '54%', left: '23%' }, mobilePosition: { top: '60%', left: '10%' }, highlightSelectorMobile: '.bonuses-container'  },
    { text: "А тут будет отображаться твой прогресс. Попробуй набрать как можно больше очков!", characterPos: 'left', highlightSelector: '.score-container', position: { top: '17%', left: '23%' }, mobilePosition: { top: '35%', left: '5%' } },
    { text: "Здесь твои бонусы — пользуйся ими, чтобы быстрее достичь целей", characterPos: 'left', highlightSelector: '.bonuses-container', position: { top: '54%', left: '23%' }, mobilePosition: { top: '60%', left: '10%' } },
    { text: "Попробуй)", characterPos: 'left', highlightSelector: '.bonuses-container', position: { top: '54%', left: '23%' }, mobilePosition: { top: '60%', left: '10%' }  },

  ],
  2: [
    { text: "Настало время переходить к рабочим задачам. Как видишь, фигурки поменялись", characterPos: 'left', highlightSelector: '.field', position: { top: '64%', left: '25%' }, mobilePosition: { top: '10%', left: '10%' } },
    { text: "В этих клетках задачи посложнее, для выполнения которых нужно собирать комбинации с их участием", characterPos: 'right', highlightSelector: '.cell--golden', position: { top: '10%', left: '35%' }, mobilePosition: { top: '25%', left: '10%' } },
    { text: "Задача исчезнет, а ты приблизишься к цели", characterPos: 'left', highlightSelector: '.goal-item', position: { top: '62%', left: '19%' }, mobilePosition: { top: '35%', left: '10%' } },
  ],
  3: [
        { text: "Работать нужно на 5 звёзд!", characterPos: 'left', highlightSelector: '.goal-item', position: { top: '62%', left: '19%' }, mobilePosition: { top: '35%', left: '10%' } },
    { text: "Для выполнения цели опусти все звезды вниз", characterPos: 'right', highlightSelector: '.cell--star', position: { top: '64%', left: '40%' }, mobilePosition: { top: '70%', left: '10%' }},
  ],
  4: [
    { text: "Бриллианты работают так же, как и звезды. Доведи их в низ игрового поля", characterPos: 'right', highlightSelector: '.figure--diamond', position: { top: '43%', left: '40%' }, mobilePosition: { top: '60%', left: '10%' } },
  ],
  5: [
    { text: "Теперь, как у тимлида, у тебя есть своя команда. Помогай ей развиваться и достигать новых высот", characterPos: 'right', highlightSelector: '.figure--big--image', position: { top: '60%', left: '40%' }, mobilePosition: { top: '28%', left: '10%' } },
    { text: "Твоя цель — их улыбки! Собирай комбинации рядом с ними", characterPos: 'left', highlightSelector: '.figure--big--image', position: { top: '60%', left: '28%' }, mobilePosition: { top: '70%', left: '10%' } },
  ],
  6: [
    { text: "Это игра в бесконечном режиме. Играй, сколько хочешь", characterPos: 'right', highlightSelector: undefined, position: { top: '60%', left: '40%' }, mobilePosition: { top: '45%', left: '10%' } },
    { text: "Твоя цель - набрать максимум очков. Используй бонусы", characterPos: 'right', highlightSelector: '.score-container, .bonuses-container', position: { top: '37%', left: '40%' }, mobilePosition: { top: '50%', left: '10%' } },
    { text: "По мере выполнения одних целей будут появляться новые, а в награду выдаваться бонусы", characterPos: 'right', highlightSelector: '.goal-item, .bonuses-container', position: { top: '50%', left: '32%' }, mobilePosition: { top: '40%', left: '10%' } },
    { text: "Но учти, бонусов одного типа может быть не больше 3. Профи не полагаются на подарки судьбы", characterPos: 'left', highlightSelector: '.bonuses-container', position: { top: '52%', left: '28%' }, mobilePosition: { top: '60%', left: '10%' }  },
  ],
};