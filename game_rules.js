/**
 * game_rules.js
 * Базовые правила и справочник карт для карточной дуэли.
 */

export const CONSTANTS = {
  STARTING_HP: 30,
  MAX_HP: 30,
  STARTING_MANA: 1,
  MAX_MANA_CAP: 10,
  STARTING_HAND_SIZE: 4,
  MAX_HAND_SIZE: 7,
  CARDS_DRAWN_PER_TURN: 1
};

export const CARD_TYPES = {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  HEAL: 'heal',
  SPECIAL: 'special'
};

export const CARDS = [
  {
    id: 'strike',
    name: 'Удар',
    type: CARD_TYPES.ATTACK,
    cost: 1,
    damage: 4,
    description: 'Наносит 4 единицы урона цели.'
  },
  {
    id: 'block',
    name: 'Блок',
    type: CARD_TYPES.DEFENSE,
    cost: 1,
    shield: 5,
    description: 'Дает 5 единиц щита.'
  },
  {
    id: 'heal',
    name: 'Лечение',
    type: CARD_TYPES.HEAL,
    cost: 1,
    heal: 4,
    description: 'Восстанавливает 4 единицы здоровья.'
  },
  {
    id: 'fireball',
    name: 'Огненный шар',
    type: CARD_TYPES.ATTACK,
    cost: 2,
    damage: 7,
    description: 'Наносит 7 единиц урона цели.'
  },
  {
    id: 'heavy_shield',
    name: 'Тяжелый щит',
    type: CARD_TYPES.DEFENSE,
    cost: 2,
    shield: 9,
    description: 'Дает 9 единиц щита.'
  },
  {
    id: 'quick_slash',
    name: 'Быстрый укол',
    type: CARD_TYPES.ATTACK,
    cost: 2,
    damage: 3,
    draw: 1,
    description: 'Наносит 3 единицы урона и берет 1 карту из колоды.'
  },
  {
    id: 'vampirism',
    name: 'Вампиризм',
    type: CARD_TYPES.SPECIAL,
    cost: 3,
    damage: 5,
    heal: 5,
    description: 'Наносит 5 урона цели и восстанавливает 5 единиц здоровья.'
  },
  {
    id: 'poison_dart',
    name: 'Отравленный дротик',
    type: CARD_TYPES.SPECIAL,
    cost: 2,
    damage: 2,
    poison: {
      turns: 2,
      damagePerTurn: 3
    },
    description: 'Наносит 2 урона сразу и отравляет цель на 2 хода (по 3 урона в начале каждого хода).'
  },
  {
    id: 'meditation',
    name: 'Медитация',
    type: CARD_TYPES.HEAL,
    cost: 2,
    heal: 6,
    draw: 1,
    description: 'Восстанавливает 6 здоровья и берет 1 карту из колоды.'
  },
  {
    id: 'piercing_strike',
    name: 'Бронебойный выпад',
    type: CARD_TYPES.ATTACK,
    cost: 3,
    trueDamage: 6,
    description: 'Наносит 6 чистого урона прямо по здоровью, игнорируя щит.'
  },
  {
    id: 'mirror_shield',
    name: 'Зеркальный щит',
    type: CARD_TYPES.DEFENSE,
    cost: 3,
    shield: 7,
    reflect: 3,
    description: 'Дает 7 щита. При следующей атаке врага отражает 3 урона обратно.'
  },
  {
    id: 'fury',
    name: 'Боевой раж',
    type: CARD_TYPES.SPECIAL,
    cost: 2,
    attackBuff: 4,
    draw: 1,
    description: 'Следующая сыгранная атака нанесет на 4 урона больше. Берет 1 карту.'
  },
  {
    id: 'meteor',
    name: 'Метеорит',
    type: CARD_TYPES.ATTACK,
    cost: 5,
    damage: 12,
    description: 'Обрушивает метеорит на врага, нанося 12 урона.'
  },
  {
    id: 'second_wind',
    name: 'Второе дыхание',
    type: CARD_TYPES.SPECIAL,
    cost: 3,
    conditional: {
      thresholdHp: 15,
      lowHpHeal: 10,
      lowHpShield: 4,
      defaultHeal: 5,
      defaultShield: 5
    },
    description: 'Восстанавливает 5 здоровья и 5 щита. Если здоровье ниже 15, восстанавливает 10 здоровья и 4 щита.'
  }
];

export const CARD_MAP = CARDS.reduce((acc, card) => {
  acc[card.id] = card;
  return acc;
}, {});

/**
 * Создает сбалансированную колоду по умолчанию (24 карты).
 */
export function createDefaultDeck() {
  const distribution = [
    { id: 'strike', count: 3 },
    { id: 'block', count: 3 },
    { id: 'heal', count: 2 },
    { id: 'fireball', count: 2 },
    { id: 'heavy_shield', count: 2 },
    { id: 'quick_slash', count: 2 },
    { id: 'vampirism', count: 2 },
    { id: 'poison_dart', count: 2 },
    { id: 'meditation', count: 1 },
    { id: 'piercing_strike', count: 1 },
    { id: 'mirror_shield', count: 1 },
    { id: 'fury', count: 1 },
    { id: 'second_wind', count: 1 },
    { id: 'meteor', count: 1 }
  ];

  const deck = [];
  distribution.forEach(({ id, count }) => {
    const template = CARD_MAP[id];
    for (let i = 0; i < count; i++) {
      deck.push({ ...template, uid: `${id}_${Math.random().toString(36).slice(2, 8)}` });
    }
  });

  return deck;
}

export default {
  CONSTANTS,
  CARD_TYPES,
  CARDS,
  CARD_MAP,
  createDefaultDeck
};
