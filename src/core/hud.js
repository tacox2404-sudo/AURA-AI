// Top bar: the room switcher (a dropdown), my points, who is online, the menu. (Owned by the lead.)
//
// The room switcher shows the room you are in. Tap it: all rooms, grouped by floor like the building (top
// floor first), with the people who are in each room, and a list of everyone online with where they are.
// Tap a room or a person to go there. (Rooms are stacked two per floor, in the order of house.rooms.)

import { canEdit } from './store.js';

const PER_FLOOR = 2;
const floorName = (f, count) => (f === 0 ? 'Ground floor' : f === count - 1 ? 'Penthouse' : `Floor ${f}`);

/** [{ level, name, rooms: [room] }] from the bottom floor up. */
export function floorsOf(house) {
  const rooms = house?.rooms || [];
  const floors = [];
  for (let i = 0; i < rooms.length; i += PER_FLOOR) floors.push({ level: floors.length, rooms: rooms.slice(i, i + PER_FLOOR) });
  floors.forEach((f) => { f.name = floorName(f.level, floors.length); });
  return floors;
}

export function initHud(ctx) {
  const { store, ui, bus } = ctx; const { h } = ui;
  let myPoints = 0;
  let menu = null; // the open dropdown, if any

  const roomOf = (s, id) => s.house?.rooms.find((r) => r.id === id);
  const floorOfRoom = (s, id) => floorsOf(s.house).find((f) => f.rooms.some((r) => r.id === id));

  function closeMenu() { menu?.remove(); menu = null; }
  function go(roomId) { closeMenu(); bus.emit('room:goto', { roomId }); }

  function drawMenu() {
    if (!menu) return;
    const s = store.get();
    if (!s.house) return closeMenu();
    const floors = floorsOf(s.house);
    const online = s.players.filter((p) => p.roomId);
    const who = online.length ? h('div', { class: 'rm-online' }, h('div', { class: 'rm-floor' }, `🟢 Online now (${online.length + 1})`),
      ...online.map((p) => {
        const room = roomOf(s, p.roomId); const fl = floorOfRoom(s, p.roomId);
        return h('button', { class: 'rm-row', onclick: () => go(p.roomId) },
          h('span', { class: 'rm-name' }, `🟢 ${p.name || 'friend'}`), h('small', {}, `${room?.name || '?'} · ${fl?.name || ''} · ${p.roomId === s.roomId ? 'with you' : 'go there'}`));
      })) : h('p', { class: 'muted small', style: { margin: '4px 10px' } }, 'Nobody else is online right now.');
    menu.replaceChildren(who, ...[...floors].reverse().map((f) => h('div', { class: 'rm-floorbox' },
      h('div', { class: 'rm-floor' }, `${f.name}`),
      ...f.rooms.map((r) => {
        const here = s.players.filter((p) => p.roomId === r.id);
        return h('button', { class: 'rm-row' + (r.id === s.roomId ? ' active' : ''), onclick: () => go(r.id) },
          h('span', { class: 'rm-name' }, r.name),
          h('span', { class: 'rm-who' }, r.id === s.roomId ? h('i', { class: 'rm-you' }, 'You') : null, ...here.map((p) => h('i', {}, p.name || 'friend'))));
      }))));
  }
  function toggleMenu() {
    if (menu) return closeMenu();
    menu = h('div', { class: 'room-menu' });
    ui.root.append(menu);
    drawMenu();
  }
  document.addEventListener('pointerdown', (e) => { if (menu && !menu.contains(e.target) && !e.target.closest?.('.room-switch, .pill.online')) closeMenu(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  function render() {
    const s = store.get();
    if (!s.house) return;
    const room = roomOf(s, s.roomId);
    ui.setTopbar({
      left: h('button', { class: 'room-switch', title: 'Rooms and people', onclick: toggleMenu },
        h('span', { class: 'rs-name' }, `🚪 ${room?.name || 'Rooms'}`), h('span', { class: 'rs-caret' }, '▾')),
      right: h('div', { class: 'topbar-right' },
        h('button', { class: 'pill', title: 'Scores', onclick: () => ctx.use('points.open')() }, `⭐ ${myPoints}`),
        s.players.length ? h('button', { class: 'pill online', title: 'Who is where', onclick: toggleMenu }, `🟢 ${s.players.length + 1}`) : null,
        h('button', { class: 'icon-btn', 'aria-label': 'Menu', onclick: () => ctx.use('social.openMenu')() }, '☰')),
    });
  }
  let drawTimer = null;
  store.subscribe((s, prev) => {
    if (s.house !== prev.house || s.roomId !== prev.roomId || s.players.length !== prev.players.length) render();
    if (menu && (s.players !== prev.players || s.roomId !== prev.roomId || s.house !== prev.house)) { // keep "who is where" fresh, but not every frame
      clearTimeout(drawTimer); drawTimer = setTimeout(drawMenu, 400);
    }
    if (s.role !== prev.role || s.house !== prev.house) ui.refreshDock(s);
  });
  bus.on('points:changed', ({ mine }) => { myPoints = mine; render(); });
  bus.on('house:left', closeMenu);
  return { canEdit };
}
