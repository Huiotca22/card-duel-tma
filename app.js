/**
 * app.js
 * Главный контроллер приложения и интеграция с Telegram Mini App.
 */

import { CardGameEngine } from './engine.js';
import { ParticleSystem } from './particles.js';
import { CanvasRenderer } from './canvas_renderer.js';
import { sound } from './audio.js';

class DuelApp {
  constructor() {
    this.tg = window.Telegram?.WebApp || null;
    this.canvas = document.getElementById('gameCanvas');
    this.particles = new ParticleSystem();
    this.renderer = new CanvasRenderer(this.canvas, this.particles);
    this.engine = null;

    this.isBotThinking = false;
    this.pointerStartPos = { x: 0, y: 0 };
    this.isDragging = false;
    this.selectedCardIndex = -1;

    // UI элементы DOM
    this.ui = {
      logDrawer: document.getElementById('logDrawer'),
      logList: document.getElementById('logList'),
      toggleLogBtn: document.getElementById('toggleLogBtn'),
      closeLogBtn: document.getElementById('closeLogBtn'),
      toggleSoundBtn: document.getElementById('toggleSoundBtn'),
      rulesModal: document.getElementById('rulesModal'),
      openRulesBtn: document.getElementById('openRulesBtn'),
      closeRulesBtn: document.getElementById('closeRulesBtn'),
      gameOverModal: document.getElementById('gameOverModal'),
      gameOverTitle: document.getElementById('gameOverTitle'),
      gameOverDesc: document.getElementById('gameOverDesc'),
      restartMatchBtn: document.getElementById('restartMatchBtn'),
      toast: document.getElementById('toast')
    };

    this._initTelegram();
    this._initEventListeners();
    this.startNewMatch();
    this._startLoop();
  }

  // -------------------------------------------------------------
  // Telegram WebApp SDK
  // -------------------------------------------------------------

  _initTelegram() {
    if (this.tg) {
      try {
        this.tg.ready();
        this.tg.expand();
        if (this.tg.setHeaderColor) {
          this.tg.setHeaderColor('#0b0e17');
        }
        if (this.tg.setBackgroundColor) {
          this.tg.setBackgroundColor('#05070a');
        }
      } catch (e) {
        console.warn('Telegram WebApp init notice:', e);
      }
    }
  }

  _haptic(type = 'light') {
    if (this.tg?.HapticFeedback) {
      try {
        if (type === 'light' || type === 'medium' || type === 'heavy') {
          this.tg.HapticFeedback.impactOccurred(type);
        } else if (type === 'success' || type === 'warning' || type === 'error') {
          this.tg.HapticFeedback.notificationOccurred(type);
        }
      } catch (e) {}
    }
  }

  // -------------------------------------------------------------
  // Управление матчем
  // -------------------------------------------------------------

  startNewMatch() {
    // Получаем имя из Telegram или дефолт
    let playerName = 'Игрок';
    if (this.tg?.initDataUnsafe?.user?.first_name) {
      playerName = this.tg.initDataUnsafe.user.first_name;
    }

    this.engine = new CardGameEngine({
      playerName,
      opponentName: 'Вася (Бот)'
    });

    // Сброс логов в интерфейсе
    if (this.ui.logList) {
      this.ui.logList.innerHTML = '';
    }

    // Скрытие модалок
    this.ui.gameOverModal.classList.add('hidden');
    this.isBotThinking = false;

    // Подписка на события движка
    this._bindEngineEvents();

    this.showToast(`Матч начался! Твой ход, ${playerName}`);
  }

