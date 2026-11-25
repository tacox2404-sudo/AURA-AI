// SOCIAL AREA - entry point. Owner: Social.
// Accounts, houses (create / join / switch), invites and roles, the live connection,
// people online, chat and points.

import { loginScreen, housePicker, onboarding, friendly } from './screens.js';
import { loadingLine, knockLine } from './fun.js';
import { initChat } from './chat.js';
import { initPoints } from './points.js';

export function initSocial(ctx) {
  const { ui, store, backend, bus } = ctx; const { h } = ui;
  let conn = null;
  let joinParam = new URLSearchParams(location.search).get('join') || ''; // invite code from the link; cleared once used

  // ---------- services ----------
  ctx.provide('live.presence', (p) => conn?.updatePresence(p));
  ctx.provide('live.send', (e) => conn?.send(e));
  ctx.provide('house.save', async (house) => {
    store.set({ house });                 // show the change immediately
    try { await backend.saveHouse(house); }
    catch (e) { console.warn('[house.save]', e.message); return house; } // e.g. guests can't edit the house
    conn?.send({ type: 'house-updated' }); // tell everyone else to reload
    return house;
  });
  ctx.provide('social.signOut', signOut);
  ctx.provide('social.switchHouse', () => showPicker());

  initChat(ctx);
  initPoints(ctx);

  // ---------- flow: login -> pick house -> enter ----------
  async function start() {
    ui.setDockVisible(false);
    const me = await backend.getSession();
    if (!me) return loginScreen(ctx, { onDone: (u) => afterLogin(u), invited: !!joinParam });
    afterLogin(me);
  }

  async function afterLogin(me) {
    store.set({ me });
    if (joinParam) {
      ui.toast(knockLine());
      try {
        const { house, role } = await backend.joinWithCode(joinParam, me);
        joinParam = ''; history.replaceState(null, '', location.pathname);
        ui.toast(`You joined ${house.name} as ${role} 🎉`);
        return enterHouse(house, role);
      } catch (e) { ui.toast(friendly(e.message)); }
    }
    const houses = await backend.listMyHouses(me.id);
    const lastId = safeGet('op:lastHouse');
    const last = houses.find((x) => x.id === lastId);
    if (last) return openHouse(last);
    showPicker();
  }

  async function showPicker() {
    leaveHouse();
    ui.setDockVisible(false);
    const me = store.get().me;
    const houses = await backend.listMyHouses(me.id);
    housePicker(ctx, {
      me, houses, joinCode: joinParam,
      onOpen: openHouse,
      onCreate: () => onboarding(ctx, { me, onCancel: showPicker, onDone: createHouse }),
      onJoin: async (code) => { ui.toast(knockLine()); const { house, role } = await backend.joinWithCode(code, me); joinParam = ''; enterHouse(house, role); },
      onLogout: signOut,
    });
  }

  async function openHouse(house) {
    const fresh = await backend.getHouse(house.id);
    const me = store.get().me;
    enterHouse(fresh, fresh.members?.[me.id]?.role || 'guest');
  }

  async function createHouse(answers) {
    ui.toast(loadingLine());
    const draft = ctx.use('build.makeHouse')(answers);
    const house = await backend.createHouse(draft, store.get().me);
    await enterHouse(house, 'owner');
    if (!store.get().me.avatar) ctx.use('world.openWardrobe')(true);
    ui.toast(`Welcome to ${house.name}! Invite people from 👥 People.`);
  }

  async function enterHouse(house, role) {
    leaveHouse();
    safeSet('op:lastHouse', house.id);
    const me = store.get().me;
    store.set({ house, role, roomId: house.rooms[0]?.id, players: [], mode: 'play' });
    ui.closeScreen();
    ui.setDockVisible(true);
    ui.refreshDock(store.get());
    conn = backend.connect(house.id, me, {
      onPresence: (players) => store.set({ players }),
      onEvent: handleEvent,
    });
    // tell everyone already inside to reload (e.g. so they see a new member's name)
    setTimeout(() => conn?.send({ type: 'house-updated' }), 600);
    bus.emit('house:entered', { house, role });
    if (!me.avatar) setTimeout(() => ctx.use('world.openWardrobe')(true), 400);
  }

  function leaveHouse() {
    if (conn) { conn.leave(); conn = null; }
    if (store.get().house) { store.set({ house: null, role: null, roomId: null, players: [] }); bus.emit('house:left'); }
  }

  let reloadTimer = null;
  async function handleEvent(e) {
    if (e.type === 'house-updated') {
      clearTimeout(reloadTimer);
      reloadTimer = setTimeout(async () => {
        const s = store.get(); if (!s.house) return;
        const house = await backend.getHouse(s.house.id);
        // someone removed me (or I left on another device): go back to the house list
        if (!house || !house.members?.[s.me.id]) { ui.closePanel(); ui.toast('You are no longer in this house'); showPicker(); return; }
        const roomId = house.rooms.some((r) => r.id === s.roomId) ? s.roomId : house.rooms[0]?.id;
        store.set({ house, roomId, role: house.members?.[s.me.id]?.role || s.role });
      }, 150);
      return;
    }
    bus.emit(`live:${e.type}`, e); // e.g. live:chat, live:state, live:points, live:draw
  }

  async function signOut() {
    leaveHouse();
    await backend.signOut();
    store.set({ me: null });
    start();
  }

  // ---------- People + invites ----------
  function openPeople() {
    const s = store.get();
    const online = new Set(s.players.map((p) => p.userId));
    online.add(s.me.id);
    const base = location.origin + location.pathname;
    const isEditor = s.role === 'owner' || s.role === 'housemate';
    const inviteBlock = (label, code, role) => {
      const link = `${base}?join=${code}`;
      const message = role === 'housemate'
        ? `Come build "${s.house.name}" with me on OurPlace! 🏠\nOpen: ${link}\nor enter code ${code}`
        : `You're invited to visit "${s.house.name}" on OurPlace! 🏠\nOpen: ${link}\nor enter code ${code}`;
      return h('div', { class: 'card invite' },
        h('b', {}, label), h('div', { class: 'code' }, code),
        h('div', { class: 'row-btns' },
          h('button', { onclick: () => copy(message) }, '📋 Copy invite message'),
          h('button', { onclick: () => copy(link) }, '🔗 Copy link'),
          navigator.share ? h('button', { onclick: () => navigator.share({ title: 'OurPlace', text: message }).catch(() => {}) }, '📤 Share') : null));
    };
    // who may change whom (same rules as the backend): housemates handle guests, the owner handles housemates
    const canManage = (m) => m.role !== 'owner' && (s.role === 'owner' || (s.role === 'housemate' && m.role === 'guest'));
    const memberRow = ([id, m]) => h('div', { class: 'row' },
      h('span', { class: 'dot' + (online.has(id) ? ' on' : '') }),
      h('span', { class: 'row-main' }, m.name + (id === s.me.id ? ' (you)' : '')),
      h('small', {}, m.role),
      id !== s.me.id && canManage(m) ? h('span', { class: 'row-btns' },
        m.role === 'guest'
          ? h('button', { title: 'Make housemate', onclick: () => changeRole(id, m, 'housemate') }, '⬆️')
          : h('button', { title: 'Make guest', onclick: () => changeRole(id, m, 'guest') }, '⬇️'),
        h('button', { title: 'Remove from house', onclick: () => removePerson(id, m) }, '🚫')) : null);
    ui.panel({ title: '👥 People', body: h('div', {},
      h('div', { class: 'list' }, ...Object.entries(s.house.members || {}).map(memberRow)),
      h('h4', {}, 'Invite people'),
      isEditor ? inviteBlock('Housemate code: can build and decorate', s.house.inviteCode, 'housemate') : null,
      inviteBlock('Guest code: can visit, chat and play', s.house.guestCode, 'guest'),
      backend.mode === 'demo' ? h('p', { class: 'muted small' }, 'Demo mode: invites only work in this browser. Set up Supabase (docs/SETUP.md) to invite people on other phones.') : null) });
  }
  // Promote / demote / remove, with a confirm first. Then tell everyone else to reload.
  async function afterMembersChanged(house, message) {
    store.set({ house });
    conn?.send({ type: 'house-updated' });
    ui.toast(message);
    openPeople(); // redraw the list
  }
  async function changeRole(id, m, role) {
    const house = store.get().house;
    const ok = await ui.confirm(role === 'housemate' ? `Make ${m.name} a housemate?` : `Make ${m.name} a guest?`,
      role === 'housemate' ? 'They will be able to build and decorate.' : 'They will only be able to visit, chat and play.', 'Yes');
    if (!ok) return;
    try { await afterMembersChanged(await backend.setMemberRole(house.id, id, role), `${m.name} is now a ${role}`); }
    catch (e) { ui.toast(friendly(e.message)); }
  }
  async function removePerson(id, m) {
    const house = store.get().house;
    const ok = await ui.confirm(`Remove ${m.name}?`, 'They will lose access to this house. They can rejoin with a code.', 'Remove');
    if (!ok) return;
    try { await afterMembersChanged(await backend.removeMember(house.id, id), `${m.name} was removed`); }
    catch (e) { ui.toast(friendly(e.message)); }
  }
  async function quitHouse() {
    const s = store.get();
    const ok = await ui.confirm(`Leave ${s.house.name}?`, 'You will lose access until someone invites you again.', 'Leave');
    if (!ok) return;
    try {
      await backend.leaveHouse(s.house.id);
      conn?.send({ type: 'house-updated' }); // others reload and see you are gone
      safeSet('op:lastHouse', '');
      ui.closePanel(); ui.toast(`You left ${s.house.name}`);
      showPicker();
    } catch (e) { ui.toast(friendly(e.message)); }
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); ui.toast('Copied!'); }
    catch { ui.ask({ title: 'Copy this', text, ok: 'Done' }); }
  }
  ctx.provide('social.openPeople', openPeople);
  ui.addDockButton({ id: 'people', icon: '👥', label: 'People', onClick: openPeople, order: 50 });

  // ---------- house menu ----------
  ctx.provide('social.openMenu', () => {
    const s = store.get();
    ui.panel({ title: s.house?.name || 'Menu', body: h('div', { class: 'list' },
      h('button', { class: 'row-main', onclick: () => { ui.closePanel(); showPicker(); } }, '🏘️ Switch or create house'),
      h('button', { class: 'row-main', onclick: () => { ui.closePanel(); openPeople(); } }, '👥 Invite people'),
      h('button', { class: 'row-main', onclick: () => { ui.closePanel(); ctx.use('world.openWardrobe')(false); } }, '👕 Wardrobe'),
      s.role !== 'owner' ? h('button', { class: 'row-main', onclick: () => { ui.closePanel(); quitHouse(); } }, '👋 Leave this house') : null,
      h('button', { class: 'row-main', onclick: () => { ui.closePanel(); signOut(); } }, '🚪 Log out'),
      h('p', { class: 'muted small' }, `Signed in as ${s.me?.username} · ${backend.mode === 'demo' ? 'Demo mode (this browser only)' : 'Online'}`)) });
  });

  start();
}

function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch {} }
