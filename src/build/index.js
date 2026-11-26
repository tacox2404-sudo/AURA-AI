// BUILDING AREA - entry point. Owner: Building.
// Build mode (place / rotate / move / delete), the Rooms panel, the AI room creator,
// and the services other areas use to draw furniture and make houses.

import { CATALOG_BY_ID } from './catalog.js';
import { openCatalogue, injectBuildStyles } from './catalogue.js';
import { thumbInto, thumbFor } from './thumbs.js';
import { VIBES, HOUSE_TYPES, makeHouseDraft, makeRoom, arrangeRoom } from './templates.js';
import { BLUEPRINTS, EXTRAS, MAIN_ROOMS, MAX_BEDROOMS, MAX_BATHROOMS, MAX_ROOMS, presetsFor, choicesOf, planRooms, summaryOf } from './presets.js';
import { createAiRoom } from './aiRoom.js';
import { canEdit, currentRoom, uid } from '../core/store.js';

export function initBuild(ctx) {
  const { bus, store, ui, backend } = ctx;
  const { h } = ui;

  // ---------- services for other areas ----------
  ctx.provide('build.itemMesh', (item, theme) => {
    const def = CATALOG_BY_ID[item.kind];
    return def ? def.build(theme) : null;
  });
  ctx.provide('build.footprint', (item) => {
    const def = CATALOG_BY_ID[item.kind];
    const [w, d] = def?.size || [1, 1];
    return item.rot % 2 ? [d, w] : [w, d];
  });
  ctx.provide('build.itemDef', (kind) => CATALOG_BY_ID[kind] || null);
  ctx.provide('build.thumb', (kind, theme) => (CATALOG_BY_ID[kind] ? thumbFor(CATALOG_BY_ID[kind], theme) : ''));
  ctx.provide('build.catalog', () => CATALOG_BY_ID);
  ctx.provide('build.makeHouse', (answers) => makeHouseDraft(answers));
  ctx.provide('build.houseTypes', () => HOUSE_TYPES);
  // for the "new house" wizard (Social): the layout presets and a live preview of the rooms a set of choices gives
  ctx.provide('build.layoutOptions', (type) => ({
    presets: presetsFor(type).map((p) => ({ id: p.id, name: p.name, emoji: p.emoji, blurb: p.blurb, choices: choicesOf(p), rooms: planRooms(type, choicesOf(p)).length })),
    mains: MAIN_ROOMS[type] || MAIN_ROOMS.solo,
    extras: [...EXTRAS].sort((a, b) => Number(b.for.includes(type)) - Number(a.for.includes(type))).map((e) => ({ id: e.id, name: e.name, emoji: e.emoji, recommended: e.for.includes(type) })),
    maxBedrooms: MAX_BEDROOMS, maxBathrooms: MAX_BATHROOMS, maxRooms: MAX_ROOMS,
  }));
  ctx.provide('build.planRooms', (type, choices) => { const plan = planRooms(type, choices).map((r) => ({ ...r, emoji: BLUEPRINTS[r.blueprint]?.emoji || '🚪' })); return { plan, ...summaryOf(plan) }; });
  ctx.provide('build.vibes', () => VIBES);

  injectBuildStyles();
  const save = (house) => ctx.use('house.save')(house);

  // ---------- build mode ----------
  let selectedKind = null;   // palette item to place
  let selectedItemId = null; // placed item being edited
  let moving = false;
  const RECENT_KEY = 'op:build:recent'; // the last things you placed, for quick access
  const recentKinds = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter((k) => CATALOG_BY_ID[k]).slice(0, 6); } catch { return []; } };
  const rememberKind = (k) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify([k, ...recentKinds().filter((x) => x !== k)].slice(0, 6))); } catch { /* storage blocked */ } };
  const bar = h('div', { class: 'buildbar hidden' });
  ui.root.append(bar);

  function enterBuild() {
    if (!canEdit(store.get().role)) return ui.toast('Only housemates can build here');
    store.set({ mode: 'build' });
  }
  function exitBuild() { selectedKind = null; selectedItemId = null; moving = false; store.set({ mode: 'play' }); }

  function renderBar() {
    const s = store.get();
    const on = s.mode === 'build';
    bar.classList.toggle('hidden', !on);
    ui.setDockVisible(!on);
    if (!on) return;
    const room = currentRoom(s);
    const sel = room?.items.find((i) => i.id === selectedItemId);
    const selBar = sel ? h('div', { class: 'sel-bar' },
      h('b', {}, CATALOG_BY_ID[sel.kind]?.name || sel.kind),
      h('button', { onclick: () => editItem(sel, (it) => { it.rot = (it.rot + 1) % 4; }) }, '⟳ Rotate'),
      h('button', { class: moving ? 'on' : '', onclick: () => { moving = !moving; renderBar(); ui.toast(moving ? 'Tap the floor to move it' : 'Move cancelled'); } }, '✥ Move'),
      CATALOG_BY_ID[sel.kind]?.activity === 'portal' || CATALOG_BY_ID[sel.kind]?.activity === 'links'
        ? h('button', { onclick: () => labelPrompt(sel) }, '🔗 Link') : null,
      h('button', { class: 'danger', onclick: () => removeItem(sel) }, '🗑 Delete'),
      h('button', { onclick: () => { selectedItemId = null; moving = false; renderBar(); } }, 'Done'),
    ) : null;
    const theme = room?.theme || { floor: '#c8a27a', wall: '#f3e6d3', accent: '#c4553a', wood: '#8b5e3c' };
    const openCat = () => { bar.classList.add('hidden'); openCatalogue(ctx, { theme, startKind: selectedKind, onPick: pickKind, onClose: () => renderBar() }); }; // the bar steps aside while you shop
    const pic = (kind) => { const img = h('img', { class: 'bb-pic', alt: '' }); thumbInto(img, CATALOG_BY_ID[kind], theme); return img; };
    // while a catalogue item is chosen: show what it is, and where to tap
    const placingDef = CATALOG_BY_ID[selectedKind];
    const placingBar = placingDef ? h('div', { class: 'sel-bar' },
      pic(selectedKind),
      h('span', { class: 'bb-info' }, h('b', {}, `Placing: ${placingDef.name}`), h('small', {}, 'Tap the floor where it should go')),
      h('button', { onclick: openCat }, '🛍️ Catalogue'),
      h('button', { onclick: () => { selectedKind = null; renderBar(); } }, '✕ Cancel')) : null;
    const quick = h('div', { class: 'palette' },
      h('button', { class: 'primary cat-open', onclick: openCat }, '🛍️ Catalogue'),
      ...recentKinds().map((k) => h('button', { class: 'pal-item', title: CATALOG_BY_ID[k].desc, onclick: () => pickKind(k) }, pic(k), h('span', {}, CATALOG_BY_ID[k].name))));
    bar.replaceChildren(
      h('div', { class: 'buildbar-top' },
        h('b', { class: 'bb-title' }, '🛠️ Build'),
        h('button', { class: 'primary small', onclick: exitBuild }, '✓ Done')),
      selBar || placingBar || quick);
  }

  // choose an item from the catalogue (or the quick row) to place
  function pickKind(kind) {
    selectedKind = selectedKind === kind ? null : kind;
    if (selectedKind) { rememberKind(kind); ui.toast(`Tap the floor to place the ${CATALOG_BY_ID[kind].name.toLowerCase()}`); }
    renderBar();
  }

  function editItem(item, fn) {
    const s = store.get();
    const house = structuredClone(s.house);
    const room = house.rooms.find((r) => r.id === s.roomId);
    const it = room.items.find((i) => i.id === item.id);
    fn(it, room);
    save(house);
  }
  function removeItem(item) {
    const s = store.get();
    const house = structuredClone(s.house);
    const room = house.rooms.find((r) => r.id === s.roomId);
    room.items = room.items.filter((i) => i.id !== item.id);
    selectedItemId = null; moving = false;
    save(house); renderBar();
  }
  async function labelPrompt(item) {
    const res = await ui.ask({ title: '🔗 Link this object', text: 'A watch party, a game, a playlist, a booking page…', ok: 'Save', fields: [
      { label: 'Website', value: item.data?.url || 'https://' }, { label: 'Label shown when tapped', value: item.data?.label || '' }] });
    if (!res) return;
    editItem(item, (it) => { it.data = { ...(it.data || {}), url: res[0].trim(), label: res[1].trim() }; });
  }

  function fitsAt(room, kind, rot, x, z, ignoreId) {
    const def = CATALOG_BY_ID[kind];
    const [w, d] = rot % 2 ? [def.size[1], def.size[0]] : def.size;
    if (x < 0 || z < 0 || x + w > room.size[0] || z + d > room.size[1]) return false;
    if (def.floorOnly) return true;
    return !room.items.some((o) => {
      if (o.id === ignoreId || CATALOG_BY_ID[o.kind]?.floorOnly) return false;
      const od = CATALOG_BY_ID[o.kind]; if (!od) return false;
      const [ow, odp] = o.rot % 2 ? [od.size[1], od.size[0]] : od.size;
      return x < o.x + ow && x + w > o.x && z < o.z + odp && z + d > o.z;
    });
  }

  bus.on('world:tap', ({ target, cell, item }) => {
    const s = store.get();
    if (s.mode !== 'build') return;
    const room = currentRoom(s);
    if (!room) return;
    if (target === 'item' && !moving) { selectedItemId = item.id; selectedKind = null; renderBar(); return; }
    if (!cell) return;
    if (moving && selectedItemId) {
      const it = room.items.find((i) => i.id === selectedItemId);
      if (!fitsAt(room, it.kind, it.rot, cell.x, cell.z, it.id)) return ui.toast("It doesn't fit there");
      editItem(it, (x) => { x.x = cell.x; x.z = cell.z; });
      moving = false; renderBar(); return;
    }
    if (selectedKind) {
      if (!fitsAt(room, selectedKind, 0, cell.x, cell.z)) return ui.toast("It doesn't fit there");
      const house = structuredClone(s.house);
      house.rooms.find((r) => r.id === room.id).items.push({ id: uid('i_'), kind: selectedKind, x: cell.x, z: cell.z, rot: 0 });
      save(house);
      bus.emit('points:award', { amount: 1, reason: 'decorated' });
    }
  });

  store.subscribe((s, prev) => {
    if (s.mode !== prev.mode || s.house !== prev.house || s.roomId !== prev.roomId) renderBar();
    if (s.role !== prev.role) ui.refreshDock(s);
  });

  // ---------- Rooms panel ----------
  function openRooms() {
    const s = store.get();
    const editor = canEdit(s.role);
    const list = h('div', { class: 'list' }, ...s.house.rooms.map((r) => h('div', { class: 'row' },
      h('button', { class: 'row-main' + (r.id === s.roomId ? ' active' : ''), onclick: () => { ui.closePanel(); bus.emit('room:goto', { roomId: r.id }); } },
        h('span', { class: 'swatch', style: { background: r.theme.accent } }), r.name, h('small', {}, `${r.items.length} items`)),
      editor ? h('button', { class: 'icon-btn', title: 'Arrange the furniture nicely', onclick: () => arrangeNicely(r) }, '✨') : null,
      editor ? h('button', { class: 'icon-btn', title: 'Rename', onclick: () => renameRoom(r) }, '✎') : null,
      editor && s.house.rooms.length > 1 ? h('button', { class: 'icon-btn', title: 'Delete', onclick: () => deleteRoom(r) }, '🗑') : null)));

    const aiInput = h('input', { placeholder: 'e.g. cozy movie room, travel planning, spa…', maxlength: 80 });
    const vibeSel = h('select', {}, ...Object.entries(VIBES).map(([k, v]) => h('option', { value: k, selected: k === s.house.vibe }, v.label)));
    const createBtn = h('button', { class: 'primary', onclick: async () => {
      const text = aiInput.value.trim();
      if (!text) return ui.toast('Describe the room first');
      createBtn.disabled = true; createBtn.textContent = 'Creating…';
      const { room, usedAi } = await createAiRoom(backend, text, vibeSel.value);
      addRoom(room);
      ui.toast(usedAi ? `✨ AI made "${room.name}"` : `Made "${room.name}" (keyword mode, no AI key yet)`);
    } }, '✨ Create room');
    const emptyBtn = h('button', { onclick: () => addRoom(makeRoom({ name: aiInput.value.trim() || 'New Room', vibe: vibeSel.value, kinds: ['rug', 'lamp'] })) }, 'Empty room');

    ui.panel({ title: 'Rooms', body: h('div', {}, list,
      editor ? h('div', { class: 'card' }, h('h4', {}, 'Add a room'), h('p', { class: 'muted' }, 'Describe it and the AI builds it from the furniture catalog.'), aiInput, h('label', {}, 'Vibe ', vibeSel), h('div', { class: 'row-btns' }, createBtn, emptyBtn))
        : h('p', { class: 'muted' }, 'Guests can visit and play. Ask a housemate to add rooms.')) });
  }
  function addRoom(room) {
    const house = structuredClone(store.get().house);
    house.rooms.push(room);
    save(house).then(() => { ui.closePanel(); bus.emit('room:goto', { roomId: room.id }); });
    bus.emit('points:award', { amount: 15, reason: 'created a room' });
  }
  async function renameRoom(r) {
    const res = await ui.ask({ title: 'Rename room', fields: [{ value: r.name }], ok: 'Save' });
    const name = res?.[0]?.trim(); if (!name) return;
    const house = structuredClone(store.get().house);
    house.rooms.find((x) => x.id === r.id).name = name.slice(0, 30);
    save(house).then(openRooms);
  }
  // Re-arrange the furniture of an existing room like a real room (sofa facing the TV, chairs around tables...).
  // Every piece stays, only positions and turns change.
  async function arrangeNicely(r) {
    if (!(await ui.confirm(`Arrange "${r.name}" nicely?`, 'Your furniture stays, but every piece moves to a better spot (sofas face the TV, chairs go round tables). You can still move things in Build mode.', 'Arrange'))) return;
    const house = structuredClone(store.get().house);
    const room = house.rooms.find((x) => x.id === r.id);
    room.items = arrangeRoom(room);
    save(house).then(() => { ui.toast('✨ Room arranged!'); openRooms(); });
  }
  async function deleteRoom(r) {
    if (!(await ui.confirm(`Delete "${r.name}"?`, 'Everything in this room will be removed.', 'Delete'))) return;
    const house = structuredClone(store.get().house);
    house.rooms = house.rooms.filter((x) => x.id !== r.id);
    save(house).then(() => { bus.emit('room:goto', { roomId: house.rooms[0].id }); openRooms(); });
  }

  ui.addDockButton({ id: 'rooms', icon: '🚪', label: 'Rooms', onClick: openRooms, order: 10 });
  ui.addDockButton({ id: 'build', icon: '🛠️', label: 'Build', onClick: enterBuild, order: 20, visible: (s) => !s || canEdit(s.role) });
}
