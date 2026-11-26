// DUEL HELPERS (owned by Activities). Two small engines that the mini games pack uses.
//
//  duel(api, spec)      turn-based board games (chess, checkers, mancala, ...).
//                       Play live together, or make your move and your friend plays later.
//  scoreDuel(api, spec) skill games (basketball, darts): each player plays one round
//                       whenever they like, the higher score wins.
//
// Seats work like Connect Four: whoever starts takes seat 1, the first OTHER person to
// move takes seat 2. Alone? "Practise vs bot".

const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));

/** Shared top part: the two players with their piece/colour, the one whose turn it is glows. */
function playersRow(h, st, pieces, label, activeSeat) {
  return h('div', { class: 'gm-players' }, ...st.players.map((p, seat) =>
    h('div', { class: 'gm-player' + (activeSeat === seat ? ' on' : '') + (st.winner && st.winner === p ? ' won' : '') },
      h('span', { class: 'gm-piece' }, pieces[seat]), h('span', {}, label(p)))));
}

/** Tell the rest of the game (points, records) who won, and cheer. */
function report(api, name, st) {
  const { me } = api;
  const players = st.players.filter((p) => p && p !== 'bot');
  if (!players.includes(me.id)) return;
  const winnerId = st.winner === 'bot' ? null : st.winner;
  api.result({ game: name, winnerId, players, draw: !!st.draw });
  if (st.winner === me.id) api.toast('🎉 You win!');
}

/**
 * Turn-based board game.
 * spec = {
 *   name, pieces: ['⚪', '⚫'],
 *   setup()                  -> g   (the board data for a new game)
 *   move(g, m, seat)         -> { g, turn?, win?, draw?, note? } or null if the move is not allowed
 *                               turn = whose turn next (default: the other seat; same seat = extra turn)
 *                               win = seat that won, draw = true, note = short text like "Check!"
 *   render(view)             -> HTMLElement. view = { g, st, seat, myTurn, move, ui, redraw, h }
 *                               seat = the seat this device plays (or null), ui = local-only state (e.g. selected square)
 *   bot(g, seat)             -> a move for the bot
 *   rules                    -> one line shown under the board
 * }
 * Saved state: { g, players: [a, b], turn, starter, winner, draw, note, moves, startedAt }
 */
