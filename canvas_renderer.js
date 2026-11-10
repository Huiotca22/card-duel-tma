/**
 * canvas_renderer.js
 * Высокопроизводительный Canvas-рендер для карточной дуэли Telegram Mini App.
 * Обеспечивает поддержку Retina/High-DPI, анимации, адаптивную верстку и сенсорное управление.
 */

import { CARD_TYPES } from './game_rules.js';

export class CanvasRenderer {
  constructor(canvas, particleSystem) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = particleSystem;

    this.dpr = window.devicePixelRatio || 1;
    this.width = 0;
    this.height = 0;

    // Интерактивное состояние
    this.hoveredCardIndex = -1;
    this.draggedCardIndex = -1;
    this.dragOffset = { x: 0, y: 0 };
    this.dragPos = { x: 0, y: 0 };

    // Анимации состояния
    this.animatedState = {
      playerHp: 30,
      playerHpGhost: 30,
      opponentHp: 30,
      opponentHpGhost: 30
    };

    // Анимация разыгрываемой в центре карты
    this.centerCardAnimation = null; // { card, from, x, y, scale, alpha, timer, duration }

    // Геометрия кликабельных областей
    this.hitboxes = {
      playerHand: [],
      endTurnBtn: null,
      deckPile: null,
      discardPile: null
    };

    this.resize();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // Запуск анимации сыгранной карты в центре
  animateCardPlay(card, fromKey = 'player') {
    const startX = fromKey === 'player' ? this.width / 2 : this.width / 2;
    const startY = fromKey === 'player' ? this.height - 120 : 120;
    const targetX = this.width / 2;
    const targetY = this.height / 2 - 20;

    this.centerCardAnimation = {
      card,
      fromKey,
      x: startX,
      y: startY,
      targetX,
      targetY,
      scale: 0.6,
      targetScale: 1.15,
      alpha: 1.0,
      progress: 0,
      duration: 50 // кадров (~800ms)
    };
  }

  // Обновление плавных переходов HP
  updateAnimations(state) {
    if (!state) return;

    // Плавное следование реальному HP
    const lerp = (a, b, t) => a + (b - a) * t;

    this.animatedState.playerHp = lerp(this.animatedState.playerHp, state.player.hp, 0.15);
    if (this.animatedState.playerHpGhost > state.player.hp) {
      this.animatedState.playerHpGhost = lerp(this.animatedState.playerHpGhost, state.player.hp, 0.04);
    } else {
      this.animatedState.playerHpGhost = state.player.hp;
    }

    this.animatedState.opponentHp = lerp(this.animatedState.opponentHp, state.opponent.hp, 0.15);
    if (this.animatedState.opponentHpGhost > state.opponent.hp) {
      this.animatedState.opponentHpGhost = lerp(this.animatedState.opponentHpGhost, state.opponent.hp, 0.04);
    } else {
      this.animatedState.opponentHpGhost = state.opponent.hp;
    }

    // Анимация центральной карты
    if (this.centerCardAnimation) {
      const anim = this.centerCardAnimation;
      anim.progress++;
      const t = anim.progress / anim.duration;

      if (t < 0.4) {
        // Вылет в центр
        const subT = t / 0.4;
        const easeOut = Math.sin((subT * Math.PI) / 2);
        anim.x = anim.fromKey === 'player' ? this.width / 2 : this.width / 2;
        anim.y = (anim.fromKey === 'player' ? this.height - 120 : 120) + (anim.targetY - (anim.fromKey === 'player' ? this.height - 120 : 120)) * easeOut;
        anim.scale = 0.6 + (anim.targetScale - 0.6) * easeOut;
      } else if (t < 0.8) {
        // Зависание с легким покачиванием
        anim.x = anim.targetX;
        anim.y = anim.targetY + Math.sin(t * 10) * 3;
        anim.scale = anim.targetScale;
      } else if (t <= 1.0) {
        // Уход в сторону сброса
        const subT = (t - 0.8) / 0.2;
        anim.alpha = Math.max(0, 1.0 - subT);
        anim.scale = anim.targetScale * (1 - subT * 0.4);
        anim.y -= subT * 30;
      } else {
        this.centerCardAnimation = null;
      }
    }
  }

