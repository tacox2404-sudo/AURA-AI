// SKILL GAMES (owned by Activities): Hoops (basketball shots) and Darts.
// Each player plays one round whenever they like (live or later), higher score wins.
// Uses the scoreDuel() helper. Everything is plain DOM + requestAnimationFrame.

import { scoreDuel } from './duel.js';

// =====================================================================================
// HOOPS: 10 balls. Swipe the ball up towards the hoop (or tap the hoop side you aim at).
// From ball 4 the hoop starts sliding, and it gets faster. Basket = 2, swish = 3.
// =====================================================================================
function hoopsRound(h, done) {
  const SHOTS = 10;
  let shot = 0, score = 0, flying = false, raf = 0, t0 = performance.now();
  const court = h('div', { class: 'hp-court' });
  const hoop = h('div', { class: 'hp-hoop' }, h('i', { class: 'hp-board' }), h('i', { class: 'hp-rim' }), h('i', { class: 'hp-net' }));
  const ball = h('div', { class: 'hp-ball' }, '🏀');
  const info = h('div', { class: 'hp-info' });
  const flash = h('div', { class: 'hp-flash' });
  court.append(hoop, ball, flash);
  const wrap = h('div', { class: 'mg-col' }, info, court, h('p', { class: 'muted small' }, 'Swipe the ball up towards the hoop. Time it when it moves!'));

  const BALL_Y = 86, HOOP_Y = 18; // % from the top
  let hoopX = 50;
  const speed = () => (shot < 3 ? 0 : 0.6 + (shot - 3) * 0.25); // hoop speed in "swings per second"
  const showInfo = () => { info.textContent = `Ball ${Math.min(shot + 1, SHOTS)}/${SHOTS} · Score ${score}`; };
  const place = (el, x, y, s = 1) => { el.style.left = x + '%'; el.style.top = y + '%'; el.style.transform = `translate(-50%, -50%) scale(${s})`; };

  function tick(now) {
    if (!court.isConnected) return; // panel closed: stop
    const t = (now - t0) / 1000;
    hoopX = 50 + Math.sin(t * Math.PI * speed()) * 30;
    place(hoop, hoopX, HOOP_Y);
    raf = requestAnimationFrame(tick);
  }

  function say(text, good) { flash.textContent = text; flash.className = 'hp-flash show' + (good ? ' good' : ''); setTimeout(() => { flash.className = 'hp-flash'; }, 700); }

  /** Throw towards x (in % of the court width) at the hoop height. */
  function shoot(targetX) {
    if (flying || shot >= SHOTS) return;
    flying = true;
    const start = performance.now(), dur = 650;
    function fly(now) {
      const k = Math.min(1, (now - start) / dur);
      const x = 50 + (targetX - 50) * k;
      const y = BALL_Y + (HOOP_Y - 6 - BALL_Y) * k - Math.sin(k * Math.PI) * 14; // a little arc
      place(ball, x, y, 1 - k * 0.45);
      if (k < 1) return requestAnimationFrame(fly);
      // Landed: how close to the middle of the rim?
      const off = Math.abs(targetX - hoopX);
      if (off < 2.5) { score += 3; say('SWISH! +3', true); }
      else if (off < 7) { score += 2; say('Basket! +2', true); }
      else say(off < 11 ? 'Rim out!' : 'Miss');
      shot++;
      setTimeout(() => {
        flying = false; place(ball, 50, BALL_Y); showInfo();
        if (shot >= SHOTS) { cancelAnimationFrame(raf); done(score); }
      }, 450);
    }
    requestAnimationFrame(fly);
  }

  // Swipe: where the swipe line crosses the hoop height is where the ball goes.
  let from = null;
  court.addEventListener('pointerdown', (e) => { from = { x: e.clientX, y: e.clientY }; court.setPointerCapture(e.pointerId); });
  court.addEventListener('pointerup', (e) => {
    if (!from) return;
    const r = court.getBoundingClientRect();
    const dx = e.clientX - from.x, dy = e.clientY - from.y;
    from = null;
    if (dy < -25) { // a real upward swipe
      const rise = ((BALL_Y - HOOP_Y) / 100) * r.height;
      shoot(Math.max(0, Math.min(100, 50 + ((dx / -dy) * rise / r.width) * 100)));
    } else { // a tap: aim at the tapped spot
      shoot(((e.clientX - r.left) / r.width) * 100);
    }
  });

  place(ball, 50, BALL_Y); showInfo();
  raf = requestAnimationFrame(tick);
  return wrap;
}

