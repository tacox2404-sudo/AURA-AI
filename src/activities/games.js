// GAMES (owned by Activities). Turn-based like iMessage games: play live together,
// or make a move and your friend plays theirs later. State is saved per table.
//
// Seats: whoever starts takes seat 1; the first OTHER person to move takes seat 2.
// Alone? Use "vs bot" to practise.

import './games.css';
import { MINIGAME_LIST } from './minigames.js';

// replaceChildren that skips null/false (so conditional children don't print "null")
const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));
const empty = (n) => Array(n).fill(null);

/** Shared turn-based helper used by Connect Four and Tic-Tac-Toe.
 *  Saved state: { board, players: [seat1, seat2], turn, starter, winner, draw,
 *                 last (cell index of the newest move), line (winning cells), moves, startedAt }
 *  `lineOf(board)` returns { seat, cells } for a win, or null. */
function turnGame(api, { name, pieces, newBoard, render, applyMove, lineOf, botMove }) {
  const { h, me } = api;
  let st = null;
  let animated = -1; // the move number we already animated, so redraws don't replay it
  let botTimer = null;
  const root = h('div', { class: 'game' });
  const fresh = (players, starter = 0) => ({ board: newBoard(), players, turn: starter, starter, winner: null, draw: false, last: null, line: null, moves: 0, startedAt: Date.now() });
  const isOver = (s) => !!(s && (s.winner || s.draw));

  async function commit(next) {
    st = next; draw();
    await api.save(st);
    if (isOver(st)) {
      const players = st.players.filter((p) => p && p !== 'bot');
      const winnerId = st.winner === 'bot' ? null : st.winner;
      if (players.includes(me.id)) api.result({ game: name, winnerId, players, draw: !!st.draw });
      if (st.winner === me.id) api.toast('🎉 You win!');
    }
    maybeBot();
  }

  /** Put `seat`'s piece on the board and work out who's next / who won. */
  function play(m, seat) {
    const board = applyMove(st.board, m, seat);
    if (!board) return null;
    const next = { ...st, players: [...st.players], board, turn: 1 - seat, moves: (st.moves || 0) + 1 };
    next.last = board.findIndex((v, i) => v !== st.board[i]);
    const win = lineOf(board);
    if (win) { next.winner = next.players[win.seat]; next.line = win.cells; }
    else if (board.every((c) => c != null)) next.draw = true;
    return next;
  }

  /** If it's the bot's turn (only on the device that started the bot game), let it move. */
  function maybeBot() {
    clearTimeout(botTimer);
    if (!st || isOver(st) || st.players[st.turn] !== 'bot' || st.players[0] !== me.id && st.players[1] !== me.id) return;
    botTimer = setTimeout(() => { const n = play(botMove(st.board), st.turn); if (n) commit(n); }, 550);
  }
  api.onClose(() => clearTimeout(botTimer));

  function move(m) {
    if (!st || isOver(st)) return;
    const seat = st.turn;
    const who = st.players[seat];
    if (who === 'bot') return;
    if (who && who !== me.id) return api.toast(`It's ${api.nameOf(who)}'s turn`);
    if (!who && st.players[1 - seat] === me.id) return api.toast('Waiting for someone else to make the next move');
    const next = play(m, seat);
    if (!next) return;
    if (!who) next.players[seat] = me.id; // first move from a new person: they take the open seat
    commit(next);
  }

  /** Same players again; whoever went second last time goes first now. */
  function rematch() {
    const starter = 1 - (st.starter ?? 0);
    commit(fresh([...st.players], starter));
  }

  const label = (p) => (p === 'bot' ? '🤖 Bot' : p === me.id ? 'You' : p ? api.nameOf(p) : 'Open seat');

  /** The two players with their piece; the one whose turn it is glows. */
  function players() {
    return h('div', { class: 'gm-players' }, ...st.players.map((p, seat) =>
      h('div', { class: 'gm-player' + (!isOver(st) && st.turn === seat ? ' on' : '') + (st.winner && st.winner === p ? ' won' : '') },
        h('span', { class: 'gm-piece' }, pieces[seat]), h('span', {}, label(p)))));
  }

  /** One big, clear line: whose turn it is (or who won). */
  function banner() {
    if (st.winner) {
      const text = st.winner === me.id ? '🏆 You win!' : `🏆 ${st.winner === 'bot' ? 'Bot' : api.nameOf(st.winner)} wins!`;
      return h('div', { class: 'game-status gm-banner done' }, text);
    }
    if (st.draw) return h('div', { class: 'game-status gm-banner done' }, "🤝 It's a draw");
    const t = st.players[st.turn];
    const piece = pieces[st.turn];
    if (t === me.id) return h('div', { class: 'game-status gm-banner mine' }, `${piece} Your turn!`);
    if (t === 'bot') return h('div', { class: 'game-status gm-banner' }, `${piece} Bot is thinking…`);
    if (t) return h('div', { class: 'game-status gm-banner' }, `${piece} Waiting for ${api.nameOf(t)}… (they can play later too)`);
    if (st.players[1 - st.turn] === me.id) return h('div', { class: 'game-status gm-banner' }, `${piece} Waiting for someone to join and move`);
    return h('div', { class: 'game-status gm-banner mine' }, `${piece} Your turn! Tap to join the game`);
  }

  function draw() {
    if (!st) {
      fill(root, h('div', { class: 'game-status' }, 'No game here yet.'),
        h('div', { class: 'row-btns' },
          h('button', { class: 'primary', onclick: () => commit(fresh([me.id, null])) }, 'Start game'),
          h('button', { onclick: () => commit(fresh([me.id, 'bot'])) }, 'Practise vs bot')));
      return;
    }
    const fx = { animate: st.moves !== animated, last: st.last, line: new Set(st.line || []) };
    animated = st.moves;
    const over = isOver(st);
    fill(root,
      banner(),
      players(),
      render(st, move, fx),
      h('div', { class: 'row-btns' },
        over ? h('button', { class: 'primary gm-rematch', onclick: rematch }, '🔁 Rematch') : null,
        h('button', { class: over ? '' : 'primary', onclick: () => commit(fresh([me.id, null])) }, 'New game'),
        h('button', { onclick: () => commit(fresh([me.id, 'bot'])) }, 'Practise vs bot')));
  }

  api.load().then((saved) => { st = saved; draw(); maybeBot(); });
  api.onRemote((v) => { st = v; draw(); });
  draw();
  return root;
}

