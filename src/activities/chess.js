// CHESS (owned by Activities). Full rules: check, checkmate, stalemate, castling,
// en passant; pawns that reach the end become a queen. Uses the duel() helper.
//
// Board: 64 squares, index = row * 8 + column, row 0 is the top (black's side).
// A piece is a 2-letter string: colour (w/b) + type (P N B R Q K), e.g. 'wK'.
// Seat 1 plays white, seat 2 plays black (their board is shown flipped).

import { duel } from './duel.js';

const VAL = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
const GLYPH = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
const inB = (x, y) => x >= 0 && x < 8 && y >= 0 && y < 8;
const other = (c) => (c === 'w' ? 'b' : 'w');
const colorOf = (seat) => (seat === 0 ? 'w' : 'b');

function setup() {
  const b = Array(64).fill(null);
  const back = 'RNBQKBNR';
  for (let x = 0; x < 8; x++) {
    b[x] = 'b' + back[x]; b[8 + x] = 'bP';
    b[48 + x] = 'wP'; b[56 + x] = 'w' + back[x];
  }
  return { b, cr: 'KQkq', ep: null, last: null }; // cr = castling still allowed, ep = en passant square
}

/** Is square i attacked by colour `by`? */
function attacked(b, i, by) {
  const x = i % 8, y = Math.floor(i / 8);
  const at = (xx, yy) => (inB(xx, yy) ? b[yy * 8 + xx] : undefined);
  const pawnRow = by === 'w' ? y + 1 : y - 1; // white pawns attack upwards
  if (at(x - 1, pawnRow) === by + 'P' || at(x + 1, pawnRow) === by + 'P') return true;
  for (const [dx, dy] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) if (at(x + dx, y + dy) === by + 'N') return true;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if ((dx || dy) && at(x + dx, y + dy) === by + 'K') return true;
  const rays = [[[1, 0], [-1, 0], [0, 1], [0, -1]], [[1, 1], [1, -1], [-1, 1], [-1, -1]]];
  for (let kind = 0; kind < 2; kind++) for (const [dx, dy] of rays[kind]) {
    let xx = x + dx, yy = y + dy;
    while (inB(xx, yy)) {
      const p = b[yy * 8 + xx];
      if (p) { if (p[0] === by && (p[1] === 'Q' || p[1] === (kind === 0 ? 'R' : 'B'))) return true; break; }
      xx += dx; yy += dy;
    }
  }
  return false;
}

/** Every move for colour c, before checking if it leaves the king in danger. */
function pseudoMoves(g, c) {
  const { b } = g;
  const out = [];
  for (let i = 0; i < 64; i++) {
    const p = b[i]; if (!p || p[0] !== c) continue;
    const x = i % 8, y = Math.floor(i / 8), t = p[1];
    const add = (xx, yy, extra) => out.push({ f: i, t: yy * 8 + xx, ...extra });
    const slide = (dirs, far) => { for (const [dx, dy] of dirs) { let xx = x + dx, yy = y + dy; while (inB(xx, yy)) { const q = b[yy * 8 + xx]; if (q && q[0] === c) break; add(xx, yy); if (q || !far) break; xx += dx; yy += dy; } } };
    if (t === 'P') {
      const d = c === 'w' ? -1 : 1, startRow = c === 'w' ? 6 : 1;
      if (inB(x, y + d) && !b[(y + d) * 8 + x]) {
        add(x, y + d);
        if (y === startRow && !b[(y + 2 * d) * 8 + x]) add(x, y + 2 * d, { dbl: true });
      }
      for (const dx of [-1, 1]) {
        if (!inB(x + dx, y + d)) continue;
        const ti = (y + d) * 8 + x + dx, q = b[ti];
        if (q && q[0] !== c) add(x + dx, y + d);
        else if (ti === g.ep) add(x + dx, y + d, { ep: true });
      }
    } else if (t === 'N') slide([[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]], false);
    else if (t === 'B') slide([[1, 1], [1, -1], [-1, 1], [-1, -1]], true);
    else if (t === 'R') slide([[1, 0], [-1, 0], [0, 1], [0, -1]], true);
    else if (t === 'Q') slide([[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]], true);
    else if (t === 'K') {
      slide([[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]], false);
      // Castling: king and rook never moved, squares between are empty and not attacked
      const row = c === 'w' ? 56 : 0, o = other(c);
      if (i === row + 4 && !attacked(b, i, o)) {
        if (g.cr.includes(c === 'w' ? 'K' : 'k') && b[row + 7] === c + 'R' && !b[row + 5] && !b[row + 6] && !attacked(b, row + 5, o) && !attacked(b, row + 6, o)) add(6, y, { castle: 'k' });
        if (g.cr.includes(c === 'w' ? 'Q' : 'q') && b[row] === c + 'R' && !b[row + 1] && !b[row + 2] && !b[row + 3] && !attacked(b, row + 3, o) && !attacked(b, row + 2, o)) add(2, y, { castle: 'q' });
      }
    }
  }
  return out;
}