  render(state) {
    if (!state) return;
    this.updateAnimations(state);

    const ctx = this.ctx;
    ctx.save();

    // 1. Применяем смещение тряски экрана
    if (this.particles.screenShake.x || this.particles.screenShake.y) {
      ctx.translate(this.particles.screenShake.x, this.particles.screenShake.y);
    }

    // 2. Фон арены
    this._renderBackground();

    // 3. Зона соперника (Сверху)
    this._renderOpponentZone(state.opponent, state.activePlayer === 'opponent');

    // 4. Центральная зона битвы (Раунд, статус, кнопка хода, разыгранная карта)
    this._renderBattlefieldCenter(state);

    // 5. Зона игрока (Снизу: HP, Щит, Мана, Карты)
    this._renderPlayerZone(state.player, state.activePlayer === 'player');

    // 6. Отрисовка перетаскиваемой карты поверх всего
    if (this.draggedCardIndex >= 0 && state.player.hand[this.draggedCardIndex]) {
      const card = state.player.hand[this.draggedCardIndex];
      const w = 110;
      const h = 155;
      const x = this.dragPos.x - w / 2;
      const y = this.dragPos.y - h / 2;
      this._renderSingleCard(card, x, y, w, h, {
        isHovered: true,
        isPlayable: card.cost <= state.player.mana && state.activePlayer === 'player',
        scale: 1.15,
        elevation: 15
      });
    }

    // 7. Отрисовка центральной анимированной карты
    if (this.centerCardAnimation) {
      const anim = this.centerCardAnimation;
      const w = 120 * anim.scale;
      const h = 170 * anim.scale;
      ctx.save();
      ctx.globalAlpha = anim.alpha;
      this._renderSingleCard(anim.card, anim.x - w / 2, anim.y - h / 2, w, h, {
        isHovered: true,
        isPlayable: true,
        glowColor: '#ffd60a'
      });
      ctx.restore();
    }

    // 8. Частицы и всплывающий урон
    this.particles.render(ctx);

    ctx.restore();
  }

  // -------------------------------------------------------------------
  // Фон
  // -------------------------------------------------------------------

  _renderBackground() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Глубокий темный космическо-фэнтезийный градиент
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
    bgGrad.addColorStop(0, '#151928');
    bgGrad.addColorStop(0.5, '#0b0e17');
    bgGrad.addColorStop(1, '#05070a');

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Декоративная арена-эллипс в центре
    ctx.save();
    ctx.strokeStyle = 'rgba(78, 110, 180, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.44, h * 0.22, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(78, 110, 180, 0.06)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.36, h * 0.17, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // -------------------------------------------------------------------
  // Верхняя зона (Соперник)
  // -------------------------------------------------------------------

