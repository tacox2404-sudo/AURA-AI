// BOARD GAMES PACK (owned by Activities): Checkers, Dots & Boxes, Mancala, Flip (Reversi)
// and Sea Battle. All use the duel() helper, so they play live or turn by turn,
// with Rematch and a practice bot. Classic public-domain games with our own look.

import { duel } from './duel.js';

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const inB = (x, y, n = 8) => x >= 0 && x < n && y >= 0 && y < n;

// =====================================================================================
// CHECKERS: 8x8, seat 1 (red) starts at the bottom and moves up. Jumps are compulsory,
// multi-jumps continue with the same piece, reaching the far row makes a king (👑).
// Squares hold null, or { s: seat, k: isKing }.
// =====================================================================================
function ckSetup() {
  const b = Array(64).fill(null);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2) {
    if (y < 3) b[y * 8 + x] = { s: 1, k: false };
    if (y > 4) b[y * 8 + x] = { s: 0, k: false };
  }
  return { b, chain: null, last: null }; // chain = square of a piece that must keep jumping
}
function ckPieceMoves(b, i) {
  const p = b[i]; if (!p) return [];
  const x = i % 8, y = Math.floor(i / 8);
  const dirs = p.k ? [-1, 1] : [p.s === 0 ? -1 : 1];
  const steps = [], jumps = [];
  for (const dy of dirs) for (const dx of [-1, 1]) {
    if (!inB(x + dx, y + dy)) continue;
    const n = (y + dy) * 8 + x + dx;
    if (!b[n]) steps.push({ f: i, t: n });
    else if (b[n].s !== p.s && inB(x + 2 * dx, y + 2 * dy) && !b[(y + 2 * dy) * 8 + x + 2 * dx]) jumps.push({ f: i, t: (y + 2 * dy) * 8 + x + 2 * dx, over: n });
  }
  return { steps, jumps };
}
/** All allowed moves for a seat (if any jump exists, only jumps are allowed). */
function ckMoves(g, seat) {
  const from = g.chain != null ? [g.chain] : g.b.map((p, i) => (p && p.s === seat ? i : -1)).filter((i) => i >= 0);
  const all = from.map((i) => ckPieceMoves(g.b, i));
  const jumps = all.flatMap((m) => m.jumps || []);
  if (jumps.length || g.chain != null) return jumps;
  return all.flatMap((m) => m.steps || []);
}
function ckMove(g, m, seat) {
  const real = ckMoves(g, seat).find((x) => x.f === m.f && x.t === m.t);
  if (!real) return null;
  const b = [...g.b];
  const p = { ...b[real.f] };
  b[real.f] = null;
  if (real.over != null) b[real.over] = null;
  const row = Math.floor(real.t / 8);
  const crowned = !p.k && ((p.s === 0 && row === 0) || (p.s === 1 && row === 7));
  if (crowned) p.k = true;
  b[real.t] = p;
  let ng = { b, chain: null, last: [real.f, real.t] };
  // Keep jumping with the same piece if it can (and wasn't just crowned)
  if (real.over != null && !crowned && ckPieceMoves(b, real.t).jumps.length) return { g: { ...ng, chain: real.t }, turn: seat, note: 'Jump again!' };
  const o = 1 - seat;
  if (!ckMoves(ng, o).length) return { g: ng, win: seat };
  return { g: ng };
}
function ckBot(g, seat) {
  const ms = ckMoves(g, seat);
  // prefer moves that crown a king, then any
  return ms.find((m) => (seat === 1 ? Math.floor(m.t / 8) === 7 : Math.floor(m.t / 8) === 0) && !g.b[m.f].k) || rnd(ms);
}
function ckRender({ g, seat, myTurn, move, ui, redraw, h, toast }) {
  const flip = seat === 1;
  const mine = seat ?? -1;
  const legal = myTurn ? ckMoves(g, mine) : [];
  const sel = g.chain != null && myTurn ? g.chain : ui.sel;
  const targets = new Set(legal.filter((m) => m.f === sel).map((m) => m.t));
  const movable = new Set(legal.map((m) => m.f));
  const last = new Set(g.last || []);
  function tap(i) {
    if (!myTurn) return move({ f: -1, t: -1 });
    if (sel != null && targets.has(i)) return move({ f: sel, t: i });
    if (movable.has(i)) { ui.sel = i; return redraw(); }
    if (g.b[i]?.s === mine && legal.length) toast(legal.some((m) => m.over != null) ? 'You must jump!' : 'That piece cannot move');
  }
  const cells = [];
  for (let k = 0; k < 64; k++) {
    const i = flip ? 63 - k : k;
    const x = i % 8, y = Math.floor(i / 8), p = g.b[i];
    cells.push(h('button', { class: 'ck-sq ' + ((x + y) % 2 ? 'dark' : 'light') + (sel === i ? ' sel' : '') + (last.has(i) ? ' last' : '') + (targets.has(i) ? ' dot' : '') + (movable.has(i) && sel == null ? ' can' : ''), onclick: () => tap(i) },
      p ? h('span', { class: 'ck-pc ' + (p.s === 0 ? 'red' : 'black') }, p.k ? '👑' : '') : null));
  }
  return h('div', { class: 'ck-board' }, ...cells);
}

