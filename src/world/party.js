// DANCE PARTY (owned by World): tap 🪩 Party (in the 😊 menu) and your room becomes a disco for a minute:
// a mirror ball drops from the ceiling and spins, coloured spotlights sweep the floor, confetti falls,
// and everyone in the room dances. Everyone in the house sees it (live event 'party'), and it is saved
// for its minute (backend state 'party:<roomId>') so someone walking in late still joins the party.
// Tap 🪩 again to stop it.

import * as THREE from 'three';
import { playEmote } from './avatar.js';

const LENGTH = 60 * 1000; // a party lasts one minute
const COLORS = ['#ff4fa3', '#4fd1ff', '#ffd23f', '#7cff6b', '#b388ff'];

export function initParty(ctx, world) {
  const { store, backend, bus, ui } = ctx;
  const parties = new Map(); // roomId -> until (ms)
  let fx = null;             // the disco things in the scene right now: { roomId, group, ball, spots, confetti }
  let danceT = 0;

  async function toggle() {
    const s = store.get(); const roomId = world.me().roomId;
    if (!s.house || !roomId) return;
    const on = !((parties.get(roomId) || 0) > Date.now());
    const until = on ? Date.now() + LENGTH : 0;
    parties.set(roomId, until);
    ctx.use('live.send')?.({ type: 'party', roomId, until });
    if (on) { ui.toast('🪩 Party time!'); bus.emit('points:award', { amount: 1, reason: 'a dance party' }); }
    try { await backend.setState(s.house.id, `party:${roomId}`, { until }); } catch (e) { /* not important */ }
  }
  bus.on('live:party', (e) => { parties.set(e.roomId, e.until || 0); });
  /** When I walk into a room, ask if a party is going on there. */
  async function check(roomId) {
    const s = store.get(); if (!s.house || !roomId) return;
    try { const v = await backend.getState(s.house.id, `party:${roomId}`); if (v?.until) parties.set(roomId, v.until); } catch (e) { /* ignore */ }
  }

  function build(roomId) {
    const info = world.roomInfo(roomId); if (!info) return null;
    const c = world.roomCenter(roomId);
    const group = new THREE.Group(); group.position.copy(c);
    // the mirror ball: lots of little flat faces that sparkle
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 2), new THREE.MeshStandardMaterial({ color: '#e8e8f0', metalness: 0.9, roughness: 0.15, flatShading: true, emissive: '#555566' }));
    ball.position.y = 2.25;
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.35, 4), new THREE.MeshBasicMaterial({ color: '#888' })); wire.position.y = 2.6;
    group.add(ball, wire);
    // coloured spotlights hanging under the ball, pointing at the floor
    const spots = COLORS.slice(0, 3).map((col, i) => {
      const sp = new THREE.SpotLight(col, 18, 9, 0.45, 0.5, 1.2);
      sp.position.set(0, 2.2, 0); group.add(sp, sp.target);
      sp.userData.phase = (i / 3) * Math.PI * 2;
      return sp;
    });
    // confetti: little coloured squares that fall and start again at the top
    const N = 220; const pos = new Float32Array(N * 3); const col = new Float32Array(N * 3);
    const [w, d] = [info.w, info.d];
    for (let i = 0; i < N; i++) {
      pos.set([(Math.random() - 0.5) * (w - 0.6), Math.random() * 2.5, (Math.random() - 0.5) * (d - 0.6)], i * 3);
      const cc = new THREE.Color(COLORS[i % COLORS.length]); col.set([cc.r, cc.g, cc.b], i * 3);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const confetti = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.07, vertexColors: true }));
    group.add(confetti);
    world.scene.add(group);
    return { roomId, group, ball, spots, confetti, w, d };
  }
  function clear() { if (fx) { world.scene.remove(fx.group); fx = null; } }

  function update(dt) {
    const meA = world.me(); const now = Date.now();
    // show the party of my room (one at a time keeps phones fast)
    const active = meA.roomId && (parties.get(meA.roomId) || 0) > now ? meA.roomId : null;
    if (!active) { if (fx) clear(); return; }
    if (!fx || fx.roomId !== active) { clear(); fx = build(active); if (!fx) return; }
    const t = now / 1000;
    fx.ball.rotation.y += dt * 1.5;
    fx.spots.forEach((sp, i) => {
      const a = t * (0.9 + i * 0.25) + sp.userData.phase;
      sp.target.position.set(Math.cos(a) * fx.w * 0.33, 0, Math.sin(a * 1.3) * fx.d * 0.33);
      sp.color.set(COLORS[(Math.floor(t * 1.5) + i) % COLORS.length]);
    });
    const p = fx.confetti.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - dt * (0.5 + (i % 5) * 0.12);
      if (y < 0.02) y = 2.5;
      p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t * 2 + i) * dt * 0.1);
    }
    p.needsUpdate = true;
    // everybody in the room dances (when they're not walking)
    danceT -= dt;
    if (danceT <= 0) {
      danceT = 2.4;
      if (meA.av && !meA.moving) playEmote(meA.av, 'dance');
      for (const r of world.remotes().values()) if (r.roomId === active && r.av) playEmote(r.av, 'dance');
    }
  }
  return { toggle, check, update, isOn: (roomId) => (parties.get(roomId) || 0) > Date.now() };
}