  _renderOpponentZone(opponent, isActive) {
    const ctx = this.ctx;
    const padding = 16;
    const topY = 16;

    // 1. Аватар и статус активного хода
    ctx.save();
    const avatarX = padding + 22;
    const avatarY = topY + 22;

    if (isActive) {
      // Пульсирующее свечение вокруг аватара активного игрока
      const pulse = (Math.sin(Date.now() / 250) + 1) * 0.5;
      ctx.strokeStyle = `rgba(255, 149, 0, ${0.4 + pulse * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#2c2c2e';
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff9500';
    ctx.font = 'bold 16px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('В', avatarX, avatarY);
    ctx.restore();

    // 2. Имя соперника
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(opponent.name, padding + 52, topY + 4);

    ctx.fillStyle = isActive ? '#ff9500' : 'rgba(255, 255, 255, 0.45)';
    ctx.font = '11px -apple-system, system-ui, sans-serif';
    ctx.fillText(isActive ? 'Думает...' : 'Соперник', padding + 52, topY + 22);
    ctx.restore();

    // 3. HP Бар Соперника
    const barX = padding + 52;
    const barY = topY + 36;
    const barW = Math.min(this.width - barX - padding, 210);
    const barH = 12;

    this._renderHealthBar(
      barX,
      barY,
      barW,
      barH,
      this.animatedState.opponentHp,
      this.animatedState.opponentHpGhost,
      opponent.maxHp,
      opponent.shield
    );

    // 4. Мана соперника
    this._renderManaIndicator(barX, barY + barH + 5, opponent.mana, opponent.maxMana);

    // 5. Статусные баффы (Яд, Бафф, Отражение)
    this._renderStatusBadges(barX + barW + 8, barY - 4, opponent.statusEffects);

    // 6. Карты в руке соперника (рубашки карт, веер)
    this._renderOpponentHand(opponent.handCount, topY + 70);
  }

  _renderOpponentHand(cardCount, y) {
    const ctx = this.ctx;
    const count = Math.min(cardCount, 8);
    if (count === 0) return;

    const cardW = 42;
    const cardH = 58;
    const totalSpan = Math.min(this.width - 60, count * 32);
    const startX = (this.width - totalSpan) / 2;
    const step = count > 1 ? (totalSpan - cardW) / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const cx = startX + i * step;
      const angle = (i - (count - 1) / 2) * 0.05;

      ctx.save();
      ctx.translate(cx + cardW / 2, y + cardH / 2);
      ctx.rotate(angle);

      // Рубашка карты
      this._drawCardBack(-cardW / 2, -cardH / 2, cardW, cardH);
      ctx.restore();
    }
  }

  _drawCardBack(x, y, w, h) {
    const ctx = this.ctx;
    // Корпус
    ctx.fillStyle = '#1c1f2e';
    this._roundRect(ctx, x, y, w, h, 6);
    ctx.fill();

    // Рамка
    ctx.strokeStyle = '#4e6eb4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Внутренний ромб / узор
    ctx.strokeStyle = 'rgba(78, 110, 180, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 6);
    ctx.lineTo(x + w - 6, y + h / 2);
    ctx.lineTo(x + w / 2, y + h - 6);
    ctx.lineTo(x + 6, y + h / 2);
    ctx.closePath();
    ctx.stroke();
  }

  // -------------------------------------------------------------------
  // Центральная боевая арена
  // -------------------------------------------------------------------

  _renderBattlefieldCenter(state) {
    const ctx = this.ctx;
    const midY = this.height * 0.42;

    // 1. Бейдж раунда и очереди хода
    ctx.save();
    const isPlayerTurn = state.activePlayer === 'player';
    const bannerText = `РАУНД ${state.turn} • ${isPlayerTurn ? 'ТВОЙ ХОД' : 'ХОД СОПЕРНИКА'}`;
    ctx.font = 'bold 12px -apple-system, system-ui, sans-serif';
    const textWidth = ctx.measureText(bannerText).width;
    const pillW = textWidth + 24;
    const pillH = 24;
    const pillX = (this.width - pillW) / 2;
    const pillY = midY - 60;

    ctx.fillStyle = isPlayerTurn ? 'rgba(52, 199, 89, 0.18)' : 'rgba(255, 149, 0, 0.18)';
    this._roundRect(ctx, pillX, pillY, pillW, pillH, 12);
    ctx.fill();

    ctx.strokeStyle = isPlayerTurn ? '#34c759' : '#ff9500';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = isPlayerTurn ? '#34c759' : '#ff9500';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bannerText, pillX + pillW / 2, pillY + pillH / 2);
    ctx.restore();

    // 2. Дроп-зона для карты (если перетаскиваем)
    if (this.draggedCardIndex >= 0) {
      ctx.save();
      const dropW = Math.min(this.width - 60, 240);
      const dropH = 90;
      const dropX = (this.width - dropW) / 2;
      const dropY = midY - 20;

      ctx.strokeStyle = 'rgba(10, 132, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      this._roundRect(ctx, dropX, dropY, dropW, dropH, 14);
      ctx.stroke();

      ctx.fillStyle = 'rgba(10, 132, 255, 0.08)';
      ctx.fill();

      ctx.fillStyle = '#64d2ff';
      ctx.font = 'bold 13px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Отпустите карту для розыгрыша', dropX + dropW / 2, dropY + dropH / 2);
      ctx.restore();
    }

    // 3. Кнопка "Завершить ход" (Справа по центру)
    this._renderEndTurnButton(state.activePlayer === 'player');

    // 4. Колода и сброс игрока (Слева)
    this._renderDeckAndDiscard(state.player.deckCount, state.player.discardCount);
  }

  _renderEndTurnButton(isPlayerTurn) {
    const ctx = this.ctx;
    const btnW = 100;
    const btnH = 36;
    const btnX = this.width - btnW - 16;
    const btnY = this.height * 0.44;

    this.hitboxes.endTurnBtn = { x: btnX, y: btnY, w: btnW, h: btnH };

    ctx.save();
    if (isPlayerTurn) {
      // Активная кнопка завершения хода
      const grad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
      grad.addColorStop(0, '#ff9500');
      grad.addColorStop(1, '#ff3b30');

      ctx.fillStyle = grad;
      this._roundRect(ctx, btnX, btnY, btnW, btnH, 10);
      ctx.fill();

      ctx.strokeStyle = '#ffd60a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Конец хода', btnX + btnW / 2, btnY + btnH / 2);
    } else {
      // Неактивная
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      this._roundRect(ctx, btnX, btnY, btnW, btnH, 10);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '12px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Ход врага...', btnX + btnW / 2, btnY + btnH / 2);
    }
    ctx.restore();
  }

  _renderDeckAndDiscard(deckCount, discardCount) {
    const ctx = this.ctx;
    const startX = 16;
    const y = this.height * 0.44;

    // Колода
    const deckW = 34;
    const deckH = 46;
    this.hitboxes.deckPile = { x: startX, y, w: deckW, h: deckH };

    ctx.save();
    this._drawCardBack(startX, y, deckW, deckH);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${deckCount}`, startX + deckW / 2, y + deckH / 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '9px -apple-system, system-ui, sans-serif';
    ctx.fillText('КОЛОДА', startX + deckW / 2, y + deckH + 8);
    ctx.restore();

    // Сброс
    const discX = startX + deckW + 10;
    this.hitboxes.discardPile = { x: discX, y, w: deckW, h: deckH };

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this._roundRect(ctx, discX, y, deckW, deckH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 11px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${discardCount}`, discX + deckW / 2, y + deckH / 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '9px -apple-system, system-ui, sans-serif';
    ctx.fillText('СБРОС', discX + deckW / 2, y + deckH + 8);
    ctx.restore();
  }

  // -------------------------------------------------------------------
  // Нижняя зона (Игрок: HP, Мана, Карты)
  // -------------------------------------------------------------------

  _renderPlayerZone(player, isActive) {
    const ctx = this.ctx;
    const padding = 16;
    const hudY = this.height - 230;

    // 1. Аватар игрока
    ctx.save();
    const avatarX = padding + 22;
    const avatarY = hudY + 22;

    if (isActive) {
      const pulse = (Math.sin(Date.now() / 250) + 1) * 0.5;
      ctx.strokeStyle = `rgba(52, 199, 89, ${0.4 + pulse * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#1c2438';
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#34c759';
    ctx.font = 'bold 16px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.name.slice(0, 1).toUpperCase(), avatarX, avatarY);
    ctx.restore();

    // 2. Имя игрока
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(player.name, padding + 52, hudY + 4);

    ctx.fillStyle = isActive ? '#34c759' : 'rgba(255, 255, 255, 0.45)';
    ctx.font = '11px -apple-system, system-ui, sans-serif';
    ctx.fillText(isActive ? 'Твой ход' : 'Ожидание', padding + 52, hudY + 22);
    ctx.restore();

    // 3. HP Бар Игрока
    const barX = padding + 52;
    const barY = hudY + 36;
    const barW = Math.min(this.width - barX - padding, 210);
    const barH = 12;

    this._renderHealthBar(
      barX,
      barY,
      barW,
      barH,
      this.animatedState.playerHp,
      this.animatedState.playerHpGhost,
      player.maxHp,
      player.shield
    );

    // 4. Мана кристаллы игрока
    this._renderManaCrystals(barX, barY + barH + 6, player.mana, player.maxMana);

    // 5. Статусные баффы
    this._renderStatusBadges(barX + barW + 8, barY - 4, player.statusEffects);

    // 6. Карты в руке игрока
    this._renderPlayerHand(player.hand, player.mana, isActive, this.height - 155);
  }

  _renderHealthBar(x, y, w, h, currentHp, ghostHp, maxHp, shield) {
    const ctx = this.ctx;
    ctx.save();

    // Фон полоски
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this._roundRect(ctx, x, y, w, h, 6);
    ctx.fill();

    // Ghost Bar (анимация потерянного урона красным)
    const ghostWidth = Math.max(0, Math.min(w, (ghostHp / maxHp) * w));
    if (ghostWidth > 0) {
      ctx.fillStyle = 'rgba(255, 59, 48, 0.5)';
      this._roundRect(ctx, x, y, ghostWidth, h, 6);
      ctx.fill();
    }

    // Основная полоса здоровья
    const hpWidth = Math.max(0, Math.min(w, (currentHp / maxHp) * w));
    if (hpWidth > 0) {
      const grad = ctx.createLinearGradient(x, y, x + hpWidth, y);
      grad.addColorStop(0, '#ff3b30');
      grad.addColorStop(1, '#ff453a');
      ctx.fillStyle = grad;
      this._roundRect(ctx, x, y, hpWidth, h, 6);
      ctx.fill();
    }

    // Текст HP
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(currentHp)} / ${maxHp}`, x + w / 2, y + h / 2);

    // Щит (если есть)
    if (shield > 0) {
      const shieldX = x + w + 8;
      ctx.fillStyle = '#0a84ff';
      ctx.beginPath();
      ctx.arc(shieldX + 8, y + h / 2, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${shield}`, shieldX + 8, y + h / 2);
    }

    ctx.restore();
  }

  _renderManaIndicator(x, y, mana, maxMana) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#0a84ff';
    ctx.font = 'bold 11px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⚡ ${mana}/${maxMana}`, x, y + 4);
    ctx.restore();
  }

