// POINTS, STREAKS and LEADERBOARDS (owned by Social).
// Anything can award points by emitting: bus.emit('points:award', { amount, reason })
// Games report results with: bus.emit('game:result', { game, winnerId, players, roomId, draw })
// Nothing in the game is locked behind points. They are for fun and bragging rights.

import { today } from '../core/store.js';

const DAILY_CAPS = { chat: 20, decorated: 30, nudge: 15 }; // max points per reason per day

export function initPoints(ctx) {
  const { bus, store, backend, ui } = ctx; const { h } = ui;
  let entries = [];
  const capUsed = new Map();

  async function refresh() {
    const house = store.get().house;
    if (!house) return;
    entries = await backend.listPoints(house.id);
    bus.emit('points:changed', standings());
  }

  function standings() {
    const s = store.get();
    const totals = {};
    for (const e of entries) totals[e.userId] = (totals[e.userId] || 0) + e.amount;
    const members = Object.entries(s.house?.members || {}).map(([id, m]) => ({ id, name: m.name, role: m.role, points: totals[id] || 0 }));
    members.sort((a, b) => b.points - a.points);
    return { members, mine: totals[s.me?.id] || 0, streak: s.house?.streak || { count: 0 } };
  }

  bus.on('points:award', async ({ amount, reason }) => {
    const s = store.get();
    if (!s.house || !s.me) return;
    const key = `${today()}:${reason}`;
    const used = capUsed.get(key) || 0;
    if (DAILY_CAPS[reason] && used >= DAILY_CAPS[reason]) return;
    capUsed.set(key, used + amount);
    entries.push({ userId: s.me.id, amount, reason, at: Date.now() });
    bus.emit('points:changed', standings());
    try { await backend.addPoints(s.house.id, s.me.id, amount, reason); } catch (e) { console.warn(e); }
    ctx.use('live.send')({ type: 'points' });
  });
  bus.on('live:points', refresh);

  // Game results -> points + win records (records are written once, by the winner's device)
  bus.on('game:result', async ({ game, winnerId, players = [], draw = false }) => {
    const s = store.get();
    if (!players.includes(s.me.id)) return;
    const won = !draw && winnerId === s.me.id;
    bus.emit('points:award', { amount: won ? 20 : draw ? 10 : 5, reason: won ? `won ${game}` : `played ${game}` });
    const writer = draw ? players[0] : winnerId;
    if (writer !== s.me.id) return;
    const rec = (await backend.getState(s.house.id, 'records')) || {};
    rec[game] = rec[game] || {};
    for (const p of players) {
      rec[game][p] = rec[game][p] || { w: 0, l: 0, d: 0 };
      if (draw) rec[game][p].d++; else if (p === winnerId) rec[game][p].w++; else rec[game][p].l++;
    }
    await backend.setState(s.house.id, 'records', rec);
  });

  // Daily visit + shared streak (any member visiting keeps the house streak alive)
  bus.on('house:entered', async () => {
    await refresh();
    const s = store.get();
    const visitKey = `op:visit:${s.house.id}:${s.me.id}`;
    let last = null; try { last = localStorage.getItem(visitKey); } catch {}
    if (last !== today()) {
      try { localStorage.setItem(visitKey, today()); } catch {}
      bus.emit('points:award', { amount: 10, reason: 'daily visit' });
      ui.toast('☀️ Daily visit: +10 points');
    }
    const st = s.house.streak || { count: 0, lastDay: null };
    if (st.lastDay !== today()) {
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      const house = { ...s.house, streak: { count: st.lastDay === y ? st.count + 1 : 1, lastDay: today() } };
      ctx.use('house.save')(house);
    }
  });

  async function open() {
    await refresh();
    const s = store.get();
    const st = standings();
    const rec = (await backend.getState(s.house.id, 'records')) || {};
    const nameOf = (id) => s.house.members?.[id]?.name || 'someone';
    ui.panel({ title: '🏆 Scores', body: h('div', {},
      h('div', { class: 'streak' }, `🔥 House streak: ${st.streak.count || 0} day${st.streak.count === 1 ? '' : 's'}`),
      h('h4', {}, 'Points'),
      h('div', { class: 'list' }, ...st.members.map((m, i) => h('div', { class: 'row score' }, h('span', { class: 'rank' }, ['🥇', '🥈', '🥉'][i] || `${i + 1}.`), h('span', { class: 'row-main' }, m.name, h('small', {}, m.role)), h('b', {}, m.points)))),
      h('h4', {}, 'Game records'),
      Object.keys(rec).length ? h('div', { class: 'list' }, ...Object.entries(rec).map(([game, byUser]) => h('div', { class: 'card' }, h('b', {}, game),
        ...Object.entries(byUser).sort((a, b) => b[1].w - a[1].w).map(([id, r]) => h('div', { class: 'row' }, h('span', { class: 'row-main' }, nameOf(id)), h('small', {}, `${r.w}W · ${r.l}L · ${r.d}D`))))))
        : h('p', { class: 'muted' }, 'No games played yet. Head to the Game Room!'),
      h('p', { class: 'muted small' }, 'Points come from daily visits, chatting, building, gifts and games. Nothing is locked behind them.')) });
  }

  ctx.provide('points.standings', standings);
  ctx.provide('points.open', open);
  ui.addDockButton({ id: 'scores', icon: '🏆', label: 'Scores', onClick: open, order: 60, group: 'more' });
}