// ---------- Connect Four ----------
const C4W = 7, C4H = 6;
/** Returns { seat, cells } for four in a row, or null. */
function c4Line(b) {
  const at = (x, y) => (x >= 0 && x < C4W && y >= 0 && y < C4H ? b[y * C4W + x] : null);
  for (let y = 0; y < C4H; y++) for (let x = 0; x < C4W; x++) {
    const v = at(x, y); if (v == null) continue;
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) if ([1, 2, 3].every((k) => at(x + dx * k, y + dy * k) === v)) return { seat: v, cells: [0, 1, 2, 3].map((k) => (y + dy * k) * C4W + x + dx * k) };
  }
  return null;
}
const c4Winner = (b) => c4Line(b)?.seat ?? null;
function c4Drop(b, col, seat) {
  for (let y = C4H - 1; y >= 0; y--) if (b[y * C4W + col] == null) { const n = [...b]; n[y * C4W + col] = seat; return n; }
  return null;
}

// ---------- Tic-Tac-Toe ----------
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const tttLine = (b) => { for (const l of LINES) { const [a, c, d] = l; if (b[a] != null && b[a] === b[c] && b[a] === b[d]) return { seat: b[a], cells: l }; } return null; };
const tttWinner = (b) => tttLine(b)?.seat ?? null;

// ---------- Draw & Guess ----------
const WORDS = ['cat', 'pizza', 'beach', 'rocket', 'guitar', 'rainbow', 'castle', 'dragon', 'coffee', 'snowman', 'bicycle', 'penguin', 'volcano', 'airplane', 'cactus', 'sushi', 'heart', 'moon', 'tree house', 'umbrella', 'robot', 'whale', 'birthday cake', 'sunflower'];
const enc = (s) => btoa(unescape(encodeURIComponent(s)));
const dec = (s) => { try { return decodeURIComponent(escape(atob(s))); } catch { return ''; } };