  _renderManaCrystals(x, y, mana, maxMana) {
    const ctx = this.ctx;
    ctx.save();
    const crystalR = 5;
    const spacing = 14;

    for (let i = 0; i < maxMana; i++) {
      const cx = x + i * spacing + crystalR;
      const cy = y + crystalR;

      ctx.beginPath();
      ctx.arc(cx, cy, crystalR, 0, Math.PI * 2);

      if (i < mana) {
        // Полный кристалл
        ctx.fillStyle = '#0a84ff';
        ctx.fill();
        ctx.strokeStyle = '#64d2ff';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // Пустой кристалл
        ctx.fillStyle = 'rgba(10, 132, 255, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(10, 132, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#64d2ff';
    ctx.font = 'bold 11px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${mana}/${maxMana}`, x + maxMana * spacing + 6, y + crystalR);
    ctx.restore();
  }

  _renderStatusBadges(x, y, statuses) {
    const ctx = this.ctx;
    let currentX = x;

    // 1. Яд
    if (statuses.poison && statuses.poison.turns > 0) {
      ctx.save();
      ctx.fillStyle = '#30d158';
      ctx.beginPath();
      ctx.arc(currentX + 8, y + 8, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${statuses.poison.turns}`, currentX + 8, y + 8);
      ctx.restore();
      currentX += 22;
    }

    // 2. Бафф атаки
    if (statuses.attackBuff > 0) {
      ctx.save();
      ctx.fillStyle = '#ff9500';
      ctx.beginPath();
      ctx.arc(currentX + 8, y + 8, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${statuses.attackBuff}`, currentX + 8, y + 8);
      ctx.restore();
      currentX += 22;
    }

    // 3. Отражение
    if (statuses.reflect > 0) {
      ctx.save();
      ctx.fillStyle = '#bf5af2';
      ctx.beginPath();
      ctx.arc(currentX + 8, y + 8, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🪞`, currentX + 8, y + 8);
      ctx.restore();
      currentX += 22;
    }
  }

  // -------------------------------------------------------------------
  // Рука игрока
  // -------------------------------------------------------------------

  _renderPlayerHand(hand, mana, isPlayerTurn, baseY) {
    this.hitboxes.playerHand = [];
    const count = hand.length;
    if (count === 0) return;

    const cardW = 100;
    const cardH = 145;

    // Рассчитываем веерное или рядное расположение
    const maxSpan = this.width - 24;
    const requiredSpan = count * (cardW + 8);
    const step = count > 1 ? Math.min(cardW + 8, (maxSpan - cardW) / (count - 1)) : 0;
    const startX = (this.width - (cardW + step * (count - 1))) / 2;

    for (let i = 0; i < count; i++) {
      if (i === this.draggedCardIndex) {
        // Пропускаем перетаскиваемую карту (она рисуется отдельно)
        continue;
      }

      const card = hand[i];
      const isHovered = i === this.hoveredCardIndex;
      const isPlayable = isPlayerTurn && card.cost <= mana;

      const x = startX + i * step;
      // Если навели курсор — карта приподнимается вверх
      const y = isHovered ? baseY - 24 : baseY;

      // Сохраняем хитбокс для кликов / тачей
      this.hitboxes.playerHand.push({
        index: i,
        x,
        y: baseY - 24, // увеличенная область для легкого попадания пальцем
        w: cardW,
        h: cardH + 24
      });

      this._renderSingleCard(card, x, y, cardW, cardH, {
        isHovered,
        isPlayable,
        scale: isHovered ? 1.08 : 1.0
      });
    }
  }

  _renderSingleCard(card, x, y, w, h, opts = {}) {
    const ctx = this.ctx;
    const scale = opts.scale || 1.0;

    ctx.save();
    if (scale !== 1.0) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(scale, scale);
      ctx.translate(-(x + w / 2), -(y + h / 2));
    }

    // Цвета в зависимости от типа карты
    const typeThemes = {
      [CARD_TYPES.ATTACK]: {
        gradStart: '#ff3b30',
        gradEnd: '#801010',
        border: '#ff453a',
        badge: 'АТАКА'
      },
      [CARD_TYPES.DEFENSE]: {
        gradStart: '#007aff',
        gradEnd: '#003880',
        border: '#0a84ff',
        badge: 'ЩИТ'
      },
      [CARD_TYPES.HEAL]: {
        gradStart: '#34c759',
        gradEnd: '#0c5e25',
        border: '#30d158',
        badge: 'ЛЕЧЕНИЕ'
      },
      [CARD_TYPES.SPECIAL]: {
        gradStart: '#af52de',
        gradEnd: '#501070',
        border: '#bf5af2',
        badge: 'МАГИЯ'
      }
    };

    const theme = typeThemes[card.type] || typeThemes[CARD_TYPES.ATTACK];

    // Свечение при наведении или доступности
    if (opts.glowColor || opts.isHovered) {
      ctx.shadowColor = opts.glowColor || '#ffd60a';
      ctx.shadowBlur = 12;
    }

    // 1. Корпус карты (закругленный темный прямоугольник)
    ctx.fillStyle = '#161922';
    this._roundRect(ctx, x, y, w, h, 8);
    ctx.fill();

    // Сброс тени
    ctx.shadowBlur = 0;

    // 2. Шапка карты с типом и градиентом
    const headerH = 28;
    ctx.save();
    this._roundRect(ctx, x, y, w, headerH, [8, 8, 0, 0]);
    ctx.clip();
    const hGrad = ctx.createLinearGradient(x, y, x + w, y);
    hGrad.addColorStop(0, theme.gradStart);
    hGrad.addColorStop(1, theme.gradEnd);
    ctx.fillStyle = hGrad;
    ctx.fillRect(x, y, w, headerH);
    ctx.restore();

    // 3. Рамка карты
    ctx.strokeStyle = opts.isHovered ? '#ffd60a' : theme.border;
    ctx.lineWidth = opts.isHovered ? 2 : 1.2;
    this._roundRect(ctx, x, y, w, h, 8);
    ctx.stroke();

    // 4. Кристалл маны (в верхнем левом углу)
    const manaR = 11;
    const manaX = x + 12;
    const manaY = y + 12;

    ctx.fillStyle = opts.isPlayable ? '#0a84ff' : '#48484a';
    ctx.beginPath();
    ctx.arc(manaX, manaY, manaR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${card.cost}`, manaX, manaY);

    // 5. Название карты в шапке
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.name, x + 28, y + 14);

    // 6. Иконка-иллюстрация в центре карты
    this._drawCardGlyph(card, x + w / 2, y + 54);

    // 7. Плашка ключевого свойства (Урон, Щит, Лечение)
    this._drawCardStatPill(card, x + w / 2, y + 84);

    // 8. Текст описания карты
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '9px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    this._drawWrappedText(ctx, card.description, x + w / 2, y + 98, w - 12, 11);

    // Затемнение, если на карту не хватает маны
    if (!opts.isPlayable) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      this._roundRect(ctx, x, y, w, h, 8);
      ctx.fill();
    }

    ctx.restore();
  }

  _drawCardGlyph(card, cx, cy) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '22px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let icon = '⚔️';
    if (card.id === 'strike') icon = '🗡️';
    else if (card.id === 'fireball') icon = '🔥';
    else if (card.id === 'meteor') icon = '☄️';
    else if (card.id === 'quick_slash') icon = '⚡';
    else if (card.id === 'piercing_strike') icon = '🎯';
    else if (card.id === 'block') icon = '🛡️';
    else if (card.id === 'heavy_shield') icon = '🏰';
    else if (card.id === 'mirror_shield') icon = '🪞';
    else if (card.id === 'heal') icon = '💚';
    else if (card.id === 'meditation') icon = '🧘';
    else if (card.id === 'poison_dart') icon = '🧪';
    else if (card.id === 'vampirism') icon = '🩸';
    else if (card.id === 'fury') icon = '💥';
    else if (card.id === 'second_wind') icon = '🪽';

    ctx.fillText(icon, cx, cy);
    ctx.restore();
  }