/** Make the move on a copy of the board and return the new game data. */
function apply(g, m) {
  const b = [...g.b];
  const p = b[m.f], c = p[0];
  b[m.t] = p; b[m.f] = null;
  if (m.ep) b[Math.floor(m.f / 8) * 8 + (m.t % 8)] = null; // en passant: remove the pawn beside
  if (p[1] === 'P' && (m.t < 8 || m.t >= 56)) b[m.t] = c + 'Q'; // promotion
  if (m.castle) { const row = c === 'w' ? 56 : 0; if (m.castle === 'k') { b[row + 5] = b[row + 7]; b[row + 7] = null; } else { b[row + 3] = b[row]; b[row] = null; } }
  let cr = g.cr;
  if (p[1] === 'K') cr = cr.replace(c === 'w' ? /[KQ]/g : /[kq]/g, '');
  const corner = { 63: 'K', 56: 'Q', 7: 'k', 0: 'q' };
  for (const sq of [m.f, m.t]) if (corner[sq]) cr = cr.replace(corner[sq], '');
  return { b, cr, ep: m.dbl ? (m.f + m.t) / 2 : null, last: [m.f, m.t] };
}

const kingAt = (b, c) => b.indexOf(c + 'K');
const inCheck = (b, c) => attacked(b, kingAt(b, c), other(c));
const legalMoves = (g, c) => pseudoMoves(g, c).filter((m) => !inCheck(apply(g, m).b, c));

function move(g, m, seat) {
  const c = colorOf(seat);
  const real = legalMoves(g, c).find((x) => x.f === m.f && x.t === m.t);
  if (!real) return null;
  const ng = apply(g, real);
  const o = other(c);
  const replies = legalMoves(ng, o);
  const check = inCheck(ng.b, o);
  if (!replies.length) return check ? { g: ng, win: seat } : { g: ng, draw: true };
  // Only kings left = nobody can win
  if (ng.b.every((p) => !p || p[1] === 'K')) return { g: ng, draw: true };
  return { g: ng, note: check ? 'Check!' : '' };
}

/** Simple bot: grabs the most valuable piece it safely can, avoids hanging its own pieces. */
function bot(g, seat) {
  const c = colorOf(seat), o = other(c);
  let best = null, bestScore = -Infinity;
  for (const m of legalMoves(g, c)) {
    const ng = apply(g, m);
    const replies = legalMoves(ng, o);
    if (!replies.length && inCheck(ng.b, o)) return m; // checkmate!
    const gain = g.b[m.t] ? VAL[g.b[m.t][1]] : m.ep ? 1 : 0;
    let worst = 0; // the most the opponent can take back next move
    for (const r of replies) if (ng.b[r.t]) worst = Math.max(worst, VAL[ng.b[r.t][1]] || 0);
    const score = gain - worst * 0.9 + (inCheck(ng.b, o) ? 0.3 : 0) + Math.random() * 0.4;
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return best;
}

function render({ g, seat, myTurn, move: doMove, ui, redraw, h }) {
  const flip = seat === 1; // black sees their pieces at the bottom
  const myColor = seat == null ? null : colorOf(seat);
  const targets = new Set(ui.sel != null ? legalMoves(g, myColor).filter((m) => m.f === ui.sel).map((m) => m.t) : []);
  const checkSq = ['w', 'b'].map((c) => (inCheck(g.b, c) ? kingAt(g.b, c) : -1));
  const last = new Set(g.last || []);

  function tap(i) {
    if (!myTurn) return doMove({ f: -1, t: -1 }); // shows "it's X's turn" when needed
    const p = g.b[i];
    if (ui.sel != null && targets.has(i)) { doMove({ f: ui.sel, t: i }); return; }
    ui.sel = p && p[0] === myColor && ui.sel !== i ? i : null;
    redraw();
  }

  const cells = [];
  for (let k = 0; k < 64; k++) {
    const i = flip ? 63 - k : k;
    const x = i % 8, y = Math.floor(i / 8);
    const p = g.b[i];
    cells.push(h('button', {
      class: 'ch-sq ' + ((x + y) % 2 ? 'dark' : 'light') + (ui.sel === i ? ' sel' : '') + (last.has(i) ? ' last' : '') + (checkSq.includes(i) ? ' check' : '') + (targets.has(i) ? (p ? ' cap' : ' dot') : ''),
      onclick: () => tap(i),
      'aria-label': p ? `${p[0] === 'w' ? 'white' : 'black'} ${p[1]}` : 'empty',
    }, p ? h('span', { class: 'ch-pc ' + p[0] }, GLYPH[p[1]] + '︎') : null));
  }
  return h('div', { class: 'ch-board' }, ...cells);
}

export const chessGame = (api) => duel(api, {
  name: 'Chess', pieces: ['♔', '♚'], setup, move, bot, render,
  rules: 'Tap a piece, then a highlighted square. White moves first.',
});
