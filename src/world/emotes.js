// EMOTES (owned by World): a 😊 button next to the camera button opens a row of emotes
// (wave, dance, cheer, jump, laugh, sleep, heart). Your avatar acts it out, a big emoji floats
// up over your head, and everybody in the room sees it (live event 'emote').
// Hearts are only offered in Love Nest houses (house.type 'love').

import * as THREE from 'three';
import { playEmote } from './avatar.js';

export const EMOTES = [
  { id: 'wave', icon: '👋', label: 'Wave' },
  { id: 'dance', icon: '💃', label: 'Dance' },
  { id: 'cheer', icon: '🙌', label: 'Cheer' },
  { id: 'jump', icon: '🎉', label: 'Jump' },
  { id: 'laugh', icon: '😂', label: 'Laugh' },
  { id: 'sleep', icon: '💤', label: 'Sleepy' },
  { id: 'heart', icon: '❤️', label: 'Love', love: true },
];
const BY_ID = Object.fromEntries(EMOTES.map((e) => [e.id, e]));

/** A big emoji that floats up from an avatar's head and fades. */
export function floatEmoji(scene, holder, icon) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d'); g.font = '96px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(icon, 64, 72);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(0.8, 0.8, 1); sp.renderOrder = 12; sp.position.set(0, 2.3, 0);
  holder.add(sp);
  const start = performance.now();
  const tick = () => {
    const t = (performance.now() - start) / 1000;
    sp.position.y = 2.3 + t * 0.5; sp.material.opacity = Math.max(0, 1 - Math.max(0, t - 1.2) / 0.8);
    sp.scale.setScalar(0.8 + Math.min(0.25, t * 0.8));
    if (t < 2) requestAnimationFrame(tick); else { holder.remove(sp); tex.dispose(); sp.material.dispose(); }
  };
  requestAnimationFrame(tick);
}

/**
 * Sets up the emote button. find(userId) -> { holder, av } of that player's avatar (me included).
 * Returns { button, play(id) }.
 */
export function initEmotes(ctx, host, scene, find, beforeMine) {
  const { ui, bus, store } = ctx; const { h } = ui;
  let lastSent = 0;

  function show(userId, id) {
    const e = BY_ID[id]; const who = find(userId);
    if (!e || !who?.av) return;
    playEmote(who.av, id);
    floatEmoji(scene, who.holder, e.icon);
  }
  function play(id) {
    const s = store.get(); if (!s.me || !BY_ID[id]) return;
    const now = performance.now(); if (now - lastSent < 700) return; // no spamming
    lastSent = now;
    beforeMine?.(id); // e.g. stop walking
    show(s.me.id, id);
    ctx.use('live.send')?.({ type: 'emote', userId: s.me.id, emote: id });
  }
  bus.on('live:emote', (e) => { const from = e.userId || e.from; if (from && from !== store.get().me?.id) show(from, e.emote); });

  // --- the button + the little emote row that pops out of it
  const row = h('div', { style: {
    position: 'absolute', right: '72px', bottom: 'calc(env(safe-area-inset-bottom) + 150px)', display: 'none',
    gridTemplateColumns: 'repeat(4, 44px)', gap: '4px', padding: '6px', borderRadius: '22px',
    background: 'rgba(255,250,243,.97)', boxShadow: 'var(--shadow, 0 4px 16px rgba(0,0,0,.15))',
  } });
  const renderRow = () => {
    const love = store.get().house?.type === 'love';
    row.replaceChildren(...EMOTES.filter((e) => !e.love || love).map((e) => h('button', {
      'aria-label': e.label, title: e.label, 'data-emote': e.id,
      style: { width: '44px', height: '44px', borderRadius: '50%', border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', touchAction: 'manipulation' },
      onclick: () => { play(e.id); setOpen(false); },
    }, e.icon)));
  };
  let open = false;
  const setOpen = (on) => { open = on; if (on) renderRow(); row.style.display = on ? 'grid' : 'none'; };
  const button = h('button', {
    'aria-label': 'Emotes', title: 'Emotes (1-7 on a keyboard)',
    style: {
      position: 'absolute', right: '12px', bottom: 'calc(env(safe-area-inset-bottom) + 154px)',
      width: '52px', height: '52px', borderRadius: '50%', border: 'none', fontSize: '24px',
      background: 'rgba(255,250,243,.95)', boxShadow: 'var(--shadow, 0 4px 16px rgba(0,0,0,.15))',
      cursor: 'pointer', display: 'none', touchAction: 'manipulation',
    },
    onclick: () => setOpen(!open),
  }, '😊');
  host.append(row, button);
  document.addEventListener('pointerdown', (e) => { if (open && !row.contains(e.target) && e.target !== button) setOpen(false); }, true);
  // keyboard: 1-7 play the emotes in order
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input,textarea,select') || ui.isPanelOpen() || e.repeat) return;
    const n = Number(e.key); if (!n) return;
    const list = EMOTES.filter((x) => !x.love || store.get().house?.type === 'love');
    if (list[n - 1]) play(list[n - 1].id);
  });

  return { button, play, close: () => setOpen(false) };
}
