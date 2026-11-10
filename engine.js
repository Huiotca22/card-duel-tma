/**
 * engine.js
 * Чистая JavaScript-логика дуэльной карточной игры для Telegram Mini App (Canvas / Web).
 * Не имеет зависимостей от DOM или Canvas, поддерживает запуск в Node.js и браузере.
 */

import { CONSTANTS, CARD_TYPES, CARDS, CARD_MAP, createDefaultDeck } from './game_rules.js';

export class CardGameEngine {
  /**
   * @param {Object} [options]
   * @param {string} [options.playerName='Игрок']
   * @param {string} [options.opponentName='Соперник']
   * @param {Array}  [options.playerDeck]
   * @param {Array}  [options.opponentDeck]
   * @param {Object} [options.customRules]
   */
  constructor(options = {}) {
    this.rules = { ...CONSTANTS, ...(options.customRules || {}) };

    this.turn = 1;
    this.activePlayerKey = 'player';
    this.isGameOver = false;
    this.winner = null; // 'player' | 'opponent' | 'draw' | null
    this.actionLog = [];
    this.listeners = {};

    this.players = {
      player: this._createInitialPlayerState(
        'player',
        options.playerName || 'Игрок',
        options.playerDeck || createDefaultDeck()
      ),
      opponent: this._createInitialPlayerState(
        'opponent',
        options.opponentName || 'Соперник',
        options.opponentDeck || createDefaultDeck()
      )
    };

    this._initMatch();
  }

  // -------------------------------------------------------------
  // Инициализация и создание состояния
  // -------------------------------------------------------------

  _createInitialPlayerState(id, name, deck) {
    return {
      id,
      name,
      hp: this.rules.STARTING_HP,
      maxHp: this.rules.MAX_HP,
      shield: 0,
      mana: this.rules.STARTING_MANA,
      maxMana: this.rules.STARTING_MANA,
      deck: this._shuffle([...deck]),
      hand: [],
      discard: [],
      statusEffects: {
        poison: { turns: 0, damagePerTurn: 0 },
        attackBuff: 0,
        reflect: 0
      }
    };
  }

  _shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  _initMatch() {
    // Раздача начальной руки
    for (let i = 0; i < this.rules.STARTING_HAND_SIZE; i++) {
      this._drawCard('player', false);
      this._drawCard('opponent', false);
    }

    this._log(`Матч начался! Первый ход: ${this.players.player.name}`);
    this._emit('matchStart', this.getState());
  }