// =====================================================================================
// DOTS & BOXES: 4x4 boxes. Draw a line between two dots; close a box to claim it and
// go again. Most boxes wins. Lines are keys like "h-2-1" (row 2, column 1).
// =====================================================================================
const DB = 4;
const dbSetup = () => ({ lines: {}, boxes: Array(DB * DB).fill(null), last: null });
const boxSides = (x, y) => [`h-${y}-${x}`, `h-${y + 1}-${x}`, `v-${y}-${x}`, `v-${y}-${x + 1}`];
const boxesOfLine = (key) => {
  const [t, a, b] = key.split('-'); const r = +a, c = +b;
  const out = t === 'h' ? [[c, r - 1], [c, r]] : [[c - 1, r], [c, r]];
  return out.filter(([x, y]) => x >= 0 && y >= 0 && x < DB && y < DB);
};
const allLines = () => { const o = []; for (let y = 0; y <= DB; y++) for (let x = 0; x < DB; x++) o.push(`h-${y}-${x}`); for (let y = 0; y < DB; y++) for (let x = 0; x <= DB; x++) o.push(`v-${y}-${x}`); return o; };
function dbMove(g, key, seat) {
  if (typeof key !== 'string' || g.lines[key] != null || !allLines().includes(key)) return null;
  const lines = { ...g.lines, [key]: seat };
  const boxes = [...g.boxes];
  let closed = 0;
  for (const [x, y] of boxesOfLine(key)) if (boxSides(x, y).every((s) => lines[s] != null)) { boxes[y * DB + x] = seat; closed++; }
  const ng = { lines, boxes, last: key };
  if (Object.keys(lines).length === allLines().length) {
    const a = boxes.filter((v) => v === 0).length, b = boxes.filter((v) => v === 1).length;
    return a === b ? { g: ng, draw: true } : { g: ng, win: a > b ? 0 : 1 };
  }
  return closed ? { g: ng, turn: seat, note: 'Box! Go again' } : { g: ng };
}
function dbBot(g) {
  const free = allLines().filter((k) => g.lines[k] == null);
  const sidesDone = (x, y, lines) => boxSides(x, y).filter((s) => lines[s] != null).length;
  const closes = free.find((k) => boxesOfLine(k).some(([x, y]) => sidesDone(x, y, g.lines) === 3));
  if (closes) return closes;
  const safe = free.filter((k) => boxesOfLine(k).every(([x, y]) => sidesDone(x, y, g.lines) < 2));
  return rnd(safe.length ? safe : free);
}
function dbRender({ g, move, h }) {
  const kids = [];
  const n = DB * 2 + 1;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (r % 2 === 0 && c % 2 === 0) kids.push(h('i', { class: 'db-dot' }));
    else if (r % 2 === 0) { const k = `h-${r / 2}-${(c - 1) / 2}`; kids.push(h('button', { class: 'db-line h' + (g.lines[k] != null ? ` p${g.lines[k]}` : '') + (g.last === k ? ' last' : ''), onclick: () => move(k), 'aria-label': 'line' })); }
    else if (c % 2 === 0) { const k = `v-${(r - 1) / 2}-${c / 2}`; kids.push(h('button', { class: 'db-line v' + (g.lines[k] != null ? ` p${g.lines[k]}` : '') + (g.last === k ? ' last' : ''), onclick: () => move(k), 'aria-label': 'line' })); }
    else { const v = g.boxes[((r - 1) / 2) * DB + (c - 1) / 2]; kids.push(h('div', { class: 'db-box' + (v != null ? ` p${v}` : '') }, v === 0 ? '💗' : v === 1 ? '💙' : '')); }
  }
  const a = g.boxes.filter((v) => v === 0).length, b = g.boxes.filter((v) => v === 1).length;
  return h('div', { class: 'mg-col' }, h('div', { class: 'pill' }, `💗 ${a}  ·  💙 ${b}`), h('div', { class: 'db-board' }, ...kids));
}