// =====================================================================================
// DARTS: 6 darts. The aim wobbles around the board; tap to throw.
// Bullseye 50, then rings 25, 15, 10, 5, 2. Off the board = 0.
// =====================================================================================
const RINGS = [[0.06, 50], [0.14, 25], [0.32, 15], [0.55, 10], [0.8, 5], [1, 2]]; // [radius as part of the board, points]
function dartsRound(h, done) {
  const DARTS = 6;
  let thrown = 0, score = 0, raf = 0, busy = false, t0 = performance.now();
  const board = h('div', { class: 'dt-board' }, ...RINGS.slice().reverse().map(([r], k) => h('i', { class: 'dt-ring r' + k, style: { width: r * 100 + '%', height: r * 100 + '%' } })));
  const aim = h('div', { class: 'dt-aim' });
  const info = h('div', { class: 'hp-info' });
  const flash = h('div', { class: 'hp-flash' });
  const area = h('button', { class: 'dt-area', 'aria-label': 'Throw dart' }, board, aim, flash);
  const wrap = h('div', { class: 'mg-col' }, info, area, h('p', { class: 'muted small' }, 'Tap anywhere to throw when the aim is on the bullseye.'));
  let ax = 0, ay = 0; // aim position, -1..1 (board radius = 1)
  const wob = () => 0.55 + thrown * 0.06; // wobbles a little more each dart
  const showInfo = () => { info.textContent = `Dart ${Math.min(thrown + 1, DARTS)}/${DARTS} · Score ${score}`; };
  const pos = (el, x, y) => { el.style.left = 50 + x * 45 + '%'; el.style.top = 50 + y * 45 + '%'; };

  function tick(now) {
    if (!area.isConnected) return; // panel closed: stop
    const t = (now - t0) / 1000;
    ax = Math.sin(t * 2.1) * wob() * Math.cos(t * 0.7);
    ay = Math.sin(t * 2.9 + 1) * wob() * 0.9;
    pos(aim, ax, ay);
    raf = requestAnimationFrame(tick);
  }
  function say(text, good) { flash.textContent = text; flash.className = 'hp-flash show' + (good ? ' good' : ''); setTimeout(() => { flash.className = 'hp-flash'; }, 700); }

  area.addEventListener('click', () => {
    if (busy || thrown >= DARTS) return;
    busy = true;
    const d = Math.hypot(ax, ay);
    const pts = (RINGS.find(([r]) => d <= r) || [0, 0])[1];
    score += pts; thrown++;
    const dart = h('div', { class: 'dt-dart' }, '🎯'); pos(dart, ax, ay); area.append(dart);
    say(pts === 50 ? 'BULLSEYE! +50' : pts ? `+${pts}` : 'Missed the board', pts >= 25);
    showInfo();
    setTimeout(() => { busy = false; if (thrown >= DARTS) { cancelAnimationFrame(raf); done(score); } }, 550);
  });

  showInfo();
  raf = requestAnimationFrame(tick);
  return wrap;
}

// Bot scores are random but believable.
const between = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const hoopsGame = (api) => scoreDuel(api, { name: 'Hoops', pieces: ['🏀', '🏐'], play: hoopsRound, botScore: () => between(8, 22), rules: '10 balls each. Basket = 2 points, swish = 3. The hoop starts moving at ball 4.' });
export const dartsGame = (api) => scoreDuel(api, { name: 'Darts', pieces: ['🎯', '📍'], play: dartsRound, botScore: () => between(40, 140), rules: '6 darts each. Bullseye = 50 points. Tap to throw while the aim wobbles.' });