  _bindEngineEvents() {
    const e = this.engine;

    e.on('cardPlayed', ({ player, card, effects }) => {
      this.renderer.animateCardPlay(card, player);

      // Звуки по типу карты
      if (card.id === 'meteor' || card.id === 'fireball') {
        sound.playFireball();
      } else if (card.shield) {
        sound.playShield();
      } else if (card.heal) {
        sound.playHeal();
      } else if (card.poison) {
        sound.playPoison();
      } else if (card.damage || card.trueDamage) {
        sound.playAttack();
      } else {
        sound.playCardPlay();
      }

      this._haptic('medium');
    });

    e.on('damage', ({ target, amount, isReflect, isPoison, isTrueDamage }) => {
      const isTargetOpponent = target === 'opponent';
      const x = this.renderer.width / 2;
      const y = isTargetOpponent ? 70 : this.renderer.height - 180;

      if (isTrueDamage) {
        this.particles.spawnFloatingText(`-${amount} ЧИСТЫЙ!`, x, y, {
          color: '#bf5af2',
          fontSize: 24
        });
        this.particles.addTrauma(0.4);
      } else if (isReflect) {
        this.particles.spawnFloatingText(`🪞 -${amount}`, x, y, {
          color: '#bf5af2',
          fontSize: 22
        });
        this.particles.addTrauma(0.3);
      } else if (isPoison) {
        this.particles.spawnFloatingText(`🧪 -${amount}`, x, y, {
          color: '#30d158',
          fontSize: 20
        });
        this.particles.spawnPoisonMist(x, y);
      } else {
        this.particles.spawnFloatingText(`-${amount}`, x, y, {
          color: '#ff3b30',
          fontSize: 24
        });
        if (amount >= 10) {
          this.particles.spawnMeteorImpact(x, y);
        } else {
          this.particles.spawnFireBurst(x, y, 18);
        }
        this.particles.addTrauma(Math.min(0.7, amount * 0.05));
      }

      this._haptic('heavy');
    });

    e.on('shield', ({ target, amount }) => {
      const isTargetOpponent = target === 'opponent';
      const x = this.renderer.width / 2;
      const y = isTargetOpponent ? 70 : this.renderer.height - 180;

      this.particles.spawnFloatingText(`+${amount} ЩИТ`, x, y, {
        color: '#0a84ff',
        fontSize: 22
      });
      this.particles.spawnShieldBurst(x, y);
    });

    e.on('heal', ({ target, amount }) => {
      const isTargetOpponent = target === 'opponent';
      const x = this.renderer.width / 2;
      const y = isTargetOpponent ? 70 : this.renderer.height - 180;

      this.particles.spawnFloatingText(`+${amount} HP`, x, y, {
        color: '#34c759',
        fontSize: 22
      });
      this.particles.spawnHealSparkles(x, y);
    });

    e.on('turnStart', ({ player, turn }) => {
      sound.playTurnChange();
      if (player === 'opponent') {
        this._scheduleBotTurn();
      }
    });

    e.on('gameOver', ({ winner }) => {
      setTimeout(() => {
        if (winner === 'player') {
          sound.playVictory();
          this._haptic('success');
          this.ui.gameOverTitle.textContent = '🏆 ПОБЕДА!';
          this.ui.gameOverTitle.style.color = '#34c759';
          this.ui.gameOverDesc.textContent = 'Ты сокрушил соперника в честном поединке!';
        } else if (winner === 'opponent') {
          sound.playDefeat();
          this._haptic('error');
          this.ui.gameOverTitle.textContent = '💀 ПОРАЖЕНИЕ';
          this.ui.gameOverTitle.style.color = '#ff3b30';
          this.ui.gameOverDesc.textContent = 'Вася оказался хитрее. Попробуй еще раз!';
        } else {
          this.ui.gameOverTitle.textContent = '⚖️ НИЧЬЯ';
          this.ui.gameOverTitle.style.color = '#ffd60a';
          this.ui.gameOverDesc.textContent = 'Оба дуэлянта пали одновременно!';
        }
        this.ui.gameOverModal.classList.remove('hidden');
      }, 900);
    });

    e.on('log', ({ turn, message }) => {
      this._appendLogEntry(turn, message);
    });
  }

  // -------------------------------------------------------------
  // Пошаговый ИИ бота с реалистичными таймингами
  // -------------------------------------------------------------