export function duel(api, spec) {
  const { h, me } = api;
  let st = null;
  let botTimer = null;
  const ui = {}; // local only (selected square etc.), never saved
  const root = h('div', { class: 'game mg' });
  const fresh = (players, starter = 0) => ({ g: spec.setup(), players, turn: starter, starter, winner: null, draw: false, note: '', moves: 0, startedAt: Date.now() });
  const isOver = (s) => !!(s && (s.winner || s.draw));

  async function commit(next) {
    st = next; for (const k of Object.keys(ui)) delete ui[k];
    draw();
    await api.save(st);
    if (isOver(st)) report(api, spec.name, st);
    maybeBot();
  }

  function play(m, seat) {
    const r = spec.move(st.g, m, seat);
    if (!r) return null;
    const next = { ...st, players: [...st.players], g: r.g, turn: r.turn ?? 1 - seat, moves: (st.moves || 0) + 1, note: r.note || '' };
    if (r.win != null) next.winner = next.players[r.win];
    else if (r.draw) next.draw = true;
    return next;
  }

  /** The bot moves only on the device of the person playing against it. */
  function maybeBot() {
    clearTimeout(botTimer);
    if (!st || isOver(st) || st.players[st.turn] !== 'bot' || !st.players.includes(me.id)) return;
    botTimer = setTimeout(() => {
      const m = spec.bot(st.g, st.turn);
      const n = m != null && play(m, st.turn);
      if (n) commit(n);
    }, 600);
  }
  api.onClose(() => clearTimeout(botTimer));

  /** Which seat this device plays: my seat, or the open seat if I can join on my move. */
  function mySeat() {
    if (!st) return null;
    const i = st.players.indexOf(me.id);
    if (i >= 0) return i;
    const open = st.players.indexOf(null);
    return open >= 0 ? open : null;
  }
  const canMoveNow = () => !!st && !isOver(st) && mySeat() === st.turn && st.players[st.turn] !== 'bot';

  function move(m) {
    if (!st || isOver(st)) return false;
    const who = st.players[st.turn];
    if (who === 'bot') return false;
    if (who && who !== me.id) { api.toast(`It's ${api.nameOf(who)}'s turn`); return false; }
    if (!who && st.players[1 - st.turn] === me.id) { api.toast('Waiting for someone else to make the next move'); return false; }
    const seat = st.turn;
    const next = play(m, seat);
    if (!next) return false;
    if (!who) next.players[seat] = me.id; // a new person's first move: they take the open seat
    commit(next);
    return true;
  }

  const rematch = () => commit(fresh([...st.players], 1 - (st.starter ?? 0)));
  const label = (p) => (p === 'bot' ? '🤖 Bot' : p === me.id ? 'You' : p ? api.nameOf(p) : 'Open seat');

  function banner() {
    if (st.winner) return h('div', { class: 'game-status gm-banner done' }, st.winner === me.id ? '🏆 You win!' : `🏆 ${label(st.winner)} wins!`);
    if (st.draw) return h('div', { class: 'game-status gm-banner done' }, "🤝 It's a draw");
    const t = st.players[st.turn];
    const p = spec.pieces[st.turn];
    const note = st.note ? ` ${st.note}` : '';
    if (t === me.id) return h('div', { class: 'game-status gm-banner mine' }, `${p} Your turn!${note}`);
    if (t === 'bot') return h('div', { class: 'game-status gm-banner' }, `${p} Bot is thinking…`);
    if (t) return h('div', { class: 'game-status gm-banner' }, `${p} Waiting for ${api.nameOf(t)}…${note}`);
    if (st.players[1 - st.turn] === me.id) return h('div', { class: 'game-status gm-banner' }, `${p} Waiting for someone to join and move`);
    return h('div', { class: 'game-status gm-banner mine' }, `${p} Your turn! Move to join the game`);
  }

  function draw() {
    if (!st || !st.g) {
      fill(root, h('div', { class: 'game-status' }, 'No game here yet.'),
        spec.rules ? h('p', { class: 'muted small mg-rules' }, spec.rules) : null,
        h('div', { class: 'row-btns' },
          h('button', { class: 'primary', onclick: () => commit(fresh([me.id, null])) }, 'Start game'),
          h('button', { onclick: () => commit(fresh([me.id, 'bot'])) }, 'Practise vs bot')));
      return;
    }
    const over = isOver(st);
    fill(root,
      banner(),
      playersRow(h, st, spec.pieces, label, over ? -1 : st.turn),
      spec.render({ g: st.g, st, seat: mySeat(), myTurn: canMoveNow(), move, ui, redraw: draw, h, toast: api.toast }),
      spec.rules ? h('p', { class: 'muted small mg-rules' }, spec.rules) : null,
      h('div', { class: 'row-btns' },
        over ? h('button', { class: 'primary gm-rematch', onclick: rematch }, '🔁 Rematch') : null,
        h('button', { class: over ? '' : 'primary', onclick: () => commit(fresh([me.id, null])) }, 'New game'),
        h('button', { onclick: () => commit(fresh([me.id, 'bot'])) }, 'Practise vs bot')));
  }

  api.load().then((saved) => { st = saved; draw(); maybeBot(); });
  api.onRemote((v) => { st = v; for (const k of Object.keys(ui)) delete ui[k]; draw(); });
  draw();
  return root;
}

/**
 * Skill game: each player plays one round (in any order, live or later), higher score wins.
 * spec = {
 *   name, pieces, rules,
 *   play(h, done)  -> HTMLElement that runs one round and calls done(score) at the end
 *   botScore()     -> a score for the bot
 *   unit           -> word after the score, e.g. 'points'
 * }
 * Saved state: { players: [a, b], scores: [n|null, n|null], winner, draw, startedAt }
 */
