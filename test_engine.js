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

  // Тест 11: Карта "Фолиант мудрости" (tome) — добор 2 карт за 3 маны
  console.log('\n--- Тест новых карт и механик ---');
  const tomeGame = new CardGameEngine();
  tomeGame.players.player.hand = [{ ...CARD_MAP.tome, uid: 'tome_1' }];
  tomeGame.players.player.mana = 3;
  tomeGame.players.player.maxMana = 3;
  const initialDeckCount = tomeGame.players.player.deck.length;

  const tomeRes = tomeGame.playCard(0);
  assert(tomeRes.success === true, 'Фолиант мудрости успешно разыгран');
  assert(tomeRes.effects.cardsDrawn === 2, 'Фолиант мудрости добрал ровно 2 карты');
  assert(tomeGame.players.player.hand.length === 2, 'В руке игрока стало 2 новые карты');
  assert(tomeGame.players.player.mana === 0, 'Потрачено 3 маны');
  assert(tomeGame.players.player.deck.length === initialDeckCount - 2, 'Из колоды ушло 2 карты');

  // Тест 12: Карта "Казнь" (execute) — 4 чистого урона, но 8 если у врага <= 15 HP
  const execGame = new CardGameEngine();
  // Враг с высоким здоровьем (> 15 HP)
  execGame.players.opponent.hp = 20;
  execGame.players.opponent.shield = 5;
  execGame.players.player.mana = 4;
  execGame.players.player.hand = [
    { ...CARD_MAP.execute, uid: 'exec_normal' },
    { ...CARD_MAP.execute, uid: 'exec_lethal' }
  ];

  const execNormalRes = execGame.playCard(0);
  assert(execNormalRes.success === true, 'Казнь успешно сыграна по цели с HP > 15');
  assert(execNormalRes.effects.trueDamageDealt === 4, 'Нанесено 4 чистого урона (без удвоения)');
  assert(execGame.players.opponent.hp === 16, 'Здоровье врага снизилось с 20 до 16');
  assert(execGame.players.opponent.shield === 5, 'Щит врага не затронут чистым уроном (5)');

  // Теперь у врага <= 15 HP (установим 15 HP)
  execGame.players.opponent.hp = 15;
  execGame.players.player.mana = 2;
  const execDoubleRes = execGame.playCard(0);
  assert(execDoubleRes.success === true, 'Казнь сыграна по цели с HP <= 15');
  assert(execDoubleRes.effects.trueDamageDealt === 8, 'Урон казни удвоился до 8 единиц');
  assert(execGame.players.opponent.hp === 7, 'Здоровье врага снизилось с 15 до 7');
  assert(execGame.players.opponent.shield === 5, 'Щит врага по-прежнему нетронут (5)');

  // Тест 13: Карта "Всплеск маны" (surge) — +2 маны (с ограничением maxMana) и добор 1 карты
  const surgeGame = new CardGameEngine();
  surgeGame.players.player.maxMana = 5;
  surgeGame.players.player.mana = 2;
  surgeGame.players.player.hand = [{ ...CARD_MAP.surge, uid: 'surge_1' }];
  const deckBeforeSurge = surgeGame.players.player.deck.length;

  const surgeRes = surgeGame.playCard(0);
  assert(surgeRes.success === true, 'Всплеск маны успешно сыгран');
  assert(surgeRes.effects.manaGained === 2, 'Восстановлено 2 маны');
  assert(surgeRes.effects.cardsDrawn === 1, 'Добрана 1 карта');
  assert(surgeGame.players.player.mana === 3, 'Текущая мана: 2 - 1 (стоимость) + 2 = 3');
  assert(surgeGame.players.player.deck.length === deckBeforeSurge - 1, 'Взята 1 карта из колоды');

  // Проверка ограничения максимумом маны (кэп)
  surgeGame.players.player.maxMana = 3;
  surgeGame.players.player.mana = 3;
  surgeGame.players.player.hand = [{ ...CARD_MAP.surge, uid: 'surge_cap' }];
  const surgeCapRes = surgeGame.playCard(0);
  assert(surgeCapRes.success === true, 'Всплеск маны сыгран при почти полной мане');
  assert(surgeGame.players.player.mana === 3, 'Мана не превышает maxMana (3)');
  assert(surgeCapRes.effects.manaGained === 1, 'Фактический прирост маны ограничен капом (+1)');

  // Тест 14: Late game QoL — добор 2 карт в начале хода при maxMana >= 10
  const lateGame = new CardGameEngine();
  lateGame.players.player.maxMana = 10;
  lateGame.players.player.mana = 10;
  lateGame.players.player.hand = [];
  // Вызываем startTurn напрямую для игрока с maxMana = 10
  lateGame.startTurn('player');
  assert(lateGame.players.player.hand.length === 2, 'При maxMana >= 10 игрок добирает 2 карты в начале хода');

  // Тест 15: ИИ бота — приоритизация казни как летала (enemy HP <= 8)
  const botLethalGame = new CardGameEngine();
  botLethalGame.players.opponent.hp = 8;
  botLethalGame.players.player.mana = 2;
  botLethalGame.players.player.hand = [
    { ...CARD_MAP.strike, uid: 's_sub' }, // 4 урона (не летал)
    { ...CARD_MAP.execute, uid: 'exec_lethal' } // 8 урона (летал!)
  ];
  const botActions = botLethalGame.makeBotMove();
  assert(botLethalGame.isGameOver === true, 'Бот завершил игру летальной картой');
  assert(botLethalGame.winner === 'player', 'Победитель — player');
  assert(botActions[0].card.id === 'execute', 'Бот первым делом выбрал Казнь как летал');

  // Тест 16: ИИ бота — приоритизация добора карт при истощении руки (рука < 3)
  const botDrawGame = new CardGameEngine();
  botDrawGame.players.opponent.hp = 30;
  botDrawGame.players.player.hp = 25;
  botDrawGame.players.player.mana = 4;
  botDrawGame.players.player.hand = [
    { ...CARD_MAP.strike, uid: 's1' },
    { ...CARD_MAP.tome, uid: 'tome_refill' }
  ];
  // В руке 2 карты (< 3), бот должен выбрать Фолиант мудрости для восполнения руки
  const botDrawActions = botDrawGame.makeBotMove();
  assert(botDrawActions.length > 0, 'Бот совершил действия');
  assert(botDrawActions[0].card.id === 'tome', 'Бот выбрал карту добора для восполнения истощенной руки');

  console.log('\nВсе тесты успешно пройдены!');
}

runTests();