function drawGame(api) {
  const { h, me } = api;
  let st = null; // { drawer, word (encoded), image, solvedBy, guesses: [] }
  const root = h('div', { class: 'game' });
  const W = 320, H = 240;
  let canvas, g2, drawing = false, last = null, color = '#222';

  const stroke = (a, b, c) => { g2.strokeStyle = c; g2.lineWidth = c === '#ffffff' ? 16 : 4; g2.lineCap = 'round'; g2.beginPath(); g2.moveTo(a[0], a[1]); g2.lineTo(b[0], b[1]); g2.stroke(); };
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]; };

  function setupCanvas(editable) {
    canvas = h('canvas', { width: W, height: H, class: 'draw-canvas' });
    g2 = canvas.getContext('2d'); g2.fillStyle = '#fff'; g2.fillRect(0, 0, W, H);
    if (st?.image) { const img = new Image(); img.onload = () => g2.drawImage(img, 0, 0); img.src = st.image; }
    if (editable) {
      canvas.addEventListener('pointerdown', (e) => { drawing = true; last = pos(e); canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener('pointermove', (e) => { if (!drawing) return; const p = pos(e); stroke(last, p, color); api.send('draw', { a: last, b: p, c: color }); last = p; });
      canvas.addEventListener('pointerup', () => { drawing = false; });
    }
    return canvas;
  }
  api.onLive('draw', (e) => { if (g2 && st?.drawer !== me.id) stroke(e.a, e.b, e.c); });

  async function newRound(word) {
    st = { drawer: me.id, word: enc(word), image: null, solvedBy: null, guesses: [], at: Date.now() };
    await api.save(st); render();
  }
  async function finish() {
    st = { ...st, image: canvas.toDataURL('image/jpeg', 0.7) };
    await api.save(st); api.toast('Drawing saved. Friends can guess now or later!'); render();
  }
  async function guess(text) {
    const word = dec(st.word);
    const ok = text.trim().toLowerCase() === word.toLowerCase();
    st = { ...st, guesses: [...st.guesses, { by: me.id, text, ok }].slice(-20), solvedBy: ok ? me.id : st.solvedBy };
    await api.save(st);
    if (ok) { api.toast('🎉 Correct!'); api.result({ game: 'Draw & Guess', winnerId: me.id, players: [me.id, st.drawer] }); }
    else api.toast('Not quite!');
    render();
  }

  function render() {
    if (!st || st.solvedBy) {
      const choices = [...WORDS].sort(() => Math.random() - 0.5).slice(0, 3);
      fill(root, 
        st?.solvedBy ? h('div', { class: 'game-status' }, `✅ ${api.nameOf(st.solvedBy)} guessed "${dec(st.word)}"`) : h('div', { class: 'game-status' }, 'Draw something, everyone else guesses.'),
        st?.image ? h('img', { src: st.image, class: 'draw-canvas' }) : null,
        h('p', {}, 'Pick a word to draw:'),
        h('div', { class: 'row-btns' }, ...choices.map((w) => h('button', { class: 'primary', onclick: () => newRound(w) }, w))));
      return;
    }
    if (st.drawer === me.id) {
      const colors = ['#222', '#e63946', '#2a9d8f', '#457b9d', '#f4a261', '#9b5de5', '#ffffff'];
      fill(root, 
        h('div', { class: 'game-status' }, `Draw: "${dec(st.word)}" (friends watching live see it too)`),
        setupCanvas(true),
        h('div', { class: 'row-btns' }, ...colors.map((c) => h('button', { class: 'swatch-btn', style: { background: c }, title: c === '#ffffff' ? 'eraser' : c, onclick: () => { color = c; } })),
          h('button', { class: 'primary', onclick: finish }, 'Done drawing')),
        st.guesses.length ? h('div', { class: 'muted small' }, 'Guesses: ' + st.guesses.map((g) => `${api.nameOf(g.by)}: ${g.text}`).join(', ')) : null);
      return;
    }
    const input = h('input', { placeholder: 'Your guess…', onkeydown: (e) => { if (e.key === 'Enter') guess(input.value); } });
    fill(root, 
      h('div', { class: 'game-status' }, `${api.nameOf(st.drawer)} is drawing… guess the word!`),
      setupCanvas(false),
      h('div', { class: 'chat-input' }, input, h('button', { class: 'primary', onclick: () => guess(input.value) }, 'Guess')),
      st.guesses.length ? h('div', { class: 'muted small' }, 'Guesses so far: ' + st.guesses.map((g) => g.text).join(', ')) : null);
  }

  api.load().then((v) => { st = v; render(); });
  api.onRemote((v) => { const redraw = !st || v.drawer !== me.id || !st.word || v.word !== st.word || v.solvedBy; st = v; if (redraw) render(); });
  render();
  return root;
}

export const GAMES = {
  connect4: {
    title: 'Connect Four', icon: '🔴',
    open: (api) => turnGame(api, {
      name: 'Connect Four',
      pieces: ['🔴', '🟡'],
      newBoard: () => empty(C4W * C4H),
      applyMove: c4Drop,
      lineOf: c4Line,
      botMove: (b) => { const cols = [...Array(C4W).keys()].filter((c) => b[c] == null); for (const c of cols) if (c4Winner(c4Drop(b, c, 1)) === 1) return c; for (const c of cols) if (c4Winner(c4Drop(b, c, 0)) === 0) return c; return cols[Math.floor(Math.random() * cols.length)]; },
      // The newest disc "drops" from the top (gm-r1..gm-r6 = which row it lands in); winning discs glow.
      render: (st, move, fx) => api.h('div', { class: 'c4' }, ...st.board.map((v, i) => api.h('button', { class: 'c4-cell' + (fx.line.has(i) ? ' gm-win' : ''), onclick: () => move(i % C4W) },
        api.h('i', { class: (v === 0 ? 'red' : v === 1 ? 'yellow' : '') + (fx.animate && i === fx.last ? ` gm-drop gm-r${Math.floor(i / C4W) + 1}` : '') })))),
    }),
  },
  tictactoe: {
    title: 'Tic-Tac-Toe', icon: '❌',
    open: (api) => turnGame(api, {
      name: 'Tic-Tac-Toe',
      pieces: ['❌', '⭕'],
      newBoard: () => empty(9),
      applyMove: (b, i, seat) => (b[i] == null ? Object.assign([...b], { [i]: seat }) : null),
      lineOf: tttLine,
      botMove: (b) => { const free = b.map((v, i) => (v == null ? i : -1)).filter((i) => i >= 0); for (const s of [1, 0]) for (const i of free) if (tttWinner(Object.assign([...b], { [i]: s })) === s) return i; return free.includes(4) ? 4 : free[Math.floor(Math.random() * free.length)]; },
      // The newest mark "pops" in; the winning three glow.
      render: (st, move, fx) => api.h('div', { class: 'ttt' }, ...st.board.map((v, i) => api.h('button', { class: 'ttt-cell' + (fx.line.has(i) ? ' gm-win' : ''), onclick: () => move(i) },
        v == null ? '' : api.h('span', { class: fx.animate && i === fx.last ? 'gm-pop' : '' }, v === 0 ? '❌' : '⭕')))),
    }),
  },
  draw: { title: 'Draw & Guess', icon: '🎨', open: drawGame },
  games: {
    title: 'Games', icon: '🎲',
    open: (api) => {
      const { h } = api;
      const list = [['connect4', '🔴 Connect Four', 'Drop discs, get four in a row'], ['tictactoe', '❌ Tic-Tac-Toe', 'Quick classic'], ['draw', '🎨 Draw & Guess', 'One draws, everyone guesses'],
        ...MINIGAME_LIST];
      return h('div', { class: 'list' }, ...list.map(([id, t, d]) => h('button', { class: 'row-main', onclick: () => api.open(id, { key: `${api.room?.id || 'house'}:hub:${id}` }) }, h('b', {}, t), h('small', {}, d))),
        h('p', { class: 'muted small' }, 'More games coming: word hunt, pool, mini golf…'));
    },
  },
  leaderboard: { title: 'Scores', icon: '🏆', open: (api) => { api.ctx.use('points.open')(); return null; } },
};