// =====================================================================================
// MANCALA (Kalah rules): 6 pits each + a store. Pick a pit, seeds are sown one by one
// anticlockwise. Last seed in your store = go again. Last seed in your empty pit =
// capture the seeds across. When one side is empty, the game ends; most seeds wins.
// pits: 0-5 seat 1, 6 = store 1, 7-12 seat 2, 13 = store 2.
// =====================================================================================
const mcSetup = () => ({ pits: [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0], last: null });
const myPits = (seat) => (seat === 0 ? [0, 1, 2, 3, 4, 5] : [7, 8, 9, 10, 11, 12]);
const storeOf = (seat) => (seat === 0 ? 6 : 13);
function mcMove(g, i, seat) {
  if (!myPits(seat).includes(i) || !g.pits[i]) return null;
  const p = [...g.pits];
  let seeds = p[i]; p[i] = 0;
  let at = i;
  while (seeds) { at = (at + 1) % 14; if (at === storeOf(1 - seat)) continue; p[at]++; seeds--; }
  let note = '';
  if (myPits(seat).includes(at) && p[at] === 1 && p[12 - at] > 0) { p[storeOf(seat)] += p[12 - at] + 1; p[12 - at] = 0; p[at] = 0; note = 'Capture!'; }
  const ng = { pits: p, last: i };
  const sideEmpty = (s) => myPits(s).every((k) => !p[k]);
  if (sideEmpty(0) || sideEmpty(1)) {
    for (const s of [0, 1]) for (const k of myPits(s)) { p[storeOf(s)] += p[k]; p[k] = 0; }
    return p[6] === p[13] ? { g: ng, draw: true } : { g: ng, win: p[6] > p[13] ? 0 : 1 };
  }
  if (at === storeOf(seat)) return { g: ng, turn: seat, note: 'Go again!' };
  return { g: ng, note };
}
function mcBot(g, seat) {
  const opts = myPits(seat).filter((k) => g.pits[k]);
  let best = opts[0], bestScore = -Infinity;
  for (const k of opts) {
    const r = mcMove(g, k, seat);
    const score = r.g.pits[storeOf(seat)] - g.pits[storeOf(seat)] + (r.turn === seat ? 2 : 0) + Math.random() * 0.5;
    if (score > bestScore) { bestScore = score; best = k; }
  }
  return best;
}
function mcRender({ g, seat, move, h }) {
  const me = seat ?? 0, them = 1 - me;
  const pit = (k, mine) => h('button', { class: 'mc-pit' + (mine ? ' mine' : '') + (g.last === k ? ' last' : ''), onclick: () => move(k) }, h('b', {}, g.pits[k]), h('span', { class: 'mc-seeds' }, '•'.repeat(Math.min(g.pits[k], 12))));
  // Their pits along the top (right to left), mine along the bottom (left to right)
  return h('div', { class: 'mc-board' },
    h('div', { class: 'mc-store' }, h('b', {}, g.pits[storeOf(them)]), h('small', {}, 'them')),
    h('div', { class: 'mc-rows' },
      h('div', { class: 'mc-row' }, ...[...myPits(them)].reverse().map((k) => pit(k, false))),
      h('div', { class: 'mc-row' }, ...myPits(me).map((k) => pit(k, true)))),
    h('div', { class: 'mc-store mine' }, h('b', {}, g.pits[storeOf(me)]), h('small', {}, seat == null ? 'seat 1' : 'you')));
}

