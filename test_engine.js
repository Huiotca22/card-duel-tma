/**
 * test_engine.js
 * Автоматические тесты механик карточного движка.
 */

import { CardGameEngine } from './engine.js';
import { CARD_MAP } from './game_rules.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

function runTests() {
  console.log('=== Запуск тестов CardGameEngine ===\n');

  // Тест 1: Инициализация
  const game = new CardGameEngine({
    playerName: 'Тестер',
    opponentName: 'Бот'
  });

  const state1 = game.getState();
  assert(state1.turn === 1, 'Начальный раунд равен 1');
  assert(state1.activePlayer === 'player', 'Первый ход у игрока');
  assert(state1.player.hp === 30, 'Стартовое здоровье 30');
  assert(state1.player.mana === 1, 'Стартовая мана 1');
  assert(state1.player.maxMana === 1, 'Максимальная мана на 1 ходу равна 1');
  assert(state1.player.hand.length === 4, 'В руке 4 карты');
  assert(state1.opponent.hand.length === 4, 'У соперника в руке 4 карты');

  // Тест 2: Розыгрыш карты со щитом и проверка нехватки маны
  game.players.player.hand = [
    { ...CARD_MAP.block, uid: 'b1' },
    { ...CARD_MAP.meteor, uid: 'm1' } // Стоит 5 маны, сейчас доступна 1
  ];

  const playExpensive = game.playCard(1);
  assert(playExpensive.success === false, 'Нельзя сыграть Метеорит (5 маны) при 1 мане');

  const playBlock = game.playCard(0);
  assert(playBlock.success === true, 'Блок успешно сыгран за 1 ману');
  assert(game.players.player.shield === 5, 'Щит увеличился на 5');
  assert(game.players.player.mana === 0, 'Мана потрачена до 0');
  assert(game.players.player.discard.length === 1, 'Карта перемещена в сброс');

  // Тест 3: Завершение хода и масштабирование маны
  const endTurn1 = game.endTurn();
  assert(endTurn1.activePlayer === 'opponent', 'Ход перешел к сопернику');
  assert(game.players.opponent.maxMana === 2, 'У соперника мана возросла до 2');
  assert(game.players.opponent.mana === 2, 'У соперника 2 текущей маны');

  // Соперник завершает ход
  game.endTurn();
  assert(game.activePlayerKey === 'player', 'Ход вернулся к игроку');
  assert(game.turn === 2, 'Раунд переключился на 2');
  assert(game.players.player.maxMana === 2, 'У игрока максимальная мана 2');
  assert(game.players.player.mana === 2, 'У игрока текущая мана восстановилась до 2');

  // Тест 4: Урон по щиту и здоровью
  game.players.opponent.shield = 4;
  game.players.opponent.hp = 30;
  game.players.player.hand = [{ ...CARD_MAP.fireball, uid: 'f1' }]; // 7 урона за 2 маны
  game.players.player.mana = 2;

  const playFireball = game.playCard(0);
  assert(playFireball.success === true, 'Огненный шар успешно сыгран');
  assert(game.players.opponent.shield === 0, 'Щит соперника полностью сбит');
  assert(game.players.opponent.hp === 27, 'Здоровье соперника уменьшилось до 27 (4 сбило щит, 3 прошло в HP)');

  // Тест 5: Чистый урон (пробивание щита)
  game.players.opponent.shield = 10;
  game.players.player.hand = [{ ...CARD_MAP.piercing_strike, uid: 'p1' }]; // 6 чистого урона
  game.players.player.mana = 3;
  game.players.player.maxMana = 3;

  const playPiercing = game.playCard(0);
  assert(playPiercing.success === true, 'Бронебойный выпад сыгран');
  assert(game.players.opponent.shield === 10, 'Щит остался нетронутым (10)');
  assert(game.players.opponent.hp === 21, 'Здоровье снизилось напрямую на 6 (27 - 6 = 21)');

  // Тест 6: Лечение и оверхил (не больше 30)
  game.players.player.hp = 28;
  game.players.player.hand = [{ ...CARD_MAP.heal, uid: 'h1' }]; // +4 HP
  game.players.player.mana = 1;

  game.playCard(0);
  assert(game.players.player.hp === 30, 'Здоровье не превышает максимальный кап 30');

  // Тест 7: Зеркальный щит и отражение
  game.players.opponent.statusEffects.reflect = 3;
  game.players.player.hp = 30;
  game.players.player.hand = [{ ...CARD_MAP.strike, uid: 's1' }];
  game.players.player.mana = 1;

  game.playCard(0);
  assert(game.players.player.hp === 27, 'Игрок получил 3 урона от отражения Зеркального щита');
  assert(game.players.opponent.statusEffects.reflect === 0, 'Эффект отражения потрачен');

  // Тест 8: Яд в начале хода
  game.players.opponent.statusEffects.poison = { turns: 2, damagePerTurn: 4 };
  const oppHpBefore = game.players.opponent.hp;
  game.endTurn(); // Переход хода к оппоненту, яд должен сработать
  assert(game.players.opponent.hp === oppHpBefore - 4, 'Оппонент получил 4 урона от яда на старте хода');
  assert(game.players.opponent.statusEffects.poison.turns === 1, 'Остался 1 ход яда');

  // Тест 9: Проверка победы (Game Over)
  game.players.opponent.hp = 5;
  game.players.player.mana = 5;
  game.activePlayerKey = 'player';
  game.players.player.hand = [{ ...CARD_MAP.meteor, uid: 'm_kill' }]; // 12 урона

  game.playCard(0);
  assert(game.isGameOver === true, 'Игра завершена');
  assert(game.winner === 'player', 'Победитель — player');

  // Тест 10: Симуляция полного матча с ботом
  console.log('\n--- Тест симуляции матча ИИ против ИИ ---');
  const simGame = new CardGameEngine({ playerName: 'Бот 1', opponentName: 'Бот 2' });
  let roundsCount = 0;
  while (!simGame.isGameOver && roundsCount < 150) {
    simGame.makeBotMove();
    roundsCount++;
  }
  assert(simGame.isGameOver === true, `Матч завершился победой ${simGame.winner} за ${roundsCount} полуходов`);

  console.log('\nВсе тесты успешно пройдены!');
}

runTests();
