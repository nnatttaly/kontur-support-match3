export interface TutorialStep {
  text: string;
  characterPos: 'left' | 'right';
  highlightSelector?: string;
  // Новое поле для позиционирования всего блока обучения
  position?: {
    top?: string;
    left?: string;
    bottom?: string;
    right?: string;
    transform?: string; // Например, 'translate(-50%, -50%)' для центрирования
  };
}

export const TUTORIALS: Record<number, TutorialStep[]> = {
  1: [
    { text: "Привет! Я твой наставник", characterPos: 'left', highlightSelector: undefined, position: { top: '40%', left: '37%' } },
    { text: "Перетаскивай фигурки на поле и накапливай знания, которые пригодятся в дальнейшем", characterPos: 'right', highlightSelector: '.field', position: { top: '27%', left: '55%' } },
    { text: "Это твои цели уровня. Собери нужное количество рядов, чтобы перейти дальше", characterPos: 'right', highlightSelector: '.goals-container', position: { top: '35%', left: '30.5%' } },

    { text: "Это количество оставшихся ходов", characterPos: 'right', highlightSelector: '.moves-container', position: { top: '17%', left: '43%' } },
    { text: "А тут будет отображаться твой прогресс. Попробуй набрать как можно больше очков!", characterPos: 'left', highlightSelector: '.score-container', position: { top: '17%', left: '23%' } },
    { text: "Здесь твои бонусы — воспользуйся ими, чтобы быстрее достичь целей", characterPos: 'left', highlightSelector: '.bonuses-container', position: { top: '54%', left: '23%' } },
    { text: "Здесь твои бонусы — воспользуйся ими, чтобы быстрее достичь целей", characterPos: 'left', highlightSelector: '.bonuses-container', position: { top: '54%', left: '23%' } },

  ],
  2: [
    { text: "Настало время переходить к рабочим задачам. Как видишь, фигурки поменялись", characterPos: 'right', highlightSelector: '.field', position: { top: '27%', left: '55%' } },
    { text: "В этих клетках задачи посложнее, для выполнения которых нужно собирать комбинации с их участием", characterPos: 'right', highlightSelector: '.cell--golden', position: { top: '44%', left: '53%' }},
    { text: "Задача исчезнет, а ты приблизишься к цели", characterPos: 'left', highlightSelector: '.goal-item', position: { top: '62%', left: '14%' } },
  ],
  3: [
    { text: "Работать нужно на 5 звёзд!", characterPos: 'left', highlightSelector: '.goal-item', position: { top: '62%', left: '14%' } },
    { text: "Для выполнения цели опусти все звезды вниз", characterPos: 'right', highlightSelector: '.cell--star', position: { top: '62%', left: '48%' }},
  ],
  4: [
    { text: "Бриллианты работают так же, как и звезды. Доведи их в низ игрового поля", characterPos: 'right', highlightSelector: '.figure--diamond', position: { top: '43%', left: '43%' } },
  ],
  5: [
    { text: "Теперь, как у тимлида, у тебя есть своя команда. Помогай ей развиваться и достигать новых высот", characterPos: 'right', highlightSelector: '.figure--big--image', position: { top: '60%', left: '44%' } },
    { text: "Твоя цель — их улыбки! Собирай комбинации рядом с ними", characterPos: 'left', highlightSelector: '.figure--big--image', position: { top: '60%', left: '28%' }  },
  ],
  6: [
    { text: "Это игра в бесконечном режиме. Играй, сколько хочешь", characterPos: 'right', highlightSelector: undefined, position: { top: '60%', left: '44%' } },
    { text: "Твоя цель - набрать максимум очков. Используй бонусы", characterPos: 'right', highlightSelector: '.score-container, .bonuses-container', position: { top: '37%', left: '45%' }  },
    { text: "По мере выполнения одних целей будут появляться новые, а в награду выдаваться бонусы", characterPos: 'right', highlightSelector: '.goal-item, .bonuses-container', position: { top: '50%', left: '32%' } },
    { text: "Но учти, бонусов одного типа может быть не больше 3. Профи не полагаются на подарки судьбы", characterPos: 'left', highlightSelector: '.bonuses-container', position: { top: '52%', left: '28%' }  },
  ],
};