export function scoreDuel(api, spec) {
  const { h, me } = api;
  let st = null;
  let playing = false; // true while this device is in the middle of a round (ignore redraws)
  const root = h('div', { class: 'game mg' });
  const unit = spec.unit || 'points';
  const fresh = (players) => ({ players, scores: [null, null], winner: null, draw: false, startedAt: Date.now() });
  const label = (p) => (p === 'bot' ? '🤖 Bot' : p === me.id ? 'You' : p ? api.nameOf(p) : 'Open seat');
  const isOver = (s) => !!(s && (s.winner || s.draw));

  function mySeat() {
    if (!st) return null;
    const i = st.players.indexOf(me.id);
    if (i >= 0) return i;
    const open = st.players.indexOf(null);
    return open >= 0 ? open : null;
  }

  async function commit(next) {
    st = next;
    // Both played? Work out the winner.
    if (!isOver(st) && st.scores.every((s) => s != null)) {
      const [a, b] = st.scores;
      if (a === b) st.draw = true; else st.winner = st.players[a > b ? 0 : 1];
    }
    draw();
    await api.save(st);
    if (isOver(st)) report(api, spec.name, st);
  }

  function start(players) {
    const s = fresh(players);
    if (players[1] === 'bot') s.scores[1] = spec.botScore();
    commit(s);
  }

  function playRound() {
    const seat = mySeat();
    if (seat == null) return api.toast('Both seats are taken');
    playing = true;
    const round = spec.play(h, (score) => {
      playing = false;
      const next = { ...st, players: [...st.players], scores: [...st.scores] };
      next.players[seat] = me.id;
      next.scores[seat] = score;
      api.toast(`You scored ${score} ${unit}!`);
      commit(next);
    });
    fill(root, h('div', { class: 'game-status gm-banner mine' }, `${spec.pieces[seat]} Your round!`), round);
  }

  function scoreLine() {
    return h('div', { class: 'mg-scores' }, ...st.players.map((p, seat) =>
      h('div', { class: 'mg-score' + (st.winner && st.winner === p ? ' won' : '') },
        h('span', {}, `${spec.pieces[seat]} ${label(p)}`),
        h('b', {}, st.scores[seat] == null ? (isOver(st) ? '-' : '…') : st.scores[seat]))));
  }

  function draw() {
    if (playing) return;
    if (!st) {
      fill(root, h('div', { class: 'game-status' }, 'No game here yet.'),
        spec.rules ? h('p', { class: 'muted small mg-rules' }, spec.rules) : null,
        h('div', { class: 'row-btns' },
          h('button', { class: 'primary', onclick: () => start([me.id, null]) }, 'Start game'),
          h('button', { onclick: () => start([me.id, 'bot']) }, 'Practise vs bot')));
      return;
    }
    const seat = mySeat();
    const over = isOver(st);
    let banner;
    if (st.winner) banner = h('div', { class: 'game-status gm-banner done' }, st.winner === me.id ? '🏆 You win!' : `🏆 ${label(st.winner)} wins!`);
    else if (st.draw) banner = h('div', { class: 'game-status gm-banner done' }, "🤝 It's a tie");
    else if (seat != null && st.scores[seat] == null) banner = h('div', { class: 'game-status gm-banner mine' }, 'Your turn! Play your round');
    else if (seat != null) banner = h('div', { class: 'game-status gm-banner' }, `Waiting for ${st.players[1 - seat] ? api.nameOf(st.players[1 - seat]) : 'someone'} to play… (they can play later too)`);
    else banner = h('div', { class: 'game-status gm-banner' }, 'Both players are in. Watch the scores!');
    const canPlay = !over && seat != null && st.scores[seat] == null;
    fill(root,
      banner,
      scoreLine(),
      spec.rules ? h('p', { class: 'muted small mg-rules' }, spec.rules) : null,
      h('div', { class: 'row-btns' },
        canPlay ? h('button', { class: 'primary gm-rematch', onclick: playRound }, '▶️ Play my round') : null,
        over ? h('button', { class: 'primary gm-rematch', onclick: () => start([...st.players]) }, '🔁 Rematch') : null,
        h('button', { onclick: () => start([me.id, null]) }, 'New game'),
        h('button', { onclick: () => start([me.id, 'bot']) }, 'Practise vs bot')));
  }

  api.load().then((saved) => { st = saved; draw(); });
  api.onRemote((v) => { st = v; draw(); });
  draw();
  return root;
}