  _drawCardStatPill(card, cx, cy) {
    const ctx = this.ctx;
    let label = '';
    let pillColor = '#48484a';

    if (card.trueDamage) {
      label = `🗡️ ${card.trueDamage} ЧИСТЫЙ`;
      pillColor = '#bf5af2';
    } else if (card.damage) {
      label = `⚔️ ${card.damage} УРОН`;
      pillColor = '#ff453a';
    } else if (card.shield) {
      label = `🛡️ +${card.shield} ЩИТ`;
      pillColor = '#0a84ff';
    } else if (card.heal) {
      label = `💚 +${card.heal} ХП`;
      pillColor = '#30d158';
    } else if (card.attackBuff) {
      label = `💥 +${card.attackBuff} УРОН`;
      pillColor = '#ff9500';
    } else if (card.conditional) {
      label = `🪽 ХП + ЩИТ`;
      pillColor = '#bf5af2';
    }

    if (!label) return;

    ctx.save();
    ctx.font = 'bold 9px -apple-system, system-ui, sans-serif';
    const textW = ctx.measureText(label).width;
    const pw = textW + 10;
    const ph = 14;

    ctx.fillStyle = pillColor;
    this._roundRect(ctx, cx - pw / 2, cy - ph / 2, pw, ph, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);
    ctx.restore();
  }