  _scheduleBotTurn() {
    if (this.engine.isGameOver || this.isBotThinking) return;
    this.isBotThinking = true;

    const playNextBotCard = () => {
      if (this.engine.isGameOver || this.engine.activePlayerKey !== 'opponent') {
        this.isBotThinking = false;
        return;
      }

      const bot = this.engine.players.opponent;
      const enemy = this.engine.players.player;

      // Ищем все карты, на которые хватает маны
      const playable = bot.hand
        .map((card, index) => ({ card, index }))
        .filter(item => item.card.cost <= bot.mana);

      if (playable.length === 0) {
        // Нет карт — завершаем ход с небольшой паузой
        setTimeout(() => {
          if (!this.engine.isGameOver && this.engine.activePlayerKey === 'opponent') {
            this.engine.endTurn();
          }
          this.isBotThinking = false;
        }, 800);
        return;
      }

      // Выбор карты по логике Васи
      const lethalCard = playable.find(item => {
        if (item.card.trueDamage && item.card.trueDamage >= enemy.hp) return true;
        if (item.card.damage && item.card.damage >= (enemy.hp + enemy.shield)) return true;
        return false;
      });

      let chosen = lethalCard;

      if (!chosen && bot.hp < 12) {
        chosen = playable.find(item => item.card.heal || item.card.shield || item.card.conditional);
      }

      if (!chosen) {
        const hasAttack = playable.some(item => item.card.damage || item.card.trueDamage);
        if (hasAttack) {
          chosen = playable.find(item => item.card.attackBuff);
        }
      }

      if (!chosen) {
        playable.sort((a, b) => b.card.cost - a.card.cost);
        chosen = playable[0];
      }

      if (chosen) {
        this.engine.playCard(chosen.index, 'opponent');
        // Пауза перед следующим ходом (900мс)
        setTimeout(playNextBotCard, 900);
      } else {
        setTimeout(() => {
          if (!this.engine.isGameOver && this.engine.activePlayerKey === 'opponent') {
            this.engine.endTurn();
          }
          this.isBotThinking = false;
        }, 700);
      }
    };

    // Стартовая задержка хода бота (600мс)
    setTimeout(playNextBotCard, 600);
  }

  // -------------------------------------------------------------
  // Обработка ввода (Touch + Pointer/Mouse)
  // -------------------------------------------------------------

