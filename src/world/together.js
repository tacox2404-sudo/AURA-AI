// TOGETHER (owned by World): hugs, high-fives and holding hands.
// Walk up to someone (in the same room, about an arm's length away) and a little bar appears for you
// both: 🤗 Hug, ✋ High five, 🤝 Hold hands. A hug or high-five plays on both avatars (hearts in Love
// Nest houses). Holding hands asks the other person first; if they say yes, they walk with you
// (they follow you around, even up the stairs) until one of you taps "Let go".
//
// Live event 'together': { act: 'hug' | 'highfive' | 'hands-ask' | 'hands-yes' | 'hands-no' | 'hands-off', to }

import { playEmote, setHolding } from './avatar.js';
import { floatEmoji } from './emotes.js';

const NEAR = 1.8; // metres: close enough to hug

export function initTogether(ctx, host, world) {
  const { ui, bus, store } = ctx; const { h } = ui;
  let near = null;          // userId of the person next to me
  let asked = null;         // { from, name } someone asked me to hold hands
  let hands = null;         // { other, lead: true|false } we're holding hands
  let lastPoints = 0; let followT = 0; let apartT = 0;

  const send = (act, to) => ctx.use('live.send')?.({ type: 'together', act, to, userId: store.get().me?.id });
  const nameOf = (id) => world.remotes().get(id)?.name || 'friend';
  const love = () => store.get().house?.type === 'love';

  // ---------- the bar ----------
  const bar = h('div', { style: {
    position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(env(safe-area-inset-bottom) + 92px)',
    display: 'none', alignItems: 'center', gap: '4px', padding: '6px 8px', borderRadius: '24px', maxWidth: 'calc(100vw - 150px)',
    background: 'rgba(255,250,243,.97)', boxShadow: 'var(--shadow, 0 4px 16px rgba(0,0,0,.15))', whiteSpace: 'nowrap',
  } });
  host.append(bar);
  const btn = (icon, label, onclick, wide) => h('button', { 'aria-label': label, title: label, 'data-together': label,
    style: { minWidth: '44px', height: '44px', padding: wide ? '0 12px' : '0', borderRadius: '22px', border: 'none', fontSize: wide ? '14px' : '22px', fontWeight: '700',
      background: wide ? '#f1ebff' : 'transparent', cursor: 'pointer', touchAction: 'manipulation', color: 'var(--ink, #2a2240)' }, onclick }, icon);
  let shown = '';
  function render() {
    let key = 'none';
    if (asked) key = 'ask:' + asked.from;
    else if (hands) key = 'hands:' + hands.other;
    else if (near && store.get().mode === 'play') key = 'near:' + near;
    if (key === shown) return;
    shown = key;
    if (key === 'none') { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    const label = (t) => h('span', { style: { fontSize: '12px', fontWeight: '700', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px' } }, t);
    if (asked) bar.replaceChildren(label(`🤝 ${asked.name}?`), btn('Yes', 'Hold hands: yes', () => answer(true), true), btn('No', 'Hold hands: no', () => answer(false), true));
    else if (hands) bar.replaceChildren(label(`🤝 ${nameOf(hands.other)}`), btn('Let go', 'Let go', () => letGo(true), true));
    else bar.replaceChildren(label(nameOf(near)), btn('🤗', 'Hug', () => act('hug')), btn('✋', 'High five', () => act('highfive')), btn('🤝', 'Hold hands', askHands));
  }

  // ---------- hugs + high fives ----------
  function play(who, other, kind) {
    const a = who === 'me' ? world.me() : world.remotes().get(who);
    const b = other === 'me' ? world.me() : world.remotes().get(other);
    if (!a?.av || !b?.av) return;
    playEmote(a.av, kind); playEmote(b.av, kind);
    // the burst floats over the person who started it
    floatEmoji(world.scene, a.holder, kind === 'hug' ? (love() ? '💞' : '🤗') : '✋✨');
    if (kind === 'hug' && love()) floatEmoji(world.scene, b.holder, '❤️');
  }
  function act(kind) {
    if (!near) return;
    world.faceRemote(near);
    play('me', near, kind);
    send(kind, near);
    const now = Date.now();
    if (now - lastPoints > 5 * 60 * 1000) { lastPoints = now; bus.emit('points:award', { amount: 1, reason: kind === 'hug' ? 'a hug' : 'a high five' }); }
  }

  // ---------- holding hands ----------
  function askHands() { if (!near) return; send('hands-ask', near); ui.toast(`Asked ${nameOf(near)} to hold hands 🤝`); }
  function answer(yes) {
    const a = asked; asked = null;
    if (!a) return render();
    send(yes ? 'hands-yes' : 'hands-no', a.from);
    if (yes) start(a.from, false);
    render();
  }
  function start(other, lead) {
    hands = { other, lead };
    const meA = world.me(), them = world.remotes().get(other);
    // the leader holds with the right hand, the one following with the left
    if (meA?.av) setHolding(meA.av, lead ? 'right' : 'left');
    if (them?.av) setHolding(them.av, lead ? 'left' : 'right');
    render();
  }
  function letGo(tell) {
    if (!hands) return;
    const meA = world.me(), them = world.remotes().get(hands.other);
    if (meA?.av) setHolding(meA.av, null);
    if (them?.av) setHolding(them.av, null);
    if (tell) send('hands-off', hands.other);
    hands = null; render();
  }

  bus.on('live:together', (e) => {
    const myId = store.get().me?.id; const from = e.userId || e.from;
    if (e.to !== myId || !from) return;
    if (e.act === 'hug' || e.act === 'highfive') { world.faceRemote(from); play(from, 'me', e.act); }
    if (e.act === 'hands-ask') { asked = { from, name: nameOf(from) }; render(); }
    if (e.act === 'hands-yes') { start(from, true); ui.toast(`You're holding hands with ${nameOf(from)} 🤝`); }
    if (e.act === 'hands-no') ui.toast(`${nameOf(from)} said not now 🙂`);
    if (e.act === 'hands-off' && hands?.other === from) letGo(false);
  });

  /** Every frame: who's next to me, and (if I'm following) keep walking next to my partner. */
  function update(dt) {
    const meA = world.me();
    if (!meA.roomId) { near = null; render(); return; }
    // the nearest person in my room
    let best = null, bestD = NEAR;
    for (const [id, r] of world.remotes()) {
      if (r.roomId !== meA.roomId || !r.local) continue;
      const d = Math.hypot(r.local.x - meA.pos.x, r.local.z - meA.pos.z);
      if (d < bestD) { best = id; bestD = d; }
    }
    near = meA.sit || meA.busy ? null : best;
    if (asked && !world.remotes().has(asked.from)) asked = null;
    // holding hands
    if (hands) {
      const them = world.remotes().get(hands.other);
      if (!them) { apartT += dt; if (apartT > 6) letGo(true); }
      else {
        apartT = 0;
        if (them.av?.userData && !them.av.userData.holding) setHolding(them.av, hands.lead ? 'left' : 'right');
        if (meA.av?.userData && !meA.av.userData.holding) setHolding(meA.av, hands.lead ? 'right' : 'left');
        // the follower walks to the leader's right-hand side
        followT -= dt;
        if (!hands.lead && followT <= 0 && !meA.sit) {
          followT = 0.3;
          const a = them.holder.rotation.y;
          const spot = { x: them.local.x - Math.cos(a) * 0.7, z: them.local.z + Math.sin(a) * 0.7 };
          const d = them.roomId === meA.roomId ? Math.hypot(spot.x - meA.pos.x, spot.z - meA.pos.z) : 99;
          if (d > 0.35 && !meA.busy) world.walkTo(them.roomId, spot, d > 2.5);
        }
      }
    }
    render();
  }
  return { update, letGo: () => letGo(true) };
}