  _drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
  }

  _roundRect(ctx, x, y, w, h, radius) {
    if (typeof radius === 'number') {
      radius = [radius, radius, radius, radius];
    }
    const [tl, tr, br, bl] = radius;
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    ctx.lineTo(x + bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
    ctx.lineTo(x, y + tl);
    ctx.quadraticCurveTo(x, y, x + tl, y);
    ctx.closePath();
  }

  // -------------------------------------------------------------------
  // Попадания по координатам (Hit testing)
  // -------------------------------------------------------------------

  getCardIndexAt(clientX, clientY) {
    // Проверяем с конца (верхние карты по Z-индексу)
    for (let i = this.hitboxes.playerHand.length - 1; i >= 0; i--) {
      const box = this.hitboxes.playerHand[i];
      if (
        clientX >= box.x &&
        clientX <= box.x + box.w &&
        clientY >= box.y &&
        clientY <= box.y + box.h
      ) {
        return box.index;
      }
    }
    return -1;
  }

  isOverEndTurn(clientX, clientY) {
    const b = this.hitboxes.endTurnBtn;
    return b && clientX >= b.x && clientX <= b.x + b.w && clientY >= b.y && clientY <= b.y + b.h;
  }

  isOverDeck(clientX, clientY) {
    const b = this.hitboxes.deckPile;
    return b && clientX >= b.x && clientX <= b.x + b.w && clientY >= b.y && clientY <= b.y + b.h;
  }

  isOverDiscard(clientX, clientY) {
    const b = this.hitboxes.discardPile;
    return b && clientX >= b.x && clientX <= b.x + b.w && clientY >= b.y && clientY <= b.y + b.h;
  }
}

export default CanvasRenderer;
