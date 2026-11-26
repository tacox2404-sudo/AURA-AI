// ACTIVITIES AREA - entry point. Owner: Activities.
// When someone taps furniture with an "activity", World emits 'item:activate'.
// We open the matching activity from the registry in a panel.
//
// To add a new activity: write it in games.js or life.js (or a new file), then add it
// to REGISTRY below. Each activity is { title, icon, wide?, open(api) -> HTMLElement }.

import { GAMES } from './games.js';
import { LIFE } from './life.js';
import { TRIPS } from './trips.js';
import './trips.css';

export const REGISTRY = { ...GAMES, ...LIFE, ...TRIPS };

export function initActivities(ctx) {
  const { bus, store, backend, ui } = ctx;

  // Live state listeners for whatever activity panel is open
  const remoteHandlers = new Set();
  bus.on('live:state', (e) => { for (const fn of remoteHandlers) fn(e); });
  const liveHandlers = new Map(); // type -> Set
  for (const t of ['draw']) bus.on(`live:${t}`, (e) => { for (const fn of liveHandlers.get(t) || []) fn(e); });

  /** The API every activity receives. Keep it stable: it's the activities' contract. */
  function makeApi({ id, item, room, key }) {
    const s = store.get();
    const cleanups = [];
    const api = {
      h: ui.h,
      ctx,
      me: s.me,
      house: s.house,
      room, item,
      key,
      get members() { return store.get().house?.members || {}; },
      nameOf: (uid) => store.get().house?.members?.[uid]?.name || 'someone',
      canEdit: s.role === 'owner' || s.role === 'housemate',
      toast: ui.toast,
      /** Read this activity's saved state (shared by the whole house). */
      load: (k = key) => backend.getState(s.house.id, k),
      /** Save + tell everyone online. */
      async save(value, k = key) {
        await backend.setState(s.house.id, k, value);
        ctx.use('live.send')({ type: 'state', key: k, value });
        return value;
      },
      /** Called when someone else saves this activity's state. */
      onRemote(fn, k = key) { const h = (e) => { if (e.key === k) fn(e.value); }; remoteHandlers.add(h); cleanups.push(() => remoteHandlers.delete(h)); },
      /** Fast live messages that are not saved (e.g. drawing strokes). */
      send(type, payload) { ctx.use('live.send')({ type, key, ...payload }); },
      onLive(type, fn) {
        if (!liveHandlers.has(type)) liveHandlers.set(type, new Set());
        const h = (e) => { if (e.key === key) fn(e); };
        liveHandlers.get(type).add(h); cleanups.push(() => liveHandlers.get(type).delete(h));
      },
      award: (amount, reason) => bus.emit('points:award', { amount, reason }),
      result: (r) => bus.emit('game:result', { ...r, roomId: room?.id }),
      linkPreview: (url) => backend.linkPreview(url),
      open: (otherId, extra = {}) => openActivity(otherId, { item, room, ...extra }),
      close: () => ui.closePanel(),
      onClose: (fn) => cleanups.push(fn),
      _cleanup: () => cleanups.forEach((fn) => { try { fn(); } catch {} }),
    };
    return api;
  }

  function openActivity(id, { item = null, room = null, key = null } = {}) {
    const act = REGISTRY[id];
    if (!act) return ui.toast(`"${id}" is coming soon`);
    const k = key || item?.data?.key || `${room?.id || 'house'}:${item?.id || id}:${id}`;
    const api = makeApi({ id, item, room, key: k });
    let body;
    try { body = act.open(api); } catch (e) { console.error(e); body = ui.h('p', { class: 'error' }, 'This activity crashed: ' + e.message); }
    if (!body) return api._cleanup(); // activities like "invite" just open another panel
    ui.panel({ title: `${act.icon} ${item?.data?.label || act.title}`, body, wide: act.wide, onClose: api._cleanup });
  }

  bus.on('item:activate', ({ item, room }) => {
    const def = ctx.use('build.itemDef')(item.kind);
    const id = item.activity || def?.activity;
    if (id) openActivity(id, { item, room });
  });

  ctx.provide('activities.open', openActivity);
  ctx.provide('activities.list', () => Object.entries(REGISTRY).map(([id, a]) => ({ id, title: a.title, icon: a.icon })));
  ui.addDockButton({ id: 'play', icon: '🎲', label: 'Play', onClick: () => openActivity('games', { room: store.get().house?.rooms.find((r) => r.id === store.get().roomId) }), order: 35 });
  // Trip planner in the "⋯ More" ribbon, so every house can plan a trip (not only rooms with a globe)
  ui.addDockButton({ id: 'trip', icon: '✈️', label: 'Trips', onClick: () => openActivity('trip', { key: 'house:trip-planner' }), order: 45, group: 'more' });
}