  _initEventListeners() {
    window.addEventListener('resize', () => {
      this.renderer.resize();
    });

    const c = this.canvas;

    const getCanvasCoords = (e) => {
      const rect = c.getBoundingClientRect();
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    // Pointer Down
    c.addEventListener('pointerdown', (e) => {
      const { x, y } = getCanvasCoords(e);
      this.pointerStartPos = { x, y };

      // Проверка клика по кнопке конца хода
      if (this.renderer.isOverEndTurn(x, y)) {
        if (this.engine.activePlayerKey === 'player' && !this.engine.isGameOver) {
          this._haptic('light');
          this.engine.endTurn();
        }
        return;
      }

      // Проверка колоды / сброса
      if (this.renderer.isOverDeck(x, y)) {
        this.showToast(`В колоде осталось: ${this.engine.players.player.deck.length} карт`);
        return;
      }
      if (this.renderer.isOverDiscard(x, y)) {
        this.showToast(`В сбросе: ${this.engine.players.player.discard.length} карт`);
        return;
      }

      // Проверка выбора карты в руке
      const cardIdx = this.renderer.getCardIndexAt(x, y);
      if (cardIdx >= 0) {
        sound.playCardHover();
        this._haptic('light');
        this.selectedCardIndex = cardIdx;
        this.renderer.draggedCardIndex = cardIdx;
        this.renderer.dragPos = { x, y };
        this.isDragging = true;
        c.setPointerCapture(e.pointerId);
      }
    });

    // Pointer Move
    c.addEventListener('pointermove', (e) => {
      const { x, y } = getCanvasCoords(e);

      if (this.isDragging) {
        this.renderer.dragPos = { x, y };
      } else {
        // Подсветка карты при наведении курсора на десктопе
        const idx = this.renderer.getCardIndexAt(x, y);
        if (idx !== this.renderer.hoveredCardIndex) {
          this.renderer.hoveredCardIndex = idx;
          if (idx >= 0) sound.playCardHover();
        }
      }
    });

    // Pointer Up
    const onPointerUp = (e) => {
      if (!this.isDragging) return;
      const { x, y } = getCanvasCoords(e);

      const dx = x - this.pointerStartPos.x;
      const dy = y - this.pointerStartPos.y;
      const dist = Math.hypot(dx, dy);

      const cardIdx = this.renderer.draggedCardIndex;
      this.renderer.draggedCardIndex = -1;
      this.isDragging = false;

      if (cardIdx >= 0) {
        // Условие розыгрыша: перетащили вверх за порог ИЛИ просто тапнули по карте
        const isDraggedUp = y < this.renderer.height - 230;
        const isTap = dist < 12;

        if (isDraggedUp || isTap) {
          this._attemptPlayCard(cardIdx);
        }
      }
    };

    c.addEventListener('pointerup', onPointerUp);
    c.addEventListener('pointercancel', onPointerUp);

    // Модалки и кнопки
    this.ui.toggleSoundBtn.addEventListener('click', () => {
      const state = sound.toggle();
      this.ui.toggleSoundBtn.textContent = state ? '🔊' : '🔇';
      this.showToast(state ? 'Звук включен' : 'Звук выключен');
    });

    this.ui.toggleLogBtn.addEventListener('click', () => {
      this.ui.logDrawer.classList.toggle('hidden');
    });

    this.ui.closeLogBtn.addEventListener('click', () => {
      this.ui.logDrawer.classList.add('hidden');
    });

    this.ui.openRulesBtn.addEventListener('click', () => {
      this.ui.rulesModal.classList.remove('hidden');
    });

    this.ui.closeRulesBtn.addEventListener('click', () => {
      this.ui.rulesModal.classList.add('hidden');
    });

    this.ui.restartMatchBtn.addEventListener('click', () => {
      this.startNewMatch();
    });
  }

  _attemptPlayCard(cardIdx) {
    if (this.engine.isGameOver) return;
    if (this.engine.activePlayerKey !== 'player') {
      this.showToast('Сейчас ход соперника!');
      this._haptic('warning');
      return;
    }

    const card = this.engine.players.player.hand[cardIdx];
    if (!card) return;

    if (this.engine.players.player.mana < card.cost) {
      this.showToast(`Не хватает маны! Нужно: ${card.cost}`);
      this._haptic('error');
      return;
    }

    const res = this.engine.playCard(cardIdx, 'player');
    if (!res.success) {
      this.showToast(res.error || 'Ошибка розыгрыша');
    }
  }

  // -------------------------------------------------------------
  // Журнал боя и тосты
  // -------------------------------------------------------------

  _appendLogEntry(turn, message) {
    if (!this.ui.logList) return;
    const li = document.createElement('li');
    li.className = 'log-item';
    li.innerHTML = `<span class="log-turn">R${turn}</span> <span class="log-msg">${message}</span>`;
    this.ui.logList.prepend(li);
  }

  showToast(text, duration = 2200) {
    if (!this.ui.toast) return;
    this.ui.toast.textContent = text;
    this.ui.toast.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.ui.toast.classList.add('hidden');
    }, duration);
  }

  // -------------------------------------------------------------
  // Главный игровой цикл (60 FPS)
  // -------------------------------------------------------------

  _startLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min(2.0, (now - lastTime) / 16.66);
      lastTime = now;

      // Обновление физики частиц
      this.particles.update(dt);

      // Рендеринг сцены
      if (this.engine) {
        this.renderer.render(this.engine.getState());
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Запуск при загрузке документа
window.addEventListener('DOMContentLoaded', () => {
  window.duelApp = new DuelApp();
});
