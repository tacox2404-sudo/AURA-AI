// WARDROBE (owned by World): change your avatar. Changes show live on your avatar.

import { OPTIONS, randomAppearance } from './avatar.js';

const LABELS = { skin: 'Skin', hair: 'Hair', hairColor: 'Hair colour', top: 'Top', topColor: 'Top colour', bottom: 'Bottoms', bottomColor: 'Bottoms colour', hat: 'Hat', hatColor: 'Hat colour', glasses: 'Glasses' };

export function initWardrobe(ctx) {
  const { store, ui, backend, bus } = ctx;
  const { h } = ui;

  function open(firstTime = false) {
    const s = store.get();
    const original = s.me.avatar;
    let draft = { ...(s.me.avatar || randomAppearance()) };
    const apply = () => store.set({ me: { ...store.get().me, avatar: { ...draft } } });
    apply();
    const body = h('div', {});
    const render = () => body.replaceChildren(
      h('p', { class: 'muted' }, firstTime ? 'Make your character. You can change it any time from the Wardrobe.' : 'Tap an option. Your avatar updates live.'),
      ...Object.entries(OPTIONS).map(([key, opts]) => h('div', { class: 'opt-row' },
        h('div', { class: 'opt-label' }, LABELS[key]),
        h('div', { class: 'opts' }, ...opts.map((o) => o.startsWith('#')
          ? h('button', { class: 'swatch-btn' + (draft[key] === o ? ' active' : ''), style: { background: o }, 'aria-label': o, onclick: () => { draft[key] = o; apply(); render(); } })
          : h('button', { class: 'chip' + (draft[key] === o ? ' active' : ''), onclick: () => { draft[key] = o; apply(); render(); } }, o))))),
      h('div', { class: 'row-btns' },
        h('button', { onclick: () => { draft = randomAppearance(); apply(); render(); } }, '🎲 Random'),
        h('button', { class: 'primary', onclick: save }, 'Save look')));
    let saved = false;
    async function save() {
      saved = true;
      const me = { ...store.get().me, avatar: { ...draft } };
      await backend.updateProfile(me);
      store.set({ me });
      ui.closePanel();
      ui.toast('Looking good ✨');
      bus.emit('points:award', { amount: 2, reason: 'new outfit' });
    }
    render();
    ui.panel({ title: '👕 Wardrobe', body, onClose: () => { if (!saved && original) store.set({ me: { ...store.get().me, avatar: original } }); } });
  }

  ctx.provide('world.openWardrobe', open);
  ui.addDockButton({ id: 'wardrobe', icon: '👕', label: 'Wardrobe', onClick: () => open(false), order: 30, group: 'more' });
}
