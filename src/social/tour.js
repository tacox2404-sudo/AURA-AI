// TOUR + GUIDE MENU (owned by Social): decides WHEN Pip appears and gives the player a way to
// bring Pip back. Pip's looks are in guide.js, Pip's lines in guideScripts.js.
//
// - First time on this account: a short hello, then an offer of a tour of the house.
// - First time in any NEW house (also a friend's house you visit): Pip offers that house's tour.
// - Always available: ❓ Guide (dock button + menu): replay the tour, explain this room,
//   explain any object (tap it), cheat sheet, and "stop auto tours".
// - Kill switch for tests: localStorage op:guide:off = '1'.

import { createGuide } from './guide.js';
import { welcomeSteps, offerSteps, houseTourSteps, roomSteps, itemSteps, CHEAT_SHEET } from './guideScripts.js';

const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked: Pip may repeat, no harm */ } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function initTour(ctx) {
  const { ui, store, bus } = ctx; const { h } = ui;
  const guide = createGuide(ctx);
  const defOf = (kind) => { try { return ctx.use('build.itemDef')(kind); } catch { return null; } };
  const keyOf = (suffix) => `op:guide:${store.get().me?.id || 'anon'}:${suffix}`;
  const autoOff = () => safeGet('op:guide:off') === '1' || safeGet(keyOf('off')) === '1';

  // ---------- automatic tours ----------
  bus.on('house:entered', async ({ house, role }) => {
    if (autoOff() || !store.get().me) return;
    await wait(1200); // let the scene settle
    // the first-time wardrobe sheet should finish before Pip talks
    for (let i = 0; i < 120 && ui.isPanelOpen?.(); i += 1) await wait(500);
    if (store.get().house?.id !== house.id || guide.playing()) return;

    const houseKey = keyOf(`house:${house.id}`);
    if (!safeGet(keyOf('welcome'))) {
      safeSet(keyOf('welcome'), '1');
      const r = await guide.play(welcomeSteps(store.get().me));
      if (r === 'skipped') { safeSet(houseKey, '1'); return; } // skipped the hello: skip everything
    }
    if (safeGet(houseKey) || store.get().house?.id !== house.id) return;
    safeSet(houseKey, '1');
    if ((await guide.play(offerSteps(house, role))) === 'yes') await playHouseTour();
  });

  // ---------- on demand ----------
  async function playHouseTour() {
    const { house, role } = store.get();
    if (!house) return;
    const from = store.get().roomId;
    const r = await guide.play(houseTourSteps(house, role, defOf));
    if (from && store.get().house?.id === house.id) bus.emit('room:goto', { roomId: from }); // back where I was
    return r;
  }
  async function explainRoom() {
    const { house, roomId } = store.get();
    const room = house?.rooms.find((r) => r.id === roomId);
    if (room) await guide.play(roomSteps(room, house, defOf));
  }

  // "What is this?": tap any object and Pip explains it. Uses mode 'help' so taps don't open the object.
  let helpChip = null;
  function stopHelp() { helpChip?.remove(); helpChip = null; if (store.get().mode === 'help') store.set({ mode: 'play' }); }
  function startExplainMode() {
    if (store.get().mode === 'build') return ui.toast('Finish building first (tap Done), then ask me about objects.');
    ui.closePanel();
    store.set({ mode: 'help' });
    helpChip = h('div', { class: 'card', style: { position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 5, display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 14px' } },
      h('span', {}, '🔎 Tap an object and Pip explains it'), h('button', { class: 'link', onclick: stopHelp }, '✕ Stop'));
    document.body.append(helpChip);
  }
  bus.on('world:tap', async ({ target, item }) => {
    if (store.get().mode !== 'help') return;
    if (target !== 'item' || !item) return ui.toast('Tap an object, not the floor 😄');
    stopHelp();
    await guide.play(itemSteps(item, defOf(item.kind)), { skipLabel: 'Close' });
  });
  bus.on('house:left', stopHelp);

  // ---------- the ❓ Guide menu ----------
  function openGuide() {
    const off = safeGet(keyOf('off')) === '1';
    const row = (label, fn) => h('button', { class: 'row-main', onclick: () => { ui.closePanel(); fn(); } }, label);
    ui.panel({ title: '❓ Pip, your guide', body: h('div', { class: 'list' },
      row('🎬 Replay the tour of this house', playHouseTour),
      row('🚪 Explain this room', explainRoom),
      row('🔎 What is this object? (tap it)', startExplainMode),
      row('📜 Cheat sheet: what can I do here?', openCheatSheet),
      row(off ? '🔔 Turn automatic tours back on' : '🙈 Stop automatic tours', () => { safeSet(keyOf('off'), off ? '0' : '1'); ui.toast(off ? 'Pip will offer tours again 🎉' : 'Okay, Pip will only come when called 🙈'); }),
      h('p', { class: 'muted small' }, 'Pip lives under ⋯ More (right edge) → ❓ Guide.')) });
  }
  function openCheatSheet() {
    ui.panel({ title: '📜 What can I do here?', body: h('div', { class: 'list' },
      ...CHEAT_SHEET.map(([name, text]) => h('div', { class: 'row' }, h('b', {}, name), h('small', { style: { display: 'block' } }, text)))) });
  }
  ctx.provide('social.openGuide', openGuide);
  ui.addDockButton({ id: 'guide', icon: '❓', label: 'Guide', onClick: openGuide, order: 80, group: 'more' });
  return { openGuide, playHouseTour };
}
