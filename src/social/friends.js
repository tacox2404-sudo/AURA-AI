// FRIENDS (owned by Social): add friends by username, answer requests, see your friends.
// Works inside a house and from the house list, so friends connect across houses.
// Data comes from ctx.backend (sendFriendRequest, respondFriendRequest, removeFriend, listFriends).

import { friendly } from './screens.js';

export function initFriends(ctx, { enterHouse } = {}) {
  const { ui, store, backend, bus } = ctx; const { h } = ui;

  // opts.onBack: show as a full page (used from the house list, where sheets are hidden behind the page)
  async function openFriends(opts = {}) {
    const me = store.get().me;
    if (!me) return;
    const input = h('input', { placeholder: "Friend's username", maxlength: 20, autocapitalize: 'none' });
    const listBox = h('div', {});
    const send = async () => {
      const name = input.value.trim();
      if (!name) return;
      try {
        const r = await backend.sendFriendRequest(name);
        input.value = '';
        ui.toast(r === 'accepted' ? `You and ${name} are now friends 🎉` : `Request sent to ${name} 💌`);
        refresh();
      } catch (e) { ui.toast(friendly(e.message)); }
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

    async function act(fn, message) {
      try { await fn(); if (message) ui.toast(message); } catch (e) { ui.toast(friendly(e.message)); }
      refresh();
    }

    const row = (f, ...buttons) => h('div', { class: 'row' },
      h('span', { class: 'row-main' }, f.username),
      h('span', { class: 'row-btns' }, ...buttons));

    async function refresh() {
      let list = [];
      try { list = await backend.listFriends(); } catch (e) { ui.toast(friendly(e.message)); }
      let open = [];
      try { open = await backend.listFriendHouses(); } catch { /* older backend or offline: just skip this section */ }
      const incoming = list.filter((f) => f.status === 'incoming');
      const friends = list.filter((f) => f.status === 'friend');
      const outgoing = list.filter((f) => f.status === 'outgoing');
      const house = store.get().house;
      listBox.replaceChildren(...[
        incoming.length ? h('div', {}, h('h4', {}, `Requests (${incoming.length})`), h('div', { class: 'list' }, ...incoming.map((f) => row(f,
          h('button', { title: 'Accept', onclick: () => act(() => backend.respondFriendRequest(f.id, true), `You and ${f.username} are now friends 🎉`) }, '✅'),
          h('button', { title: 'Decline', onclick: () => act(() => backend.respondFriendRequest(f.id, false)) }, '❌')))) ) : null,
        open.length ? h('div', {}, h('h4', {}, `Friends' houses you can visit (${open.length})`), h('div', { class: 'list' }, ...open.map((o) => h('div', { class: 'row' },
          h('span', { class: 'row-main' }, `🏠 ${o.name}`, h('small', {}, ` by ${o.ownerName}`)),
          h('span', { class: 'row-btns' }, h('button', { class: 'primary', onclick: () => visit(o) }, 'Visit')))))) : null,
        h('h4', {}, `Friends (${friends.length})`),
        friends.length ? h('div', { class: 'list' }, ...friends.map((f) => row(f,
          house ? h('button', { title: 'Copy a guest invite to your current house', onclick: () => inviteFriend(f) }, '💌') : null,
          h('button', { title: 'Remove friend', onclick: async () => { if (await ui.confirm(`Remove ${f.username}?`, 'You can add them again later.', 'Remove')) act(() => backend.removeFriend(f.id), `${f.username} was removed`); } }, '🗑️'))))
          : h('p', { class: 'muted' }, 'No friends yet. Add someone by their username above.'),
        outgoing.length ? h('div', {}, h('h4', {}, 'Waiting for an answer'), h('div', { class: 'list' }, ...outgoing.map((f) => row(f,
          h('button', { title: 'Cancel request', onclick: () => act(() => backend.removeFriend(f.id), 'Request cancelled') }, '✖️')))) ) : null].filter(Boolean)); // drop empty sections (null would print as text)
    }

    // Walk into a friend's open house as a guest (look around, chat, play; no building).
    async function visit(o) {
      try {
        const { house, role } = await backend.visitHouse(o.id);
        ui.closePanel();
        ui.toast(`Welcome to ${house.name}! You are visiting as a ${role} 👋`);
        enterHouse?.(house, role);
      } catch (e) { ui.toast(friendly(e.message)); refresh(); }
    }

    // Friends can't be messaged directly yet, so copy a ready-to-send invite to this house.
    async function inviteFriend(f) {
      const house = store.get().house;
      const link = `${location.origin}${location.pathname}?join=${house.guestCode}`;
      const text = `Hey ${f.username}! Come visit "${house.name}" on AURA 🏠\nOpen: ${link}\nor enter code ${house.guestCode}`;
      try { await navigator.clipboard.writeText(text); ui.toast(`Invite for ${f.username} copied. Paste it in your chat!`); }
      catch { ui.ask({ title: `Invite ${f.username}`, text, ok: 'Done' }); }
    }

    const body = h('div', {},
      h('div', { class: 'card form' }, h('b', {}, 'Add a friend'), input,
        h('button', { class: 'primary', onclick: send }, 'Send request')),
      listBox);
    if (opts.onBack) ui.screen(h('div', { class: 'screen' },
      h('div', { class: 'screen-head' }, h('h2', {}, '🤝 Friends'), h('button', { class: 'link', onclick: opts.onBack }, '← Back')), body));
    else ui.panel({ title: '🤝 Friends', body });
    refresh();
  }

  ctx.provide('social.openFriends', () => openFriends());
  ui.addDockButton({ id: 'friends', icon: '🤝', label: 'Friends', onClick: () => openFriends(), order: 55 });

  // Gentle heads-up when someone sends you a request (checked when you enter a house and every minute).
  let lastIncoming = 0;
  async function checkRequests() {
    if (!store.get().me) return;
    try {
      const n = (await backend.listFriends()).filter((f) => f.status === 'incoming').length;
      if (n > lastIncoming) ui.toast(`You have ${n} friend request${n > 1 ? 's' : ''} 💌 (open 🤝 Friends)`);
      lastIncoming = n;
    } catch { /* offline: try again next minute */ }
  }
  bus.on('house:entered', checkRequests);
  setInterval(checkRequests, 60000);
  return { openFriends };
}