// =====================================================================================
// FLIP (Reversi rules): place a disc so you trap a line of the other colour between
// two of yours; trapped discs flip. No move? You pass. Most discs at the end wins.
// =====================================================================================
const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
function rvSetup() { const b = Array(64).fill(null); b[27] = 1; b[28] = 0; b[35] = 0; b[36] = 1; return { b, last: null }; }
function rvFlips(b, i, seat) {
  if (b[i] != null) return [];
  const x = i % 8, y = Math.floor(i / 8), out = [];
  for (const [dx, dy] of DIRS8) {
    const run = []; let xx = x + dx, yy = y + dy;
    while (inB(xx, yy) && b[yy * 8 + xx] === 1 - seat) { run.push(yy * 8 + xx); xx += dx; yy += dy; }
    if (run.length && inB(xx, yy) && b[yy * 8 + xx] === seat) out.push(...run);
  }
  return out;
}
const rvOptions = (b, seat) => b.map((_, i) => i).filter((i) => rvFlips(b, i, seat).length);
function rvMove(g, i, seat) {
  const flips = rvFlips(g.b, i, seat);
  if (!flips.length) return null;
  const b = [...g.b]; b[i] = seat; for (const f of flips) b[f] = seat;
  const ng = { b, last: i };
  const o = 1 - seat;
  if (rvOptions(b, o).length) return { g: ng };
  if (rvOptions(b, seat).length) return { g: ng, turn: seat, note: 'They had no move, go again!' };
  const a = b.filter((v) => v === 0).length, c = b.filter((v) => v === 1).length;
  return a === c ? { g: ng, draw: true } : { g: ng, win: a > c ? 0 : 1 };
}
function rvBot(g, seat) {
  const corners = [0, 7, 56, 63];
  let best = null, bestScore = -Infinity;
  for (const i of rvOptions(g.b, seat)) {
    const score = rvFlips(g.b, i, seat).length + (corners.includes(i) ? 10 : 0) + Math.random();
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}
function rvRender({ g, seat, myTurn, move, h }) {
  const hints = new Set(myTurn ? rvOptions(g.b, seat) : []);
  const a = g.b.filter((v) => v === 0).length, c = g.b.filter((v) => v === 1).length;
  return h('div', { class: 'mg-col' }, h('div', { class: 'pill' }, `⚫ ${a}  ·  ⚪ ${c}`),
    h('div', { class: 'rv-board' }, ...g.b.map((v, i) => h('button', { class: 'rv-sq' + (hints.has(i) ? ' hint' : ''), onclick: () => move(i) },
      v != null ? h('i', { class: 'rv-disc ' + (v === 0 ? 'dark' : 'light') + (g.last === i ? ' gm-pop' : '') }) : null))));
}

// =====================================================================================
// SEA BATTLE: each side gets a random fleet on a 7x7 sea. Take turns firing at the
// other sea: a hit lets you fire again. Sink the whole fleet to win.
// (Fleets are in the shared save, so this is "honest players" hidden, fine for family.)
// =====================================================================================
const SB = 7, FLEET = [4, 3, 2, 2];
function randomFleet() {
  for (;;) {
    const taken = new Set(), ships = [];
    let ok = true;
    for (const len of FLEET) {
      let placed = false;
      for (let tries = 0; tries < 100 && !placed; tries++) {
        const hor = Math.random() < 0.5;
        const x = Math.floor(Math.random() * (hor ? SB - len + 1 : SB)), y = Math.floor(Math.random() * (hor ? SB : SB - len + 1));
        const cells = [...Array(len).keys()].map((k) => (hor ? y * SB + x + k : (y + k) * SB + x));
        if (cells.some((c) => taken.has(c))) continue;
        cells.forEach((c) => taken.add(c)); ships.push(cells); placed = true;
      }
      if (!placed) { ok = false; break; }
    }
    if (ok) return ships;
  }
}
const sbSetup = () => ({ fleets: [randomFleet(), randomFleet()], shots: [{}, {}], last: null }); // shots[seat] = where seat fired
const shipCells = (fleet) => new Set(fleet.flat());
function sbMove(g, i, seat) {
  if (!(i >= 0 && i < SB * SB) || g.shots[seat][i]) return null;
  const target = g.fleets[1 - seat];
  const hit = shipCells(target).has(i);
  const shots = [{ ...g.shots[0] }, { ...g.shots[1] }];
  shots[seat][i] = hit ? 'hit' : 'miss';
  const ng = { ...g, shots, last: { seat, i } };
  if ([...shipCells(target)].every((c) => shots[seat][c])) return { g: ng, win: seat };
  if (hit) {
    const sunk = target.find((s) => s.includes(i)).every((c) => shots[seat][c]);
    return { g: ng, turn: seat, note: sunk ? 'Sunk a ship! Fire again' : 'Hit! Fire again' };
  }
  return { g: ng };
}
function sbBot(g, seat) {
  const mine = g.shots[seat];
  const free = [...Array(SB * SB).keys()].filter((i) => !mine[i]);
  // Hunt around hits that are not sunk yet
  const target = g.fleets[1 - seat];
  const openHits = Object.keys(mine).map(Number).filter((i) => mine[i] === 'hit' && !target.find((s) => s.includes(i)).every((c) => mine[c]));
  const near = openHits.flatMap((i) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [i % SB + dx, Math.floor(i / SB) + dy]).filter(([x, y]) => inB(x, y, SB)).map(([x, y]) => y * SB + x)).filter((i) => !mine[i]);
  return rnd(near.length ? near : free);
}
function sbRender({ g, seat, move, h }) {
  if (seat == null) return h('p', { class: 'muted' }, 'Two players are battling here. Start a new game to play!');
  const fire = g.shots[seat], incoming = g.shots[1 - seat], myShips = shipCells(g.fleets[seat]);
  const enemyShips = shipCells(g.fleets[1 - seat]);
  const sunkCells = (fleet, shots) => new Set(fleet.filter((s) => s.every((c) => shots[c])).flat());
  const enemySunk = sunkCells(g.fleets[1 - seat], fire);
  const last = g.last;
  const grid = (cls, cell) => h('div', { class: 'sb-grid ' + cls }, ...[...Array(SB * SB).keys()].map(cell));
  const left = [...enemyShips].filter((c) => !fire[c]).length;
  return h('div', { class: 'mg-col' },
    h('div', { class: 'small muted' }, `🎯 Their sea (tap to fire) · ${left} ship squares left`),
    grid('target', (i) => h('button', { class: 'sb-cell' + (fire[i] ? ' ' + fire[i] : '') + (enemySunk.has(i) ? ' sunk' : '') + (last && last.seat === seat && last.i === i ? ' last' : ''), onclick: () => move(i) }, fire[i] === 'hit' ? '💥' : fire[i] === 'miss' ? '·' : '')),
    h('div', { class: 'small muted' }, '🚢 Your fleet'),
    grid('mine', (i) => h('div', { class: 'sb-cell' + (myShips.has(i) ? ' ship' : '') + (incoming[i] ? ' ' + incoming[i] : '') + (last && last.seat !== seat && last.i === i ? ' last' : '') }, incoming[i] === 'hit' ? '🔥' : incoming[i] === 'miss' ? '·' : '')));
}

