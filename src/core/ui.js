// Shared UI helpers (owned by the lead). Areas build their own screens and panels
// with these, so the whole game looks consistent.
//
// ui.h('div', { class: 'x', onclick }, ...children)  -> create elements
// ui.screen(el) / ui.closeScreen()                   -> full-screen pages (login, onboarding)
// ui.panel({ title, body, wide })                    -> bottom sheet on phones, side card on desktop
// ui.toast('text')                                   -> small message
// ui.addDockButton({ id, icon, label, onClick, visible, group })  -> buttons in the bottom dock.
//    group 'main' (default) = the bottom bar (keep it to the few things people do all the time).
//    group 'more'           = the "⋯ More" ribbon on the right edge (people, friends, scores, wardrobe, help).
// ui.openRibbon() / ui.closeRibbon() / ui.setRibbonBadge(n)
// ui.setTopbar({ title, tabs, active, onTab, right }) -> the top bar

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function createUI(root) {
  const topbar = h('div', { class: 'topbar' });
  const dock = h('div', { class: 'dock' });
  const sheetLayer = h('div', { class: 'sheet-layer' });
  const screenLayer = h('div', { class: 'screen-layer hidden' });
  const toasts = h('div', { class: 'toasts' });
  // The "⋯ More" ribbon: a small handle on the right edge that opens a vertical list of buttons.
  let ribbonOpen = false;
  const ribbonList = h('div', { class: 'ribbon-list' });
  const ribbonHandle = h('button', { class: 'ribbon-handle', 'aria-label': 'More', onclick: () => setRibbon(!ribbonOpen) },
    h('span', { class: 'ribbon-dots' }, '⋯'), h('span', { class: 'ribbon-label' }, 'More'));
  const ribbon = h('div', { class: 'ribbon empty' }, ribbonList, ribbonHandle);
  function setRibbon(on) { ribbonOpen = !!on; ribbon.classList.toggle('open', ribbonOpen); }
  document.addEventListener('pointerdown', (e) => { if (ribbonOpen && !ribbon.contains(e.target)) setRibbon(false); }, true);
  root.append(topbar, dock, ribbon, sheetLayer, screenLayer, toasts);

  const dockButtons = [];
  addEventListener('keydown', (e) => { if (e.key === 'Escape') ui.closePanel(); });
  let openPanel = null;

  const ui = {
    h,
    root,
    screen(el) {
      screenLayer.replaceChildren(el);
      screenLayer.classList.remove('hidden');
    },
    closeScreen() { screenLayer.classList.add('hidden'); screenLayer.replaceChildren(); },

    panel({ title, body, wide = false, onClose }) {
      ui.closePanel();
      const close = () => ui.closePanel();
      const card = h('div', { class: 'sheet' + (wide ? ' wide' : '') },
        h('div', { class: 'sheet-head' }, h('h3', {}, title), h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: close }, '✕')),
        h('div', { class: 'sheet-body' }, body));
      const backdrop = h('div', { class: 'sheet-backdrop', onclick: close });
      sheetLayer.replaceChildren(backdrop, card);
      sheetLayer.classList.add('open');
      openPanel = { onClose };
      return { close, card };
    },
    closePanel() {
      if (!openPanel) return;
      const p = openPanel; openPanel = null;
      sheetLayer.classList.remove('open');
      sheetLayer.replaceChildren();
      try { p.onClose?.(); } catch (e) { console.error(e); }
    },
    isPanelOpen: () => !!openPanel,

    /** In-game dialog (browser prompt()/confirm() are blocked in some embeds).
     *  await ui.ask({ title, fields: [{ label, value, placeholder }], ok: 'Save' }) -> array of values, or null */
    ask({ title, text = '', fields = [], ok = 'OK', cancel = 'Cancel' }) {
      return new Promise((resolve) => {
        const inputs = fields.map((f) => h('input', { value: f.value || '', placeholder: f.placeholder || '' }));
        const done = (v) => { layer.remove(); resolve(v); };
        const layer = h('div', { class: 'modal-layer' },
          h('div', { class: 'modal' }, h('h3', {}, title), text ? h('p', { class: 'muted' }, text) : null,
            ...fields.map((f, i) => h('label', { class: 'field' }, f.label ? h('span', {}, f.label) : null, inputs[i])),
            h('div', { class: 'row-btns' }, h('button', { onclick: () => done(null) }, cancel), h('button', { class: 'primary', onclick: () => done(inputs.map((x) => x.value)) }, ok))));
        inputs.forEach((x) => x.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(inputs.map((y) => y.value)); }));
        root.append(layer);
        setTimeout(() => inputs[0]?.focus(), 30);
      });
    },
    async confirm(title, text = '', ok = 'Yes') { return (await ui.ask({ title, text, ok })) !== null; },

    toast(text, ms = 2600) {
      const t = h('div', { class: 'toast' }, text);
      toasts.append(t);
      setTimeout(() => t.classList.add('out'), ms);
      setTimeout(() => t.remove(), ms + 400);
    },

    addDockButton({ id, icon, label, onClick, visible = () => true, order = 50, group = 'main' }) {
      dockButtons.push({ id, icon, label, onClick, visible, order, group });
      dockButtons.sort((a, b) => a.order - b.order);
      ui.refreshDock();
    },
    refreshDock(state) {
      const shown = dockButtons.filter((b) => b.visible(state));
      const make = (b, inRibbon) => h('button', { class: 'dock-btn' + (inRibbon ? ' ribbon-btn' : ''), 'data-id': b.id, onclick: () => { if (inRibbon) setRibbon(false); b.onClick(); } },
        h('span', { class: 'dock-icon' }, b.icon), h('span', { class: 'dock-label' }, b.label));
      dock.replaceChildren(...shown.filter((b) => b.group !== 'more').map((b) => make(b, false)));
      ribbonList.replaceChildren(...shown.filter((b) => b.group === 'more').map((b) => make(b, true)));
      ribbon.classList.toggle('empty', !ribbonList.children.length);
    },
    openRibbon() { setRibbon(true); },
    closeRibbon() { setRibbon(false); },
    /** A small dot with a number on the ribbon handle (e.g. pending friend requests). 0 hides it. */
    setRibbonBadge(n) { if (n > 0) ribbonHandle.setAttribute('data-badge', String(n)); else ribbonHandle.removeAttribute('data-badge'); },
    setDockVisible(on) { dock.classList.toggle('hidden', !on); topbar.classList.toggle('hidden', !on); ribbon.classList.toggle('hidden', !on); if (!on) setRibbon(false); },

    setTopbar({ title = '', tabs = [], active = null, onTab, right = null }) {
      topbar.replaceChildren(
        h('div', { class: 'topbar-title' }, title),
        h('div', { class: 'tabs' }, ...tabs.map((t) => h('button', { class: 'tab' + (t.id === active ? ' active' : ''), onclick: () => onTab?.(t.id) }, t.label))),
        h('div', { class: 'topbar-right' }, right));
    },
  };
  return ui;
}
