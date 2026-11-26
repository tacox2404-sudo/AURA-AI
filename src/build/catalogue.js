// THE CATALOGUE SCREEN (owned by Building): browse every object like a shop.
// Search, tabs for each cluster (Living, Bedroom, Kitchen...), a style filter, and a card for each item
// with a picture drawn from its 3D model, a description, style tags and what it DOES when you tap it.
//
// openCatalogue(ctx, { theme, onPick, onClose })  -> opens the screen; onPick(itemId) is called when a card is tapped.

import { CATALOG } from './catalog.js';
import { CLUSTERS, STYLES, ACTIVITY_WHAT } from './catalogInfo.js';
import { thumbInto } from './thumbs.js';

const CSS = `
.cat { display: flex; flex-direction: column; gap: 8px; }
.cat-search { width: 100%; }
.cat-tabs, .cat-styles { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
.cat-tabs::-webkit-scrollbar, .cat-styles::-webkit-scrollbar { display: none; }
.cat-tabs .chip, .cat-styles .chip { flex: none; }
.cat-styles .chip { font-size: .78rem; padding: .2em .7em; text-transform: capitalize; }
.cat-blurb { margin: 0; color: var(--ink-2); font-size: .9rem; }
.cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 10px; }
.cat-card { display: flex; flex-direction: column; align-items: stretch; gap: 4px; text-align: left; background: #fff; border: 2px solid var(--line); border-radius: 16px; padding: 8px; }
.cat-card:hover, .cat-card.on { border-color: var(--accent); background: #fff8fa; }
.cat-pic { width: 100%; height: 104px; object-fit: contain; border-radius: 12px; background: linear-gradient(160deg, #fff3e6, #efe8ff); }
.cat-card b { font-size: .95rem; }
.cat-desc { font-size: .78rem; color: var(--ink-2); line-height: 1.3; font-weight: 500; }
.cat-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.cat-tags i { font-style: normal; font-size: .66rem; background: #f1ebff; color: var(--accent-2); border-radius: 999px; padding: .05em .6em; text-transform: capitalize; font-weight: 700; }
.cat-does { font-size: .72rem; color: #1b7f57; font-weight: 700; line-height: 1.25; }
.cat-count { text-align: center; color: var(--ink-2); font-size: .8rem; margin: 4px 0 0; }

/* the build bar at the bottom of the screen */
.buildbar-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.bb-title { font-size: 1rem; }
.bb-pic { width: 46px; height: 46px; object-fit: contain; border-radius: 10px; background: linear-gradient(160deg, #fff3e6, #efe8ff); flex: none; }
.pal-item .bb-pic { width: 58px; height: 58px; }
.bb-info { display: flex; flex-direction: column; flex: 1; min-width: 0; text-align: left; }
.bb-info small { color: var(--ink-2); font-weight: 500; }
.cat-open { flex: none; align-self: center; white-space: nowrap; }
.sel-bar { align-items: center; }
.bb-history { display: flex; gap: 6px; align-items: center; }
.bb-history button:disabled { opacity: .35; }
.bb-swatches { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 8px; }
.bb-swatch { width: 34px; height: 34px; min-width: 34px; padding: 0; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 0 2px var(--line); }
.bb-swatch.on { box-shadow: 0 0 0 3px var(--accent); }
`;

/** Add the catalogue + build bar styles to the page (once). Build/index.js calls this when the game starts. */
export function injectBuildStyles() {
  if (document.getElementById('build-catalogue-css')) return;
  const st = document.createElement('style'); st.id = 'build-catalogue-css'; st.textContent = CSS; document.head.appendChild(st);
}

export function openCatalogue(ctx, { theme, onPick, startKind = null, onClose }) {
  const { ui } = ctx; const { h } = ui;
  injectBuildStyles();
  let cluster = CLUSTERS[0].id; let style = 'any'; let query = ''; // opens on the first cluster; typing a search looks everywhere
  const search = h('input', { class: 'cat-search', placeholder: 'Search: sofa, lamp, trip, bath...', type: 'search', oninput: (e) => { query = e.target.value.trim().toLowerCase(); draw(); } });
  const tabs = h('div', { class: 'cat-tabs' });
  const styles = h('div', { class: 'cat-styles' });
  const blurb = h('p', { class: 'cat-blurb' });
  const grid = h('div', { class: 'cat-grid' });
  const count = h('p', { class: 'cat-count' });

  const matches = (c) => {
    if (!query && cluster !== 'all' && c.cluster !== cluster) return false;
    if (style !== 'any' && !c.style.includes(style)) return false;
    if (!query) return true;
    const hay = [c.name, c.desc, c.id.replace(/_/g, ' '), c.style.join(' '), CLUSTERS.find((x) => x.id === c.cluster)?.name, ACTIVITY_WHAT[c.activity] || ''].join(' ').toLowerCase();
    return query.split(/\s+/).every((w) => hay.includes(w));
  };

  function draw() {
    tabs.replaceChildren(
      h('button', { class: 'chip' + (cluster === 'all' ? ' active' : ''), onclick: () => { cluster = 'all'; draw(); } }, 'All'),
      ...CLUSTERS.map((c) => h('button', { class: 'chip' + (cluster === c.id ? ' active' : ''), onclick: () => { cluster = c.id; draw(); } }, `${c.icon} ${c.name}`)));
    styles.replaceChildren(
      h('button', { class: 'chip' + (style === 'any' ? ' active' : ''), onclick: () => { style = 'any'; draw(); } }, 'Any style'),
      ...STYLES.map((s) => h('button', { class: 'chip' + (style === s ? ' active' : ''), onclick: () => { style = style === s ? 'any' : s; draw(); } }, s)));
    blurb.textContent = query ? `Searching everything for “${query}”` : cluster === 'all' ? 'Everything you can put in your home.' : CLUSTERS.find((c) => c.id === cluster)?.blurb || '';
    const items = CATALOG.filter(matches);
    grid.replaceChildren(...items.map((c) => {
      const img = h('img', { class: 'cat-pic', alt: c.name, loading: 'lazy' });
      thumbInto(img, c, theme);
      return h('button', { class: 'cat-card' + (c.id === startKind ? ' on' : ''), onclick: () => { onPick(c.id); ui.closePanel(); } },
        img, h('b', {}, c.name), h('span', { class: 'cat-desc' }, c.desc),
        c.style.length ? h('span', { class: 'cat-tags' }, ...c.style.map((s) => h('i', {}, s))) : null,
        c.activity ? h('span', { class: 'cat-does' }, '✨ ' + (ACTIVITY_WHAT[c.activity] || c.activity)) : null);
    }));
    count.textContent = items.length ? `${items.length} item${items.length > 1 ? 's' : ''}` : 'Nothing matches. Try another word or style.';
  }
  draw();
  ui.panel({ title: '🛍️ Catalogue', wide: true, onClose, body: h('div', { class: 'cat' }, search, tabs, styles, blurb, grid, count) });
}