// =====================================================================================
export const checkersGame = (api) => duel(api, { name: 'Checkers', pieces: ['🔴', '⚫'], setup: ckSetup, move: ckMove, bot: ckBot, render: ckRender, rules: 'Move diagonally. Jumping is a must, and you keep jumping if you can. Reach the far side for a 👑 king.' });
export const dotsGame = (api) => duel(api, { name: 'Dots & Boxes', pieces: ['💗', '💙'], setup: dbSetup, move: dbMove, bot: dbBot, render: dbRender, rules: 'Tap between two dots to draw a line. Close a box to claim it and go again.' });
export const mancalaGame = (api) => duel(api, { name: 'Mancala', pieces: ['🟠', '🟣'], setup: mcSetup, move: mcMove, bot: mcBot, render: mcRender, rules: 'Tap one of your pits (bottom row). Last seed in your store (right) = go again. Last seed in your empty pit = capture.' });
export const flipGame = (api) => duel(api, { name: 'Flip', pieces: ['⚫', '⚪'], setup: rvSetup, move: rvMove, bot: rvBot, render: rvRender, rules: 'Trap the other colour between two of yours to flip it. Dots show where you can play.' });
export const seaBattleGame = (api) => duel(api, { name: 'Sea Battle', pieces: ['⚓', '🛟'], setup: sbSetup, move: sbMove, bot: sbBot, render: sbRender, rules: 'Fleets are placed for you. Fire at their sea; a hit lets you fire again.' });
