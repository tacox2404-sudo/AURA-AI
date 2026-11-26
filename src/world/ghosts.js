// MEMORY GHOSTS (owned by World): leave a little moment for someone who comes later.
// Tap 👻 Ghost (in the 😊 menu), write a message, then for 8 seconds walk, wave, dance or sit.
// When a housemate walks into that room later, a glowing see-through you plays it back on the same
// spot, with your message in a bubble. Lovely for different time zones.
//
// Saved with backend.setState(houseId, 'ghosts', [...]) (works in demo mode too). Each ghost:
//   { id, userId, name, avatar, roomId, msg, at, frames: [{ t, x, z, ry, sit, sy, e }] }
// Up to 3 ghosts per person and 12 per house; ghosts older than 30 days fade away.
// Live event 'ghost-new' tells the others to look again.

import * as THREE from 'three';
import { buildAvatar, animateAvatar, setSitting, nameTag, ghostify, playEmote } from './avatar.js';
import { floatEmoji } from './emotes.js';

const REC_SECONDS = 8, MAX_PER_USER = 3, MAX_TOTAL = 12, MAX_AGE = 30 * 24 * 3600 * 1000;

export function initGhosts(ctx, host, world) {
  const { store, backend, ui, bus } = ctx; const { h } = ui;
  let list = [];        // the house's ghosts
  let rec = null;       // { frames, t, msg, nextEmote } while recording
  let playing = null;   // { ghost, holder, av, t, i } the ghost on screen now
  const seenKey = () => `op:ghosts-seen:${store.get().me?.id}`;
  const seen = () => { try { return new Set(JSON.parse(localStorage.getItem(seenKey()) || '[]')); } catch (e) { return new Set(); } };
  const markSeen = (id) => { try { const s = seen(); s.add(id); localStorage.setItem(seenKey(), JSON.stringify([...s].slice(-60))); } catch (e) { /* private mode */ } };

  async function load() {
    const s = store.get(); if (!s.house) { list = []; return; }
    try { list = ((await backend.getState(s.house.id, 'ghosts')) || []).filter((g) => Date.now() - g.at < MAX_AGE); } catch (e) { list = []; }
  }
  bus.on('live:ghost-new', () => { load().then(() => lookForGhost()); });

  // ---------- recording ----------
  const recPill = h('div', { style: {
    position: 'absolute', left: '50%', top: 'calc(env(safe-area-inset-top) + 64px)', transform: 'translateX(-50%)', display: 'none',
    padding: '8px 14px', borderRadius: '18px', background: 'rgba(42,34,64,.9)', color: '#fff', fontWeight: '700', fontSize: '14px',
  } });
  host.append(recPill);

  async function startRecording() {
    const s = store.get(); if (!s.house || rec) return;
    const ans = await ui.ask({ title: '👻 Leave a memory ghost', text: `For ${REC_SECONDS} seconds, walk, wave, dance or sit. Anyone who comes into this room later sees a glowing you do it again, with your message.`,
      fields: [{ label: 'Message', placeholder: 'Miss you! Sleep well 🌙' }], ok: 'Start recording' });
    if (!ans) return;
    rec = { frames: [], t: 0, start: performance.now(), sample: 0, msg: (ans[0] || '').slice(0, 80), roomId: world.me().roomId, emote: null };
    recPill.style.display = 'block';
  }
  /** World tells me when I play an emote, so it goes in the recording. */
  function noteEmote(id) { if (rec) rec.emote = id; }

  async function finishRecording() {
    const r = rec; rec = null; recPill.style.display = 'none';
    const s = store.get(); if (!s.house || r.frames.length < 3) return;
    const ghost = { id: 'g_' + Math.random().toString(36).slice(2, 9), userId: s.me.id, name: s.me.username, avatar: s.me.avatar,
      roomId: r.roomId, msg: r.msg, at: Date.now(), frames: r.frames };
    await load();
    const mine = list.filter((g) => g.userId === s.me.id);
    const drop = new Set(mine.slice(0, Math.max(0, mine.length - (MAX_PER_USER - 1))).map((g) => g.id)); // keep my newest ones
    list = [...list.filter((g) => !drop.has(g.id)), ghost].slice(-MAX_TOTAL);
    try { await backend.setState(s.house.id, 'ghosts', list); } catch (e) { ui.toast("Couldn't save the ghost"); return; }
    ctx.use('live.send')?.({ type: 'ghost-new' });
    ui.toast('Ghost left 👻 Here is how it looks');
    markSeen(ghost.id);
    play(ghost); // show me my own ghost once
  }

  // ---------- playing back ----------
  function play(ghost) {
    stop();
    const holder = new THREE.Group();
    const av = ghostify(buildAvatar(ghost.avatar || undefined));
    holder.add(av, nameTag(`👻 ${ghost.name}`, '#bfe3ff'));
    world.scene.add(holder);
    playing = { ghost, holder, av, t: 0, i: 0, fade: 1 };
    place(ghost.frames[0]);
    if (ghost.msg) setTimeout(() => playing?.holder === holder && world.bubble(holder, ghost.msg), 300);
  }
  function stop() { if (playing) { world.scene.remove(playing.holder); playing = null; } }
  function place(f) {
    const g = world.toGlobal(playing.ghost.roomId, f.x, f.z, f.sit ? f.sy || 0 : 0); if (!g) return;
    playing.holder.position.copy(g); playing.holder.rotation.y = f.ry || 0;
  }
  /** Walked into a room: is there a ghost here from someone else that I haven't seen yet? */
  function lookForGhost() {
    const meA = world.me(); const myId = store.get().me?.id;
    if (playing || rec || !meA.roomId) return;
    const s = seen();
    const g = list.find((x) => x.roomId === meA.roomId && x.userId !== myId && !s.has(x.id));
    if (g) { markSeen(g.id); ui.toast(`👻 ${g.name} left you a memory here`); play(g); }
  }

  function update(dt) {
    // recording: a frame every 0.15 s
    if (rec) {
      const meA = world.me();
      rec.t = (performance.now() - rec.start) / 1000; rec.sample -= dt; // real seconds, even on a slow phone
      if (meA.roomId !== rec.roomId) { ui.toast('Ghost stopped: you left the room'); return finishRecording(); }
      if (rec.sample <= 0) {
        rec.sample = 0.15;
        rec.frames.push({ t: +rec.t.toFixed(2), x: +meA.pos.x.toFixed(2), z: +meA.pos.z.toFixed(2), ry: +meA.holder.rotation.y.toFixed(2),
          sit: meA.sit ? 1 : 0, sy: meA.sit ? +meA.sit.y.toFixed(3) : 0, e: rec.emote || undefined });
        rec.emote = null;
      }
      recPill.textContent = `● Recording a ghost… ${Math.max(0, Math.ceil(REC_SECONDS - rec.t))}`;
      if (rec.t >= REC_SECONDS) finishRecording();
    }
    // playing: move between recorded frames
    if (playing) {
      const p = playing; const fr = p.ghost.frames;
      if (world.me().roomId !== p.ghost.roomId) return stop();
      p.t += dt;
      while (p.i < fr.length - 1 && fr[p.i + 1].t <= p.t) {
        p.i++;
        if (fr[p.i].e) { playEmote(p.av, fr[p.i].e); }
      }
      const a = fr[p.i], b = fr[Math.min(p.i + 1, fr.length - 1)];
      const k = b.t > a.t ? Math.min(1, (p.t - a.t) / (b.t - a.t)) : 0;
      const pos = world.toGlobal(p.ghost.roomId, a.x + (b.x - a.x) * k, a.z + (b.z - a.z) * k, a.sit ? a.sy || 0 : 0);
      const moving = Math.hypot(b.x - a.x, b.z - a.z) > 0.02;
      if (pos) p.holder.position.copy(pos);
      p.holder.rotation.y = a.ry + (b.ry - a.ry) * k;
      setSitting(p.av, !!a.sit);
      animateAvatar(p.av, dt, moving && !a.sit);
      if (p.t > fr[fr.length - 1].t + 1.2) {
        // the end: fade away with a little sparkle
        p.fade -= dt * 1.5;
        p.av.traverse((o) => { if (o.isMesh) o.material.opacity = 0.45 * Math.max(0, p.fade); });
        if (p.fade <= 0) { floatEmoji(world.scene, p.holder, '✨'); setTimeout(stop, 50); }
      }
    }
  }

  /** The 👻 menu: leave a new ghost, or replay the ones in this house. */
  async function openMenu() {
    await load();
    const myId = store.get().me?.id;
    const roomName = (id) => store.get().house?.rooms.find((r) => r.id === id)?.name || 'a room';
    const body = h('div', {},
      h('p', { class: 'muted' }, 'Leave a little moment for someone who comes later: they see a glowing you play it back in the same room.'),
      h('div', { class: 'row-btns' }, h('button', { class: 'primary', onclick: () => { ui.closePanel(); startRecording(); } }, '👻 Leave a new ghost here')),
      list.length ? h('h4', {}, 'Ghosts in this house') : h('p', { class: 'muted' }, 'No ghosts yet.'),
      ...[...list].reverse().map((g) => h('div', { class: 'row', style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' } },
        h('div', { style: { flex: '1', minWidth: '0' } }, h('b', {}, g.name), ` in ${roomName(g.roomId)}`, g.msg ? h('div', { class: 'muted' }, `“${g.msg}”`) : null),
        h('button', { onclick: () => { ui.closePanel(); if (world.me().roomId !== g.roomId) bus.emit('room:goto', { roomId: g.roomId }); setTimeout(() => play(g), 400); } }, '▶︎'),
        g.userId === myId ? h('button', { 'aria-label': 'Delete ghost', onclick: async () => {
          list = list.filter((x) => x.id !== g.id);
          try { await backend.setState(store.get().house.id, 'ghosts', list); } catch (e) { /* ignore */ }
          ui.closePanel(); openMenu();
        } }, '🗑') : null)));
    ui.panel({ title: '👻 Memory ghosts', body });
  }

  return { update, noteEmote, load, lookForGhost, openMenu, isRecording: () => !!rec, stop };
}