  // -------------------------------------------------------------
  // Подписка на события (для Canvas анимаций и интерфейса)
  // -------------------------------------------------------------

  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
    return () => this.off(eventName, callback);
  }

  off(eventName, callback) {
    if (!this.listeners[eventName]) return;
    this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
  }

  _emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Ошибка в обработчике события ${eventName}:`, err);
        }
      });
    }
  }

  _log(message) {
    const entry = { turn: this.turn, message, timestamp: Date.now() };
    this.actionLog.push(entry);
    this._emit('log', entry);
  }

  // -------------------------------------------------------------
  // Основные игровые методы
  // -------------------------------------------------------------

  /**
   * Разыграть карту из руки активного игрока.
   * @param {number} handIndex Индекс карты в руке.
   * @param {string} [playerKey=this.activePlayerKey] Игрок, разыгрывающий карту.
   * @returns {Object} Результат розыгрыша { success, card, effects, error }
   */
  playCard(handIndex, playerKey = this.activePlayerKey) {
    if (this.isGameOver) {
      return { success: false, error: 'Игра уже завершена' };
    }

    if (playerKey !== this.activePlayerKey) {
      return { success: false, error: 'Сейчас ход другого игрока' };
    }

    const current = this.players[playerKey];
    const opponentKey = playerKey === 'player' ? 'opponent' : 'player';
    const enemy = this.players[opponentKey];

    if (handIndex < 0 || handIndex >= current.hand.length) {
      return { success: false, error: 'Неверный индекс карты в руке' };
    }

    const card = current.hand[handIndex];

    if (current.mana < card.cost) {
      return {
        success: false,
        error: `Недостаточно маны (требуется ${card.cost}, доступно ${current.mana})`
      };
    }

    // Списание маны и удаление карты из руки
    current.mana -= card.cost;
    current.hand.splice(handIndex, 1);

    const effectSummary = {
      cardId: card.id,
      cardName: card.name,
      cost: card.cost,
      damageDealt: 0,
      trueDamageDealt: 0,
      shieldGained: 0,
      hpHealed: 0,
      cardsDrawn: 0,
      reflectedDamage: 0
    };

    // 1. Бафф на атаку (накапливается до применения следующей атаки)
    if (card.attackBuff) {
      current.statusEffects.attackBuff += card.attackBuff;
      this._log(`${current.name} получает усиление следующей атаки на +${card.attackBuff}`);
    }

    // 2. Прямой урон
    if (card.damage) {
      let finalDamage = card.damage;
      if (current.statusEffects.attackBuff > 0) {
        finalDamage += current.statusEffects.attackBuff;
        current.statusEffects.attackBuff = 0;
      }

      // Проверка отражения урона у цели
      if (enemy.statusEffects.reflect > 0) {
        const reflectDmg = enemy.statusEffects.reflect;
        enemy.statusEffects.reflect = 0;
        current.hp = Math.max(0, current.hp - reflectDmg);
        effectSummary.reflectedDamage = reflectDmg;
        this._log(`Зеркальный щит ${enemy.name} отражает ${reflectDmg} урона обратно в ${current.name}!`);
        this._emit('damage', { target: playerKey, amount: reflectDmg, isReflect: true });
      }

      // Поглощение урона щитом
      const absorbed = Math.min(enemy.shield, finalDamage);
      enemy.shield -= absorbed;
      const unabsorbed = finalDamage - absorbed;
      enemy.hp = Math.max(0, enemy.hp - unabsorbed);

      effectSummary.damageDealt = finalDamage;
      this._log(`${current.name} наносит ${finalDamage} урона картой ${card.name} (щит поглотил ${absorbed}, по здоровью ${unabsorbed})`);
      this._emit('damage', {
        target: opponentKey,
        amount: finalDamage,
        absorbedByShield: absorbed,
        hpDamage: unabsorbed
      });
    }

    // 3. Чистый урон (игнорирует щит)
    if (card.trueDamage) {
      let finalTrueDmg = card.trueDamage;
      if (current.statusEffects.attackBuff > 0) {
        finalTrueDmg += current.statusEffects.attackBuff;
        current.statusEffects.attackBuff = 0;
      }
      enemy.hp = Math.max(0, enemy.hp - finalTrueDmg);
      effectSummary.trueDamageDealt = finalTrueDmg;
      this._log(`${current.name} пробивает броню и наносит ${finalTrueDmg} чистого урона напрямую по здоровью`);
      this._emit('damage', { target: opponentKey, amount: finalTrueDmg, isTrueDamage: true });
    }

    // 4. Щит
    if (card.shield) {
      current.shield += card.shield;
      effectSummary.shieldGained += card.shield;
      this._log(`${current.name} получает +${card.shield} к щиту (всего щита: ${current.shield})`);
      this._emit('shield', { target: playerKey, amount: card.shield });
    }

    // 5. Лечение
    if (card.heal) {
      const prevHp = current.hp;
      current.hp = Math.min(current.maxHp, current.hp + card.heal);
      const healed = current.hp - prevHp;
      effectSummary.hpHealed += healed;
      this._log(`${current.name} восстанавливает ${healed} здоровья (текущее: ${current.hp}/${current.maxHp})`);
      this._emit('heal', { target: playerKey, amount: healed });
    }

    // 6. Добор карт
    if (card.draw) {
      for (let i = 0; i < card.draw; i++) {
        if (this._drawCard(playerKey)) {
          effectSummary.cardsDrawn++;
        }
      }
    }

    // 7. Яд
    if (card.poison) {
      enemy.statusEffects.poison = {
        turns: card.poison.turns,
        damagePerTurn: card.poison.damagePerTurn
      };
      this._log(`${enemy.name} отравлен на ${card.poison.turns} хода (-${card.poison.damagePerTurn} HP каждый ход)`);
      this._emit('statusApplied', { target: opponentKey, type: 'poison', details: card.poison });
    }

    // 8. Отражение урона
    if (card.reflect) {
      current.statusEffects.reflect = card.reflect;
      this._log(`${current.name} активирует Зеркальный щит (отражение ${card.reflect} урона)`);
    }

    // 9. Условные эффекты (например, Второе дыхание)
    if (card.conditional) {
      const isLowHp = current.hp < card.conditional.thresholdHp;
      const healAmount = isLowHp ? card.conditional.lowHpHeal : card.conditional.defaultHeal;
      const shieldAmount = isLowHp ? card.conditional.lowHpShield : card.conditional.defaultShield;

      const prevHp = current.hp;
      current.hp = Math.min(current.maxHp, current.hp + healAmount);
      const healed = current.hp - prevHp;
      current.shield += shieldAmount;

      effectSummary.hpHealed += healed;
      effectSummary.shieldGained += shieldAmount;

      this._log(`${current.name} использует Второе дыхание (${isLowHp ? 'критическое здоровье!' : 'обычный режим'}): +${healed} HP, +${shieldAmount} щита`);
      this._emit('heal', { target: playerKey, amount: healed });
      this._emit('shield', { target: playerKey, amount: shieldAmount });
    }

    // Карта уходит в сброс
    current.discard.push(card);

    this._emit('cardPlayed', {
      player: playerKey,
      card,
      effects: effectSummary
    });

    this.checkGameOver();

    return {
      success: true,
      card,
      effects: effectSummary,
      state: this.getState()
    };
  }

  /**
   * Взять карту из колоды.
   * Если колода пуста — замешивается сброс.
   * @private
   */
  _drawCard(playerKey, notify = true) {
    const player = this.players[playerKey];

    if (player.deck.length === 0 && player.discard.length > 0) {
      player.deck = this._shuffle([...player.discard]);
      player.discard = [];
      if (notify) {
        this._log(`Сброс игрока ${player.name} замешан обратно в колоду`);
      }
    }

    if (player.deck.length === 0) {
      if (notify) {
        this._log(`У игрока ${player.name} закончились карты в колоде!`);
      }
      return false;
    }

    const card = player.deck.pop();

    if (player.hand.length >= this.rules.MAX_HAND_SIZE) {
      player.discard.push(card);
      if (notify) {
        this._log(`Рука ${player.name} переполнена (макс. ${this.rules.MAX_HAND_SIZE})! Карта "${card.name}" сгорела`);
      }
      this._emit('cardBurned', { player: playerKey, card });
      return false;
    }

    player.hand.push(card);
    if (notify) {
      this._emit('cardDrawn', { player: playerKey, card });
    }
    return true;
  }

  /**
   * Завершить текущий ход.
   */
  endTurn() {
    if (this.isGameOver) {
      return { success: false, error: 'Игра уже завершена' };
    }

    const endedPlayerKey = this.activePlayerKey;
    const nextPlayerKey = endedPlayerKey === 'player' ? 'opponent' : 'player';

    this._emit('turnEnd', { player: endedPlayerKey, turn: this.turn });
    this._log(`${this.players[endedPlayerKey].name} завершает ход`);

    this.activePlayerKey = nextPlayerKey;
    const nextPlayer = this.players[nextPlayerKey];

    // Если ход вернулся к первому игроку — увеличиваем общий счетчик раунда
    if (nextPlayerKey === 'player') {
      this.turn++;
    }

    // 1. Прирост и восстановление маны (до максимума 10)
    nextPlayer.maxMana = Math.min(this.rules.MAX_MANA_CAP, nextPlayer.maxMana + 1);
    nextPlayer.mana = nextPlayer.maxMana;

    // 2. Обработка периодического урона (Яд)
    if (nextPlayer.statusEffects.poison.turns > 0) {
      const poisonDmg = nextPlayer.statusEffects.poison.damagePerTurn;
      nextPlayer.hp = Math.max(0, nextPlayer.hp - poisonDmg);
      nextPlayer.statusEffects.poison.turns--;

      this._log(`${nextPlayer.name} получает ${poisonDmg} урона от яда (осталось ходов: ${nextPlayer.statusEffects.poison.turns})`);
      this._emit('damage', { target: nextPlayerKey, amount: poisonDmg, isPoison: true });

      if (this.checkGameOver()) {
        return { success: true, isGameOver: true, winner: this.winner };
      }
    }

    // 3. Добор карты в начале хода
    for (let i = 0; i < this.rules.CARDS_DRAWN_PER_TURN; i++) {
      this._drawCard(nextPlayerKey);
    }

    this._log(`Ход игрока ${nextPlayer.name}. Раунд: ${this.turn}, Мана: ${nextPlayer.mana}/${nextPlayer.maxMana}`);
    this._emit('turnStart', {
      player: nextPlayerKey,
      turn: this.turn,
      mana: nextPlayer.mana,
      maxMana: nextPlayer.maxMana
    });

    return {
      success: true,
      activePlayer: nextPlayerKey,
      turn: this.turn,
      state: this.getState()
    };
  }

  /**
   * Проверка условий победы и поражения.
   * @returns {boolean} true если игра окончена
   */
  checkGameOver() {
    if (this.isGameOver) return true;

    const playerDead = this.players.player.hp <= 0;
    const opponentDead = this.players.opponent.hp <= 0;

    if (playerDead && opponentDead) {
      this.isGameOver = true;
      this.winner = 'draw';
      this._log('Ничья! Оба игрока пали в бою');
      this._emit('gameOver', { winner: 'draw', reason: 'both_dead' });
      return true;
    }

    if (playerDead) {
      this.isGameOver = true;
      this.winner = 'opponent';
      this._log(`Победа соперника (${this.players.opponent.name})!`);
      this._emit('gameOver', { winner: 'opponent', reason: 'player_defeated' });
      return true;
    }

    if (opponentDead) {
      this.isGameOver = true;
      this.winner = 'player';
      this._log(`Победа игрока (${this.players.player.name})!`);
      this._emit('gameOver', { winner: 'player', reason: 'opponent_defeated' });
      return true;
    }

    return false;
  }

  // -------------------------------------------------------------
  // Простой ИИ бота (для тестирования и одиночной игры на Canvas)
  // -------------------------------------------------------------

  /**
   * Выполняет ход за текущего активного игрока с базовым ИИ.
   * Приоритеты: добить врага -> спастись при low HP -> бафф перед атакой -> максимальный урон -> добор.
   * @returns {Array<Object>} Список совершенных действий
   */
  makeBotMove() {
    if (this.isGameOver) return [];

    const botKey = this.activePlayerKey;
    const bot = this.players[botKey];
    const enemyKey = botKey === 'player' ? 'opponent' : 'player';
    const enemy = this.players[enemyKey];

    const actions = [];
    let keepsPlaying = true;

    while (keepsPlaying && !this.isGameOver) {
      // Ищем все карты, на которые хватает маны
      const playable = bot.hand
        .map((card, index) => ({ card, index }))
        .filter(item => item.card.cost <= bot.mana);

      if (playable.length === 0) {
        keepsPlaying = false;
        break;
      }

      // 1. Проверяем, есть ли летал (карта, которая добьет врага прямо сейчас)
      const lethalCard = playable.find(item => {
        if (item.card.trueDamage && item.card.trueDamage >= enemy.hp) return true;
        if (item.card.damage && item.card.damage >= (enemy.hp + enemy.shield)) return true;
        return false;
      });

      let chosen = lethalCard;

      // 2. Если мало HP (< 12), ищем лечение или щит
      if (!chosen && bot.hp < 12) {
        chosen = playable.find(item => item.card.heal || item.card.shield || item.card.conditional);
      }

      // 3. Если есть бафф "Боевой раж" и есть в руке атака, разыгрываем сначала бафф
      if (!chosen) {
        const hasAttack = playable.some(item => item.card.damage || item.card.trueDamage);
        if (hasAttack) {
          chosen = playable.find(item => item.card.attackBuff);
        }
      }

      // 4. Иначе берем самую дорогую доступную карту (максимальный темп/урон)
      if (!chosen) {
        playable.sort((a, b) => b.card.cost - a.card.cost);
        chosen = playable[0];
      }

      if (chosen) {
        const res = this.playCard(chosen.index, botKey);
        actions.push(res);
      } else {
        keepsPlaying = false;
      }
    }

    if (!this.isGameOver) {
      this.endTurn();
    }

    return actions;
  }

  // -------------------------------------------------------------
  // Сериализация состояния для рендеринга на Canvas
  // -------------------------------------------------------------

  /**
   * Возвращает чистый снимок состояния (удобно передавать в Canvas render loop).
   * @param {string} [forPlayerKey=null] Если указан, карты руки соперника скрываются (для честного тумана войны).
   */
  getState(forPlayerKey = null) {
    const formatPlayer = (p, isSelf) => ({
      id: p.id,
      name: p.name,
      hp: p.hp,
      maxHp: p.maxHp,
      shield: p.shield,
      mana: p.mana,
      maxMana: p.maxMana,
      deckCount: p.deck.length,
      discardCount: p.discard.length,
      statusEffects: { ...p.statusEffects },
      // Если это соперник и включен туман войны — возвращаем только количество карт
      hand: isSelf || !forPlayerKey ? p.hand.map(c => ({ ...c })) : p.hand.map(() => ({ hidden: true })),
      handCount: p.hand.length
    });

    return {
      turn: this.turn,
      activePlayer: this.activePlayerKey,
      isGameOver: this.isGameOver,
      winner: this.winner,
      player: formatPlayer(this.players.player, forPlayerKey === 'player'),
      opponent: formatPlayer(this.players.opponent, forPlayerKey === 'opponent'),
      lastLog: this.actionLog.slice(-5)
    };
  }
}

export default CardGameEngine;
