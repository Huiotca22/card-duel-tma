/**
 * particles.js
 * Система визуальных эффектов: частицы, всплывающий урон/лечение и тряска экрана.
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = { x: 0, y: 0, trauma: 0 };
  }

  // Тряска экрана (trauma от 0 до 1)
  addTrauma(amount = 0.5) {
    this.screenShake.trauma = Math.min(1.0, this.screenShake.trauma + amount);
  }

  // Спавн всплывающего текста (урон, лечение, щит, эффекты)
  spawnFloatingText(text, x, y, options = {}) {
    this.floatingTexts.push({
      text,
      x: x + (Math.random() * 20 - 10),
      y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: options.vy || -2.4,
      color: options.color || '#ffffff',
      fontSize: options.fontSize || 22,
      fontWeight: options.fontWeight || 'bold',
      alpha: 1.0,
      life: 1.0,
      decay: options.decay || 0.016,
      scale: options.scale || 1.3
    });
  }

  // Частицы огня / взрыва
  spawnFireBurst(x, y, count = 25) {
    const colors = ['#ff3b30', '#ff9500', '#ffd60a', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        gravity: 0.05
      });
    }
  }

  // Частицы щита / кристаллы
  spawnShieldBurst(x, y, count = 20) {
    const colors = ['#007aff', '#5856d6', '#32ade6', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.025 + Math.random() * 0.02,
        gravity: -0.02
      });
    }
  }

  // Частицы лечения / изумрудные искры
  spawnHealSparkles(x, y, count = 18) {
    const colors = ['#34c759', '#30d158', '#64d2ff', '#ffffff'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 40 - 20),
        y: y + (Math.random() * 20 - 10),
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1.5 - Math.random() * 3,
        size: 2.5 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.015,
        gravity: -0.03
      });
    }
  }

  // Частицы яда / зеленые капли
  spawnPoisonMist(x, y, count = 15) {
    const colors = ['#30d158', '#34c759', '#107c41', '#a8e6cf'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 30 - 15),
        y: y + (Math.random() * 20 - 10),
        vx: (Math.random() - 0.5) * 2,
        vy: -0.8 - Math.random() * 2,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.9,
        decay: 0.018 + Math.random() * 0.015,
        gravity: -0.01
      });
    }
  }

  // Частицы вампиризма / кровавый поток
  spawnVampirismStream(fromX, fromY, toX, toY, count = 15) {
    for (let i = 0; i < count; i++) {
      const progress = i / count;
      const startX = fromX + (Math.random() * 20 - 10);
      const startY = fromY + (Math.random() * 20 - 10);
      const dx = toX - startX;
      const dy = toY - startY;

      this.particles.push({
        x: startX,
        y: startY,
        vx: (dx * 0.04) + (Math.random() - 0.5) * 2,
        vy: (dy * 0.04) + (Math.random() - 0.5) * 2,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.3 ? '#ff2d55' : '#af52de',
        alpha: 1.0,
        decay: 0.02,
        gravity: 0
      });
    }
  }

  // Метеоритный шквал
  spawnMeteorImpact(x, y) {
    this.addTrauma(0.85);
    this.spawnFireBurst(x, y, 45);
    // Дополнительные осколки
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: '#ff9500',
        alpha: 1.0,
        decay: 0.015,
        gravity: 0.15
      });
    }
  }

  update(dt = 1) {
    // 1. Тряска экрана
    if (this.screenShake.trauma > 0) {
      const shakePower = Math.pow(this.screenShake.trauma, 2) * 16;
      this.screenShake.x = (Math.random() * 2 - 1) * shakePower;
      this.screenShake.y = (Math.random() * 2 - 1) * shakePower;
      this.screenShake.trauma = Math.max(0, this.screenShake.trauma - 0.03 * dt);
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
    }

    // 2. Обновление частиц
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Обновление всплывающего текста
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.vy *= 0.95; // замедление
      t.alpha -= t.decay * dt;
      if (t.scale > 1.0) {
        t.scale = Math.max(1.0, t.scale - 0.03 * dt);
      }
      if (t.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    // Рендер частиц
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Рендер всплывающего текста
    ctx.save();
    for (const t of this.floatingTexts) {
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.font = `${t.fontWeight} ${Math.round(t.fontSize * t.scale)}px 'SF Pro Display', -apple-system, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Тень / обводка для контраста
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 4;
      ctx.strokeText(t.text, t.x, t.y);

      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }
}

export default ParticleSystem;
