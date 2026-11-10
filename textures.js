/**
 * textures.js
 * Процедурные текстуры и векторный арт для карточной дуэли TMA.
 * Обеспечивает качественный рендеринг высокого разрешения для всех 14 карт,
 * рубашки колоды, а также аватаров игрока и противника.
 */

// Вспомогательные функции рисования
function _roundRect(ctx, x, y, w, h, r) {
  if (typeof r === 'number') {
    r = [r, r, r, r];
  }
  const [tl, tr, br, bl] = r;
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

function _drawSparkle(ctx, x, y, r, color = '#ffffff') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
}

// -------------------------------------------------------------------
// 14 Процедурных артов для карт дуэли
// Все арты центрируются в координатах (0, 0) с базовым размером ~40x40
// -------------------------------------------------------------------

const ART_DRAWERS = {
  // 1. Удар: сверкающий меч с рубящим рассекающим дуговым следом
  strike(ctx) {
    // Рассекающий дуговой след клинка (светящаяся дуга)
    ctx.save();
    ctx.strokeStyle = 'rgba(100, 210, 255, 0.25)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, 18, -Math.PI * 0.75, Math.PI * 0.25);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 18, -Math.PI * 0.65, Math.PI * 0.15);
    ctx.stroke();
    ctx.restore();

    // Клинок меча по диагонали
    ctx.save();
    ctx.rotate(Math.PI / 4);

    // Теневая половина лезвия
    ctx.fillStyle = '#8da0b8';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(4, 5);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fill();

    // Светлая половина лезвия
    ctx.fillStyle = '#f0f5fc';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-4, 5);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fill();

    // Острие / блик
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, 5);
    ctx.stroke();

    // Гарда (золотая крестовина)
    ctx.fillStyle = '#e6a117';
    ctx.fillRect(-7, 5, 14, 3);
    ctx.fillStyle = '#ffd24d';
    ctx.fillRect(-6, 5, 12, 1.5);

    // Рукоять (кожаная обмотка)
    ctx.fillStyle = '#5c3514';
    ctx.fillRect(-1.8, 8, 3.6, 7);

    // Навершие (золотое яблоко)
    ctx.fillStyle = '#e6a117';
    ctx.beginPath();
    ctx.arc(0, 16, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Искры от удара
    _drawSparkle(ctx, -8, -10, 4, '#ffffff');
    _drawSparkle(ctx, 11, 4, 3, '#70d6ff');
    _drawSparkle(ctx, -14, 8, 2, '#ffd24d');
  },

  // 2. Блок: кованый щит с гербовой крестовиной и защитной аурой
  block(ctx) {
    // Защитный энергетический ореол
    ctx.save();
    const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 20);
    halo.addColorStop(0, 'rgba(10, 132, 255, 0.4)');
    halo.addColorStop(1, 'rgba(10, 132, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    // Внешнее силовое кольцо
    ctx.strokeStyle = 'rgba(100, 210, 255, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Корпус щита (рыцарский фигурный тарч)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-13, -15);
    ctx.lineTo(13, -15);
    ctx.quadraticCurveTo(14, 2, 0, 17);
    ctx.quadraticCurveTo(-14, 2, -13, -15);
    ctx.closePath();

    // Градиент синей эмали
    const shieldGrad = ctx.createLinearGradient(-13, -15, 13, 17);
    shieldGrad.addColorStop(0, '#1a4e9e');
    shieldGrad.addColorStop(0.5, '#0e2f66');
    shieldGrad.addColorStop(1, '#071836');
    ctx.fillStyle = shieldGrad;
    ctx.fill();

    // Стальная кованая кайма
    ctx.strokeStyle = '#c5d7ed';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Золотой крест на щите
    ctx.fillStyle = '#ffd24d';
    ctx.fillRect(-2, -12, 4, 24);
    ctx.fillRect(-9, -6, 18, 4);

    // Центральный круглый умбон
    const bossGrad = ctx.createRadialGradient(-1, -4, 1, 0, -4, 4);
    bossGrad.addColorStop(0, '#ffffff');
    bossGrad.addColorStop(0.4, '#e6a117');
    bossGrad.addColorStop(1, '#8a5c05');
    ctx.fillStyle = bossGrad;
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Заклепки по краю
    ctx.fillStyle = '#ffffff';
    [-10, 0, 10].forEach(bx => {
      ctx.beginPath();
      ctx.arc(bx, -13.5, 0.8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
    _drawSparkle(ctx, 10, -11, 2.5, '#c5d7ed');
  },

  // 3. Лечение: светящаяся склянка с зельем жизни и сердце
  heal(ctx) {
    // Зеленое исцеляющее свечение
    ctx.save();
    const healGlow = ctx.createRadialGradient(0, 2, 4, 0, 2, 19);
    healGlow.addColorStop(0, 'rgba(52, 199, 89, 0.5)');
    healGlow.addColorStop(0.7, 'rgba(52, 199, 89, 0.15)');
    healGlow.addColorStop(1, 'rgba(52, 199, 89, 0)');
    ctx.fillStyle = healGlow;
    ctx.beginPath();
    ctx.arc(0, 2, 19, 0, Math.PI * 2);
    ctx.fill();

    // Стеклянная алхимическая колба
    // Горлышко
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(-3.5, -14, 7, 6);
    // Пробка
    ctx.fillStyle = '#8a5323';
    ctx.fillRect(-4, -17, 8, 3.5);

    // Сферическое тело колбы
    ctx.beginPath();
    ctx.arc(0, 3, 12.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20, 50, 30, 0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(160, 255, 185, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Жидкость внутри (зелье)
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 3, 11, 0, Math.PI * 2);
    ctx.clip();

    const liquidGrad = ctx.createLinearGradient(0, -3, 0, 15);
    liquidGrad.addColorStop(0, '#55f788');
    liquidGrad.addColorStop(0.5, '#28cd56');
    liquidGrad.addColorStop(1, '#0e7029');
    ctx.fillStyle = liquidGrad;
    ctx.fillRect(-13, -2, 26, 18);

    // Пузырьки в зелье
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(-4, 5, 1.5, 0, Math.PI * 2);
    ctx.arc(3, 8, 1.2, 0, Math.PI * 2);
    ctx.arc(4, 2, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Блик стекла
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 3, 9.5, -Math.PI * 0.75, -Math.PI * 0.4);
    ctx.stroke();

    // Сияющее золотое сердце по центру
    ctx.save();
    ctx.translate(0, 3);
    ctx.scale(0.7, 0.7);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.bezierCurveTo(-5, -4, -8, -1, -5, 4);
    ctx.lineTo(0, 8);
    ctx.lineTo(5, 4);
    ctx.bezierCurveTo(8, -1, 5, -4, 0, 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Исцеляющие крестики
    _drawSparkle(ctx, -12, -7, 3, '#62fca0');
    _drawSparkle(ctx, 12, -5, 2.5, '#62fca0');
    _drawSparkle(ctx, 10, 11, 2, '#ffffff');
  },

  // 4. Огненный шар: вихревая сфера пламени с языками огня и искрами
  fireball(ctx) {
    ctx.save();

    // Внешнее тепловое свечение
    const fireGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 20);
    fireGlow.addColorStop(0, 'rgba(255, 220, 50, 0.9)');
    fireGlow.addColorStop(0.35, 'rgba(255, 90, 0, 0.6)');
    fireGlow.addColorStop(0.7, 'rgba(200, 20, 0, 0.3)');
    fireGlow.addColorStop(1, 'rgba(200, 20, 0, 0)');
    ctx.fillStyle = fireGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    // Языки пламени по периметру
    const angles = [0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4];
    ctx.fillStyle = '#ff6b00';
    angles.forEach((ang, i) => {
      ctx.save();
      ctx.rotate(ang + (i % 2 === 0 ? 0.2 : 0));
      ctx.beginPath();
      ctx.moveTo(-4, -10);
      ctx.quadraticCurveTo(0, -18 - (i % 3) * 2, 5, -10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Огненное ядро
    const coreGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 11);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.2, '#fff176');
    coreGrad.addColorStop(0.5, '#ff9100');
    coreGrad.addColorStop(0.85, '#ff3d00');
    coreGrad.addColorStop(1, '#b71c1c');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // Внутренний раскаленный вихрь
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-1, -1, 6, 0.2, Math.PI * 1.2);
    ctx.stroke();

    ctx.restore();

    // Летящие искры
    _drawSparkle(ctx, -14, -12, 2.5, '#ffe082');
    _drawSparkle(ctx, 13, -11, 3, '#ffab40');
    _drawSparkle(ctx, 11, 13, 2, '#ff6e40');
    _drawSparkle(ctx, -12, 10, 2, '#ffffff');
  },

  // 5. Тяжелый щит: массивный башенный щит с шипами и стальными накладками
  heavy_shield(ctx) {
    ctx.save();

    // Темная тень за щитом
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    _roundRect(ctx, -14, -16, 28, 33, 4);
    ctx.fill();

    // Корпус башенного щита
    const baseGrad = ctx.createLinearGradient(-13, -17, 13, 16);
    baseGrad.addColorStop(0, '#434954');
    baseGrad.addColorStop(0.5, '#2b303a');
    baseGrad.addColorStop(1, '#1b1d22');
    ctx.fillStyle = baseGrad;
    _roundRect(ctx, -13, -17, 26, 33, 3);
    ctx.fill();

    // Массивная стальная окантовка
    ctx.strokeStyle = '#8b9bb4';
    ctx.lineWidth = 2.2;
    _roundRect(ctx, -13, -17, 26, 33, 3);
    ctx.stroke();

    // Стальные ребра жесткости (крестовина)
    ctx.fillStyle = '#556073';
    ctx.fillRect(-12, -2, 24, 4);
    ctx.fillRect(-2, -16, 4, 31);

    // Заклепки по углам и ребрам
    ctx.fillStyle = '#d0dbe9';
    [
      [-10, -14], [10, -14],
      [-10, 13], [10, 13],
      [-10, 0], [10, 0],
      [0, -14], [0, 13]
    ].forEach(([rx, ry]) => {
      ctx.beginPath();
      ctx.arc(rx, ry, 1, 0, Math.PI * 2);
      ctx.fill();
    });

    // Центральный острый шип (3D конус)
    // Левая грань (теневая)
    ctx.fillStyle = '#68778f';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -9);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();

    // Правая грань (светлая)
    ctx.fillStyle = '#a9b8cc';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -9);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fill();

    // Нижняя грань
    ctx.fillStyle = '#3f4756';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-3, 4);
    ctx.closePath();
    ctx.fill();

    // Стальной блеск центрального шипа
    _drawSparkle(ctx, 0, -9, 2.5, '#ffffff');

    // Два дополнительных боковых шипа
    [-9, 9].forEach(sx => {
      ctx.fillStyle = '#a9b8cc';
      ctx.beginPath();
      ctx.moveTo(sx, -4);
      ctx.lineTo(sx > 0 ? sx + 3 : sx - 3, -1);
      ctx.lineTo(sx, 2);
      ctx.closePath();
      ctx.fill();
    });

    ctx.restore();
  },

  // 6. Быстрый укол: стремительный кинжал с фантомными шлейфами скорости
  quick_slash(ctx) {
    ctx.save();

    // Линии рассекаемого воздуха / молниеносная скорость
    ctx.strokeStyle = 'rgba(100, 210, 255, 0.4)';
    ctx.lineWidth = 1.2;
    [[-14, -10, -4, -3], [-10, 8, 4, 15], [-16, 2, -2, 7]].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Фантомные призрачные копии кинжала (эффект нечеловеческой скорости)
    [-5, 5].forEach(offset => {
      ctx.save();
      ctx.translate(offset * 0.8, -offset * 0.8);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = 'rgba(100, 210, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(3, 4);
      ctx.lineTo(-3, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Основной кинжал
    ctx.save();
    ctx.rotate(Math.PI / 4);

    // Клинок (изогнутый стилет)
    const bladeGrad = ctx.createLinearGradient(-3, -16, 3, 5);
    bladeGrad.addColorStop(0, '#ffffff');
    bladeGrad.addColorStop(0.3, '#d4e4f7');
    bladeGrad.addColorStop(1, '#8ea1b8');
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(4, -6, 2.5, 4);
    ctx.lineTo(-2.5, 4);
    ctx.quadraticCurveTo(-4, -6, 0, -16);
    ctx.closePath();
    ctx.fill();

    // Острие
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(0, 4);
    ctx.stroke();

    // Изогнутая гарда ассасина
    ctx.fillStyle = '#2f3542';
    ctx.beginPath();
    ctx.moveTo(-6, 4);
    ctx.quadraticCurveTo(0, 2, 6, 4);
    ctx.lineTo(5, 6);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();

    // Темная рукоять
    ctx.fillStyle = '#141820';
    ctx.fillRect(-1.5, 6, 3, 7);

    // Кольцевое навершие
    ctx.strokeStyle = '#8ea1b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 14.5, 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Вспышка на острие
    _drawSparkle(ctx, -10, -10, 4.5, '#ffffff');
    _drawSparkle(ctx, -6, -14, 2.5, '#70d6ff');
    ctx.restore();
  },

  // 7. Отравленный дротик: аэродинамический дротик с каплями яда и токсичным дымом
  poison_dart(ctx) {
    ctx.save();

    // Ядовитый зеленоватый туман
    const poisonMist = ctx.createRadialGradient(8, 8, 2, 8, 8, 16);
    poisonMist.addColorStop(0, 'rgba(57, 255, 20, 0.45)');
    poisonMist.addColorStop(0.6, 'rgba(57, 255, 20, 0.15)');
    poisonMist.addColorStop(1, 'rgba(57, 255, 20, 0)');
    ctx.fillStyle = poisonMist;
    ctx.beginPath();
    ctx.arc(8, 8, 16, 0, Math.PI * 2);
    ctx.fill();

    // Корпус дротика под углом (направлен в правый нижний угол)
    ctx.save();
    ctx.rotate(Math.PI / 4);

    // Хвостовое оперение (фиолетовые перья)
    ctx.fillStyle = '#8e24aa';
    ctx.beginPath();
    ctx.moveTo(-1, -15);
    ctx.lineTo(-5, -11);
    ctx.lineTo(-1, -7);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(1, -15);
    ctx.lineTo(5, -11);
    ctx.lineTo(1, -7);
    ctx.closePath();
    ctx.fill();

    // Древко дротика
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-1, -9, 2, 16);

    // Стальной наконечник
    ctx.fillStyle = '#78909c';
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(2.5, 7);
    ctx.lineTo(-2.5, 7);
    ctx.closePath();
    ctx.fill();

    // Капли стекающего зеленого яда на острие
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(0, 14, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Капли яда, срывающиеся в полете
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(13, 10, 1.5, 0, Math.PI * 2);
    ctx.arc(10, 14, 1.2, 0, Math.PI * 2);
    ctx.arc(7, 16, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Токсичные пузырьки
    _drawSparkle(ctx, 11, 6, 2.5, '#76ff03');
    _drawSparkle(ctx, -5, -4, 2, '#39ff14');

    ctx.restore();
  },

  // 8. Медитация: сакральная руна лотоса и сияющие эфирные кольца маны
  meditation(ctx) {
    ctx.save();

    // Эфирная аура спокойствия
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 19);
    aura.addColorStop(0, 'rgba(100, 180, 255, 0.5)');
    aura.addColorStop(0.5, 'rgba(130, 80, 255, 0.25)');
    aura.addColorStop(1, 'rgba(80, 50, 200, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();

    // Внешнее магическое руническое кольцо
    ctx.strokeStyle = 'rgba(140, 200, 255, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.stroke();

    // Прерывистый рунический орнамент
    ctx.strokeStyle = 'rgba(180, 140, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Центральный алмазный кристалл маны / лотос
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 9);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();

    // Внутренние сапфировые грани
    ctx.fillStyle = '#64b5f6';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(4.5, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-4.5, 0);
    ctx.closePath();
    ctx.fill();

    // Яркое ядро
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Восходящие струи духовной энергии (лепестки)
    ctx.strokeStyle = 'rgba(100, 220, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-11, 4);
    ctx.quadraticCurveTo(-7, -4, 0, -13);
    ctx.quadraticCurveTo(7, -4, 11, 4);
    ctx.stroke();

    ctx.restore();

    _drawSparkle(ctx, 0, -14, 3, '#ffffff');
    _drawSparkle(ctx, -10, -6, 2, '#80d8ff');
    _drawSparkle(ctx, 10, -6, 2, '#80d8ff');
  },

  // 9. Боевой раж: пылающий бронированный кулак берсерка и ударная волна
  fury(ctx) {
    ctx.save();

    // Взрывная ударная волна ярости
    const rageGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 20);
    rageGlow.addColorStop(0, 'rgba(255, 235, 59, 0.8)');
    rageGlow.addColorStop(0.35, 'rgba(255, 87, 34, 0.6)');
    rageGlow.addColorStop(0.7, 'rgba(213, 0, 0, 0.3)');
    rageGlow.addColorStop(1, 'rgba(213, 0, 0, 0)');
    ctx.fillStyle = rageGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    // Огненные вихри вокруг кулака
    ctx.strokeStyle = '#ff3d00';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 16, -Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();

    // Бронированный кулак (вид спереди / чуть сбоку)
    ctx.save();
    ctx.rotate(-Math.PI * 0.1);

    // Предплечье / наруч
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(-12, 2, 9, 12);
    ctx.fillStyle = '#bf360c';
    ctx.fillRect(-12, 4, 9, 3);

    // Основа кулака
    const fistGrad = ctx.createLinearGradient(-5, -6, 11, 8);
    fistGrad.addColorStop(0, '#ffd54f');
    fistGrad.addColorStop(0.5, '#ff6f00');
    fistGrad.addColorStop(1, '#bf360c');
    ctx.fillStyle = fistGrad;
    _roundRect(ctx, -5, -7, 16, 15, 3.5);
    ctx.fill();

    // 4 сжатых пальца с шипами на кастете
    [-4, -0.5, 3, 6.5].forEach(fy => {
      ctx.fillStyle = '#ffe082';
      _roundRect(ctx, 6, fy, 6, 2.8, 1);
      ctx.fill();
      // Стальной шип на каждом суставе
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(12, fy + 0.4);
      ctx.lineTo(15, fy + 1.4);
      ctx.lineTo(12, fy + 2.4);
      ctx.closePath();
      ctx.fill();
    });

    // Большой палец поверх пальцев
    ctx.fillStyle = '#ff8f00';
    _roundRect(ctx, 2, 3, 5, 6, 1.5);
    ctx.fill();

    ctx.restore();

    // Искры ярости
    _drawSparkle(ctx, 13, -8, 3.5, '#ffffff');
    _drawSparkle(ctx, -11, -11, 2.5, '#ffeb3b');
    _drawSparkle(ctx, -8, 13, 2, '#ff5722');
    _drawSparkle(ctx, 14, 11, 2, '#ffeb3b');

    ctx.restore();
  },

  // 10. Вампиризм: кровавая летучая мышь с хищными клыками и рубиновыми глазами
  vampirism(ctx) {
    ctx.save();

    // Кроваво-багровый фон
    const bloodAura = ctx.createRadialGradient(0, -2, 2, 0, -2, 19);
    bloodAura.addColorStop(0, 'rgba(213, 0, 0, 0.55)');
    bloodAura.addColorStop(0.6, 'rgba(136, 14, 79, 0.25)');
    bloodAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bloodAura;
    ctx.beginPath();
    ctx.arc(0, -2, 19, 0, Math.PI * 2);
    ctx.fill();

    // Силуэт распахнутых крыльев летучей мыши
    ctx.fillStyle = '#1a0006';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    // Левое крыло
    ctx.quadraticCurveTo(-8, -17, -18, -10);
    ctx.quadraticCurveTo(-14, -3, -13, 3);
    ctx.quadraticCurveTo(-8, 0, -4, 4);
    // Правое крыло
    ctx.lineTo(0, -3);
    ctx.lineTo(4, 4);
    ctx.quadraticCurveTo(8, 0, 13, 3);
    ctx.quadraticCurveTo(14, -3, 18, -10);
    ctx.quadraticCurveTo(8, -17, 0, -8);
    ctx.closePath();
    ctx.fill();

    // Алая кайма крыльев
    ctx.strokeStyle = '#d50000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Ушки летучей мыши
    ctx.fillStyle = '#2d000a';
    ctx.beginPath();
    ctx.moveTo(-3, -7);
    ctx.lineTo(-4, -13);
    ctx.lineTo(-1, -8);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(3, -7);
    ctx.lineTo(4, -13);
    ctx.lineTo(1, -8);
    ctx.closePath();
    ctx.fill();

    // Горящие рубиновые глаза
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(-2.2, -6, 1.2, 0, Math.PI * 2);
    ctx.arc(2.2, -6, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Хищные острые клыки внизу
    ctx.fillStyle = '#ffffff';
    // Левый клык
    ctx.beginPath();
    ctx.moveTo(-4, 4);
    ctx.lineTo(-3, 12);
    ctx.lineTo(-1.5, 4);
    ctx.closePath();
    ctx.fill();
    // Правый клык
    ctx.beginPath();
    ctx.moveTo(1.5, 4);
    ctx.lineTo(3, 12);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();

    // Стекающая капля крови
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(-3, 14, 1.2, 0, Math.PI * 2);
    ctx.arc(3, 13, 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    _drawSparkle(ctx, -14, -9, 2, '#ff5252');
    _drawSparkle(ctx, 14, -9, 2, '#ff5252');
  },

  // 11. Бронебойный выпад: тяжелое копье, пробивающее стальной щит с осколками
  piercing_strike(ctx) {
    ctx.save();

    // Ударные конические кольца (пробитие звукового барьера)
    ctx.strokeStyle = 'rgba(191, 90, 242, 0.4)';
    ctx.lineWidth = 1.2;
    [-6, 2, 10].forEach(d => {
      ctx.beginPath();
      ctx.ellipse(d, 0, 4 + Math.abs(d) * 0.4, 9 + Math.abs(d) * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Расколотая стальная преграда
    ctx.fillStyle = '#424854';
    ctx.beginPath();
    ctx.moveTo(6, -15);
    ctx.lineTo(13, -15);
    ctx.lineTo(9, -2);
    ctx.lineTo(14, 14);
    ctx.lineTo(7, 14);
    ctx.lineTo(4, 2);
    ctx.closePath();
    ctx.fill();

    // Разлетающиеся осколки металла
    ctx.fillStyle = '#c5d0e0';
    [[12, -7], [15, -1], [13, 8], [9, -10]].forEach(([ox, oy]) => {
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + 2.5, oy - 1);
      ctx.lineTo(ox + 1.5, oy + 2);
      ctx.closePath();
      ctx.fill();
    });

    // Бронебойное копье / пика (направлено вправо)
    // Древко
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-18, -1.8, 22, 3.6);

    // Массивный граненый наконечник
    // Верхняя светлая грань
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(17, 0);
    ctx.lineTo(4, -4);
    ctx.closePath();
    ctx.fill();

    // Нижняя теневая грань
    ctx.fillStyle = '#8ea1b8';
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(17, 0);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();

    // Фиолетовая плазма вокруг острия (чистый урон)
    ctx.strokeStyle = '#e040fb';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(16, 0, 3.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    _drawSparkle(ctx, 17, 0, 4.5, '#ffffff');
    _drawSparkle(ctx, 7, -6, 2, '#e040fb');
  },

  // 12. Зеркальный щит: призматическое зеркало с радужными переливами и отражением
  mirror_shield(ctx) {
    ctx.save();

    // Ореол радужного призматического преломления
    const prismGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 19);
    prismGlow.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    prismGlow.addColorStop(0.3, 'rgba(100, 210, 255, 0.4)');
    prismGlow.addColorStop(0.6, 'rgba(230, 130, 255, 0.3)');
    prismGlow.addColorStop(1, 'rgba(0, 122, 255, 0)');
    ctx.fillStyle = prismGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();

    // Серебряная барочная оправа щита
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#c5d5e8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Внутреннее зеркальное полотно
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);

    // Радужный градиент зеркальной поверхности
    const mirrorGrad = ctx.createLinearGradient(-10, -10, 10, 10);
    mirrorGrad.addColorStop(0, '#e1bee7');
    mirrorGrad.addColorStop(0.25, '#bbdefb');
    mirrorGrad.addColorStop(0.5, '#b2dfdb');
    mirrorGrad.addColorStop(0.75, '#fff9c4');
    mirrorGrad.addColorStop(1, '#ffcdd2');
    ctx.fillStyle = mirrorGrad;
    ctx.fill();

    // Отраженный луч света (рикошет обратно во врага)
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, 10);
    ctx.lineTo(0, -2);
    ctx.lineTo(12, -12);
    ctx.stroke();

    ctx.restore();

    // Декоративные жемчужины на оправе
    ctx.fillStyle = '#ffffff';
    [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].forEach(ang => {
      const jx = Math.cos(ang) * 14;
      const jy = Math.sin(ang) * 14;
      ctx.beginPath();
      ctx.arc(jx, jy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    // Яркие зеркальные блики
    _drawSparkle(ctx, 0, -2, 4.5, '#ffffff');
    _drawSparkle(ctx, -7, -7, 2.5, '#ffffff');
    _drawSparkle(ctx, 8, 8, 2.5, '#ffffff');
  },

  // 13. Второе дыхание: сияющий феникс возрождения с золотыми лучами
  second_wind(ctx) {
    ctx.save();

    // Божественное золотое сияние
    const sunGlow = ctx.createRadialGradient(0, 0, 3, 0, 0, 19);
    sunGlow.addColorStop(0, 'rgba(255, 235, 59, 0.85)');
    sunGlow.addColorStop(0.4, 'rgba(255, 179, 0, 0.45)');
    sunGlow.addColorStop(0.8, 'rgba(255, 111, 0, 0.2)');
    sunGlow.addColorStop(1, 'rgba(255, 111, 0, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();

    // Золотые лучи рассвета
    ctx.strokeStyle = 'rgba(255, 241, 118, 0.45)';
    ctx.lineWidth = 1;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
      ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18);
      ctx.stroke();
    }

    // Силуэт возрождающегося феникса
    ctx.fillStyle = '#ffffff';
    // Голова и корона
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(2, -9);
    ctx.lineTo(-2, -9);
    ctx.closePath();
    ctx.fill();

    // Распахнутые к небу крылья феникса
    const wingGrad = ctx.createLinearGradient(0, -14, 0, 12);
    wingGrad.addColorStop(0, '#ffffff');
    wingGrad.addColorStop(0.3, '#ffe082');
    wingGrad.addColorStop(0.7, '#ffb300');
    wingGrad.addColorStop(1, '#ff6f00');
    ctx.fillStyle = wingGrad;

    ctx.beginPath();
    // Левое крыло
    ctx.moveTo(0, -7);
    ctx.quadraticCurveTo(-9, -16, -17, -9);
    ctx.quadraticCurveTo(-12, -1, -8, 5);
    ctx.lineTo(0, 0);
    // Правое крыло
    ctx.lineTo(8, 5);
    ctx.quadraticCurveTo(12, -1, 17, -9);
    ctx.quadraticCurveTo(9, -16, 0, -7);
    ctx.closePath();
    ctx.fill();

    // Хвост феникса (струящееся золотое пламя)
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath();
    ctx.moveTo(-3, 4);
    ctx.quadraticCurveTo(-5, 11, 0, 16);
    ctx.quadraticCurveTo(5, 11, 3, 4);
    ctx.closePath();
    ctx.fill();

    // Горящее сердце феникса
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    _drawSparkle(ctx, 0, -14, 3.5, '#ffffff');
    _drawSparkle(ctx, -14, -8, 2.5, '#fff59d');
    _drawSparkle(ctx, 14, -8, 2.5, '#fff59d');
    _drawSparkle(ctx, 0, 16, 2, '#ffb300');
  },

  // 14. Метеорит: пылающий космический астероид с дымным огненным хвостом
  meteor(ctx) {
    ctx.save();

    // Длинный дымно-огненный шлейф (от правого верхнего угла к левому нижнему)
    const tailGrad = ctx.createLinearGradient(16, -16, -4, 4);
    tailGrad.addColorStop(0, 'rgba(255, 61, 0, 0)');
    tailGrad.addColorStop(0.4, 'rgba(255, 109, 0, 0.45)');
    tailGrad.addColorStop(0.7, 'rgba(255, 193, 7, 0.8)');
    tailGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.lineTo(18, -17);
    ctx.lineTo(16, -13);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();

    // Огненные вихри в хвосте
    ctx.strokeStyle = '#ff6d00';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(17, -15);
    ctx.quadraticCurveTo(8, -6, 1, 1);
    ctx.stroke();

    // Каменное тело метеорита (астероид)
    ctx.save();
    ctx.translate(-4, 4);

    // Раскаленный каменный корпус с кратерами
    ctx.fillStyle = '#261c14';
    ctx.beginPath();
    ctx.moveTo(-9, -2);
    ctx.lineTo(-6, -8);
    ctx.lineTo(2, -7);
    ctx.lineTo(7, -1);
    ctx.lineTo(5, 6);
    ctx.lineTo(-3, 8);
    ctx.lineTo(-8, 5);
    ctx.closePath();
    ctx.fill();

    // Огненная ударная волна на передней кромке
    ctx.strokeStyle = '#ff3d00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, Math.PI * 0.4, Math.PI * 1.15);
    ctx.stroke();

    // Лавовые трещины в камне
    ctx.strokeStyle = '#ffab00';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(-1, 0);
    ctx.lineTo(3, 4);
    ctx.moveTo(-1, 0);
    ctx.lineTo(-2, 5);
    ctx.stroke();

    // Раскаленные кратеры
    ctx.fillStyle = '#ff6d00';
    ctx.beginPath();
    ctx.arc(-4, 3, 1.8, 0, Math.PI * 2);
    ctx.arc(1, -2, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Искры и осколки
    _drawSparkle(ctx, -13, 3, 3, '#ffffff');
    _drawSparkle(ctx, -8, 12, 2.5, '#ff9100');
    _drawSparkle(ctx, 11, -8, 2, '#ffab00');
    _drawSparkle(ctx, 15, -13, 2, '#ffffff');

    ctx.restore();
  }
};

// -------------------------------------------------------------------
// Экспортные функции рендеринга
// -------------------------------------------------------------------

/**
 * Отрисовка арта карты
 * @param {CanvasRenderingContext2D} ctx Контекст Canvas
 * @param {string} cardId ID карты (strike, fireball, etc.)
 * @param {number} cx Центр X
 * @param {number} cy Центр Y
 * @param {number} size Желаемый габаритный размер арта в пикселях
 */
export function drawCardArt(ctx, cardId, cx, cy, size = 38) {
  const drawer = ART_DRAWERS[cardId] || ART_DRAWERS.strike;
  ctx.save();
  ctx.translate(cx, cy);
  const scale = size / 40;
  ctx.scale(scale, scale);
  drawer(ctx);
  ctx.restore();
}

/**
 * Отрисовка детализированной рубашки карты
 * @param {CanvasRenderingContext2D} ctx Контекст Canvas
 * @param {number} x Координата левого верхнего угла
 * @param {number} y Координата левого верхнего угла
 * @param {number} w Ширина карты
 * @param {number} h Высота карты
 */
export function drawCardBack(ctx, x, y, w, h) {
  ctx.save();

  // 1. Корпус карты (глубокий темный сапфир)
  const bgGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  bgGrad.addColorStop(0, '#151b2d');
  bgGrad.addColorStop(0.5, '#0b0f1a');
  bgGrad.addColorStop(1, '#06080e');
  ctx.fillStyle = bgGrad;
  _roundRect(ctx, x, y, w, h, 6);
  ctx.fill();

  // 2. Внешняя золотая филигранная рамка
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.4;
  _roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 5);
  ctx.stroke();

  // Внутренняя тонкая золотая линия
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 0.8;
  _roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 4);
  ctx.stroke();

  // 3. Геометрический ромбовидный узор
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rw = (w - 14) / 2;
  const rh = (h - 16) / 2;

  ctx.strokeStyle = 'rgba(78, 110, 180, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - rh);
  ctx.lineTo(cx + rw, cy);
  ctx.lineTo(cx, cy + rh);
  ctx.lineTo(cx - rw, cy);
  ctx.closePath();
  ctx.stroke();

  // 4. Центральный магический медальон
  const medR = Math.min(w, h) * 0.22;

  // Ореол
  const halo = ctx.createRadialGradient(cx, cy, 1, cx, cy, medR + 6);
  halo.addColorStop(0, 'rgba(0, 180, 255, 0.3)');
  halo.addColorStop(1, 'rgba(0, 180, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, medR + 6, 0, Math.PI * 2);
  ctx.fill();

  // Золотое кольцо медальона
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, medR, 0, Math.PI * 2);
  ctx.stroke();

  // Сапфировый кристалл в центре (8-конечная звезда)
  ctx.fillStyle = '#0a84ff';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? medR * 0.75 : medR * 0.35;
    const px = cx + Math.cos(ang) * r;
    const py = cy + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Белая искра в сердцевине
  _drawSparkle(ctx, cx, cy, medR * 0.4, '#ffffff');

  // Угловые золотые уголки
  const corners = [
    [x + 6, y + 6],
    [x + w - 6, y + 6],
    [x + w - 6, y + h - 6],
    [x + 6, y + h - 6]
  ];
  ctx.fillStyle = '#d4af37';
  corners.forEach(([kx, ky]) => {
    ctx.beginPath();
    ctx.arc(kx, ky, 1.2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

/**
 * Отрисовка аватара игрока (благородный рыцарь-герой в шлеме с синим забралом)
 * @param {CanvasRenderingContext2D} ctx Контекст Canvas
 * @param {number} cx Центр X
 * @param {number} cy Центр Y
 * @param {number} radius Радиус аватара
 */
export function drawPlayerAvatar(ctx, cx, cy, radius = 20) {
  ctx.save();

  // Ограничивающий круг аватара
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  // Фон портрета (благородный синий градиент)
  const bg = ctx.createRadialGradient(cx, cy - radius * 0.2, 2, cx, cy, radius);
  bg.addColorStop(0, '#1a365d');
  bg.addColorStop(0.7, '#0f172a');
  bg.addColorStop(1, '#020617');
  ctx.fillStyle = bg;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  // Масштабирование пропорций персонажа
  const s = radius / 20;

  // Наплечники рыцаря (полированная сталь)
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18 * s, 16 * s, 10 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Золотые наплечные канты
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.2 * s;
  ctx.stroke();

  // Рыцарский шлем (арматура)
  // Купол шлема
  const helmGrad = ctx.createLinearGradient(cx - 10 * s, cy - 10 * s, cx + 10 * s, cy + 5 * s);
  helmGrad.addColorStop(0, '#e2e8f0');
  helmGrad.addColorStop(0.5, '#94a3b8');
  helmGrad.addColorStop(1, '#475569');
  ctx.fillStyle = helmGrad;

  ctx.beginPath();
  ctx.arc(cx, cy - 2 * s, 10 * s, Math.PI, 0);
  ctx.lineTo(cx + 8 * s, cy + 8 * s);
  ctx.lineTo(cx, cy + 12 * s);
  ctx.lineTo(cx - 8 * s, cy + 8 * s);
  ctx.closePath();
  ctx.fill();

  // Золотой гребень шлема
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.moveTo(cx - 1.5 * s, cy - 12 * s);
  ctx.lineTo(cx + 1.5 * s, cy - 12 * s);
  ctx.lineTo(cx + 1 * s, cy - 1 * s);
  ctx.lineTo(cx - 1 * s, cy - 1 * s);
  ctx.closePath();
  ctx.fill();

  // Забрало с сияющей неоновой синей щелью для глаз
  ctx.fillStyle = '#090d16';
  _roundRect(ctx, cx - 6 * s, cy - 1 * s, 12 * s, 3.2 * s, 1 * s);
  ctx.fill();

  // Горящий синий взор
  ctx.fillStyle = '#38bdf8';
  _drawSparkle(ctx, cx - 3 * s, cy + 0.6 * s, 1.8 * s, '#38bdf8');
  _drawSparkle(ctx, cx + 3 * s, cy + 0.6 * s, 1.8 * s, '#38bdf8');

  ctx.restore();

  // Золотой обод аватара
  ctx.save();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Отрисовка аватара противника (темный владыка в капюшоне с пылающими алыми глазами)
 * @param {CanvasRenderingContext2D} ctx Контекст Canvas
 * @param {number} cx Центр X
 * @param {number} cy Центр Y
 * @param {number} radius Радиус аватара
 */
export function drawOpponentAvatar(ctx, cx, cy, radius = 20) {
  ctx.save();

  // Ограничивающий круг аватара
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  // Фон портрета (мрачный багрово-пепельный градиент)
  const bg = ctx.createRadialGradient(cx, cy - radius * 0.2, 2, cx, cy, radius);
  bg.addColorStop(0, '#3f0d12');
  bg.addColorStop(0.6, '#1a0507');
  bg.addColorStop(1, '#000000');
  ctx.fillStyle = bg;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  const s = radius / 20;

  // Шипастые темные наплечники
  ctx.fillStyle = '#170f1a';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18 * s, 17 * s, 10 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Темный капюшон чернокнижника
  ctx.fillStyle = '#120b17';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 13 * s);
  ctx.quadraticCurveTo(cx + 12 * s, cy - 7 * s, cx + 9 * s, cy + 9 * s);
  ctx.lineTo(cx - 9 * s, cy + 9 * s);
  ctx.quadraticCurveTo(cx - 12 * s, cy - 7 * s, cx, cy - 13 * s);
  ctx.closePath();
  ctx.fill();

  // Тень под капюшоном
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(cx, cy + 1 * s, 7 * s, 0, Math.PI * 2);
  ctx.fill();

  // Рога черного шлема
  ctx.fillStyle = '#2c1820';
  [-1, 1].forEach(dir => {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 6 * s, cy - 6 * s);
    ctx.quadraticCurveTo(cx + dir * 12 * s, cy - 12 * s, cx + dir * 10 * s, cy - 15 * s);
    ctx.quadraticCurveTo(cx + dir * 8 * s, cy - 10 * s, cx + dir * 3 * s, cy - 8 * s);
    ctx.closePath();
    ctx.fill();
  });

  // Пылающие демонические алые глаза
  ctx.fillStyle = '#ff1744';
  ctx.beginPath();
  ctx.ellipse(cx - 3.2 * s, cy + 0.5 * s, 2 * s, 1.2 * s, -0.2, 0, Math.PI * 2);
  ctx.ellipse(cx + 3.2 * s, cy + 0.5 * s, 2 * s, 1.2 * s, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Золотисто-красный блик в глазах
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath();
  ctx.arc(cx - 3.2 * s, cy + 0.5 * s, 0.7 * s, 0, Math.PI * 2);
  ctx.arc(cx + 3.2 * s, cy + 0.5 * s, 0.7 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Багровая окантовка аватара
  ctx.save();
  ctx.strokeStyle = '#ff3b30';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Реестр всех карт и их свойств
export const CARD_TEXTURES = {
  strike: { id: 'strike', name: 'Удар' },
  block: { id: 'block', name: 'Блок' },
  heal: { id: 'heal', name: 'Лечение' },
  fireball: { id: 'fireball', name: 'Огненный шар' },
  heavy_shield: { id: 'heavy_shield', name: 'Тяжелый щит' },
  quick_slash: { id: 'quick_slash', name: 'Быстрый укол' },
  poison_dart: { id: 'poison_dart', name: 'Отравленный дротик' },
  meditation: { id: 'meditation', name: 'Медитация' },
  fury: { id: 'fury', name: 'Боевой раж' },
  vampirism: { id: 'vampirism', name: 'Вампиризм' },
  piercing_strike: { id: 'piercing_strike', name: 'Бронебойный выпад' },
  mirror_shield: { id: 'mirror_shield', name: 'Зеркальный щит' },
  second_wind: { id: 'second_wind', name: 'Второе дыхание' },
  meteor: { id: 'meteor', name: 'Метеорит' }
};

// Экспорт глобально для совместимости с любыми видами сборщиков / script-тегов
if (typeof window !== 'undefined') {
  window.CardTextures = {
    drawCardArt,
    drawCardBack,
    drawPlayerAvatar,
    drawOpponentAvatar,
    CARD_TEXTURES
  };
}
