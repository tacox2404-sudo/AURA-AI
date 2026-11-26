// HOUSE PET 2.0 (owned by World): every house has a little low-poly pet that lives in it.
// A cat in Love Nest and solo houses, a puppy in friends and family houses.
//
//   - It's the SAME pet for everyone: one device (the player whose id sorts first among the people
//     online) runs its "brain" and sends where it is (live event 'pet'); the others just show it.
//   - It wanders, follows its favourite person (the last one who played with it) from room to room,
//     naps on the bed, sofa or beanbag (more at night), and sits next to you when you sit.
//   - Tap it for a little menu: 🤚 Pet, 🪑 Sit, 🌀 Spin, 🎾 Fetch (you throw a ball, it brings it
//     back), 📣 Come. Asking it something sends the live event 'pet-cmd' to the brain.
//   - Happiness (0-100, saved as backend state 'pet'): goes up when you play with it, slowly down
//     each day nobody visits. Happy pets wag faster and do little hops; sad ones nap more.
// Its name and coat come from the house id, so everyone calls it the same.

import * as THREE from 'three';

const NAMES = ['Mochi', 'Biscuit', 'Pumpkin', 'Noodle', 'Peanut', 'Waffles', 'Pebble', 'Tofu', 'Maple', 'Bean'];

export function petNameFor(house) {
  let h = 0; for (const ch of String(house?.id || 'x')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return NAMES[h % NAMES.length];
}
export const petKindFor = (house) => (house?.type === 'friends' || house?.type === 'family' ? 'dog' : 'cat');

const mats = new Map();
const m = (c) => { if (!mats.has(c)) mats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true })); return mats.get(c); };
const box = (p, w, h, d, c, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m(c)); b.position.set(x, y, z); b.castShadow = true; p.add(b); return b; };

/** Build the pet model. Facing +z, about half a cell long. */
function buildPetMesh(kind, house) {
  const root = new THREE.Group();
  const coats = kind === 'cat' ? ['#f4a259', '#3d3d3d', '#f2f2f2', '#b5838d'] : ['#c69c6d', '#f2e2c4', '#5c4033', '#e9c46a'];
  let h = 0; for (const ch of String(house?.id || 'x')) h = (h * 17 + ch.charCodeAt(0)) >>> 0;
  const fur = coats[h % coats.length], light = new THREE.Color(fur).offsetHSL(0, 0, 0.18).getStyle();
  const body = new THREE.Group(); root.add(body);
  box(body, 0.26, 0.2, 0.42, fur, 0, 0.24, 0);
  const head = new THREE.Group(); head.position.set(0, 0.38, 0.22); body.add(head);
  box(head, 0.24, 0.2, 0.2, fur, 0, 0, 0);
  box(head, 0.12, 0.07, 0.06, light, 0, -0.05, 0.11);         // muzzle
  box(head, 0.04, 0.04, 0.02, '#222', -0.06, 0.03, 0.105);     // eyes
  box(head, 0.04, 0.04, 0.02, '#222', 0.06, 0.03, 0.105);
  box(head, 0.04, 0.03, 0.02, '#ff8fa3', 0, -0.03, 0.14);      // nose
  if (kind === 'cat') { // pointy ears + long tail up
    for (const s of [-1, 1]) box(head, 0.06, 0.1, 0.05, fur, s * 0.08, 0.14, 0).rotation.z = -s * 0.3;
  } else {              // floppy ears
    for (const s of [-1, 1]) box(head, 0.05, 0.14, 0.09, new THREE.Color(fur).offsetHSL(0, 0, -0.12).getStyle(), s * 0.14, -0.02, -0.01);
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.3, -0.21); body.add(tail);
  box(tail, 0.05, 0.05, kind === 'cat' ? 0.3 : 0.16, fur, 0, 0.06, -0.1).rotation.x = kind === 'cat' ? -0.9 : -0.5;
  const legs = [];
  for (const [x, z] of [[-0.09, 0.14], [0.09, 0.14], [-0.09, -0.14], [0.09, -0.14]]) {
    const leg = new THREE.Group(); leg.position.set(x, 0.16, z); root.add(leg);
    box(leg, 0.07, 0.16, 0.07, fur, 0, -0.08, 0); legs.push(leg);
  }
  root.userData = { body, head, tail, legs, phase: 0 };
  return root;
}

function heartSprite() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d'); g.font = '48px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('💕', 32, 36);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(0.45, 0.45, 1); sp.renderOrder = 12; return sp;
}

/** Where the pet can nap, and how high it lies on it. */
const NAP_SPOTS = { bed: 0.62, sofa: 0.57, armchair: 0.47, beanbag: 0.55, rug: 0.04 };

/**
 * Create the pet. world: the small World api (see index.js). Call update(dt, { night }) every frame.
 */
export function createPet(ctx, world) {
  const { store, ui, backend, bus } = ctx; const { h } = ui; const scene = world.scene;
  let mesh = null, kind = 'cat', name = 'Mochi', houseId = null;
  // the pet's state (the brain changes it; everyone else copies it from 'pet' live events)
  const st = { roomId: null, x: 0, z: 0, y: 0, ry: 0, act: 'idle', ball: null, fav: null };
  let path = []; let timer = 1; let hop = 0; let spin = 0; let sendT = 0; let lastSent = '';
  let task = null;            // brain only: { type: 'fetch' | 'bring' | 'come' | 'nap', ... }
  let happy = 60; let saveTimer = null;
  const shown = new THREE.Vector3(); // where the mesh is drawn (smoothed)
  const hearts = []; let ballMesh = null; let flying = null; // ball in the air: { from, to, t }
  const SPEED = 1.7;

  const myId = () => store.get().me?.id;
  const isBrain = () => { const ids = [myId(), ...store.get().players.map((p) => p.userId)].filter(Boolean).sort(); return ids[0] === myId(); };

  // ---------- house + happiness ----------
  async function setHouse(house) {
    if (!house) { if (mesh) scene.remove(mesh); mesh = null; houseId = null; return; }
    if (house.id === houseId) return;
    houseId = house.id; kind = petKindFor(house); name = petNameFor(house);
    if (mesh) scene.remove(mesh);
    mesh = buildPetMesh(kind, house); mesh.traverse((o) => { o.userData.isPet = true; });
    scene.add(mesh);
    st.roomId = null; task = null; path = [];
    try {
      const saved = await backend.getState(house.id, 'pet');
      if (saved) { const days = (Date.now() - (saved.at || Date.now())) / 86400000; happy = Math.max(10, Math.min(100, (saved.happy ?? 60) - days * 8)); }
    } catch (e) { /* demo without storage: fine */ }
  }
  function cheer(amount) {
    happy = Math.min(100, happy + amount);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { if (houseId) backend.setState(houseId, 'pet', { happy: Math.round(happy), at: Date.now() }).catch(() => {}); }, 2000);
  }

  // ---------- commands (from the menu, from anyone) ----------
  function command(cmd, from = myId(), extra = {}) {
    if (cmd === 'pet') showHearts();
    if (cmd === 'fetch' && extra.ball) throwBall(extra.thrower, extra.ball);
    if (isBrain()) brainCommand(cmd, from, extra);
  }
  function brainCommand(cmd, from, extra) {
    st.fav = from;
    path = []; task = null; hop = cmd === 'pet' ? 1 : 0;
    if (cmd === 'sit') { st.act = 'sit'; timer = 3.5; }
    if (cmd === 'spin') { st.act = 'spin'; spin = 0; timer = 1.4; }
    if (cmd === 'pet') { st.act = 'idle'; timer = 2; }
    if (cmd === 'come') { task = { type: 'come' }; timer = 0; }
    if (cmd === 'fetch' && extra.ball) { task = { type: 'fetch', ball: extra.ball, thrower: from }; st.act = 'run'; timer = 0.6; }
    send(true);
  }
  bus.on('live:pet-cmd', (e) => { if ((e.userId || e.from) !== myId()) command(e.cmd, e.userId || e.from, e); });
  bus.on('live:pet', (e) => {
    if (isBrain() || !e.s) return;
    const changedRoom = e.s.roomId !== st.roomId;
    Object.assign(st, e.s);
    if (typeof e.happy === 'number') happy = e.happy;
    if (changedRoom) snap();
  });
  function ask(cmd) {
    const meA = world.me(); if (!meA.roomId || !st.roomId) return;
    const extra = {};
    if (cmd === 'fetch') {
      // throw the ball to a free spot a few metres away, in the pet's room
      const walk = world.walkOf(st.roomId); if (!walk) return;
      const [w, d] = walk.size; let best = null;
      for (let i = 0; i < 12; i++) {
        const p = walk.nearestFree((Math.random() - 0.5) * (w - 1.5), (Math.random() - 0.5) * (d - 1.5));
        const dd = Math.hypot(p.x - st.x, p.z - st.z);
        if (!best || dd > best.dd) best = { x: p.x, z: p.z, dd };
      }
      extra.ball = { x: +best.x.toFixed(2), z: +best.z.toFixed(2) };
      extra.thrower = meA.roomId === st.roomId ? { x: meA.pos.x, z: meA.pos.z } : null;
    }
    command(cmd, myId(), extra);
    ctx.use('live.send')?.({ type: 'pet-cmd', cmd, userId: myId(), ...extra });
    cheer(cmd === 'pet' ? 3 : 5);
    if (cmd === 'pet') ui.toast(kind === 'cat' ? `${name} purrs 💕` : `${name} wags happily 🐾`);
    renderBar();
  }

  // ---------- the pet menu ----------
  const bar = h('div', { style: {
    position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(env(safe-area-inset-bottom) + 150px)', display: 'none',
    flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '6px 8px', borderRadius: '22px',
    background: 'rgba(255,250,243,.97)', boxShadow: 'var(--shadow, 0 4px 16px rgba(0,0,0,.15))',
  } });
  host().append(bar);
  function host() { return document.getElementById('world'); }
  let barTimer = null;
  function renderBar() {
    const mood = happy > 70 ? 'overjoyed' : happy > 35 ? 'happy' : 'a bit lonely';
    const b = (icon, label, cmd) => h('button', { 'aria-label': label, title: label, 'data-pet': cmd,
      style: { width: '40px', height: '40px', border: 'none', borderRadius: '50%', background: 'transparent', fontSize: '21px', cursor: 'pointer', touchAction: 'manipulation' },
      onclick: () => ask(cmd) }, icon);
    bar.replaceChildren(
      h('div', { style: { fontSize: '12px', fontWeight: '700' } }, `${kind === 'cat' ? '🐱' : '🐶'} ${name} · 💗 ${Math.round(happy)}% ${mood}`),
      h('div', { style: { display: 'flex', gap: '2px' } }, b('🤚', 'Pet', 'pet'), b('🪑', 'Sit', 'sit'), b('🌀', 'Spin', 'spin'), b('🎾', 'Fetch', 'fetch'), b('📣', 'Come', 'come')));
  }
  function openBar() {
    renderBar(); bar.style.display = 'flex';
    clearTimeout(barTimer); barTimer = setTimeout(() => { bar.style.display = 'none'; }, 7000);
  }
  document.addEventListener('pointerdown', (e) => { if (bar.style.display !== 'none' && !bar.contains(e.target) && e.target.tagName !== 'CANVAS') bar.style.display = 'none'; }, true);
  /** Tapped the pet: a pat (hearts) and the menu. */
  function tap() { ask('pet'); openBar(); }

  // ---------- effects ----------
  function showHearts() {
    if (!mesh) return;
    for (let i = 0; i < 3; i++) {
      const sp = heartSprite(); sp.position.copy(mesh.position).add(new THREE.Vector3((i - 1) * 0.2, 0.7, 0)); scene.add(sp);
      hearts.push({ sp, t: -i * 0.15 });
    }
    hop = 1;
  }
  function makeBall() {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), new THREE.MeshStandardMaterial({ color: '#d4f03c', roughness: 0.6, emissive: '#3a4a00' }));
    m.castShadow = true; scene.add(m); return m;
  }
  function throwBall(thrower, to) {
    if (!st.roomId) return;
    const from = thrower ? world.toGlobal(st.roomId, thrower.x, thrower.z, 1.1) : world.toGlobal(st.roomId, st.x, st.z, 2);
    flying = { from, to: world.toGlobal(st.roomId, to.x, to.z, 0.08), t: 0 };
    if (!ballMesh) ballMesh = makeBall();
  }

  // ---------- the brain (only on one device) ----------
  function friendOf() {
    // the favourite person if they're online, else me
    const meA = world.me();
    if (st.fav && st.fav !== myId()) { const r = world.remotes().get(st.fav); if (r?.local && r.roomId) return { roomId: r.roomId, x: r.local.x, z: r.local.z, sit: r.sit }; }
    return meA.roomId ? { roomId: meA.roomId, x: meA.pos.x, z: meA.pos.z, sit: !!meA.sit } : null;
  }
  function napSpot(walk) {
    const items = world.roomItems(st.roomId).filter((i) => NAP_SPOTS[i.kind] != null);
    const it = items.find((i) => i.kind === 'bed') || items.find((i) => i.kind !== 'rug') || items[0];
    if (!it) return null;
    const [fw, fd] = world.footprint(it) || [1, 1];
    const c = { x: it.x + fw / 2 - walk.size[0] / 2, z: it.z + fd / 2 - walk.size[1] / 2 };
    return { item: it, x: c.x, z: c.z, y: NAP_SPOTS[it.kind] };
  }
  function brain(dt, night) {
    const friend = friendOf(); if (!friend) return;
    // a new room for the pet: start next to its friend
    if (!st.roomId || !world.walkOf(st.roomId)) {
      const w = world.walkOf(friend.roomId); if (!w) return;
      const p = w.nearestFree(friend.x + 1.0, friend.z + 0.4);
      Object.assign(st, { roomId: friend.roomId, x: p.x, z: p.z, y: 0, act: 'idle' }); snap(); path = []; task = null;
    }
    const walk = world.walkOf(st.roomId);
    // the friend went to another room: follow them (a little while later, it "runs over")
    if (friend.roomId !== st.roomId && !task?.fetchLock) {
      task = task?.type === 'follow' ? task : { type: 'follow', t: 1.5 };
      task.t -= dt;
      if (task.t <= 0) {
        const w = world.walkOf(friend.roomId);
        if (w) { const p = w.nearestFree(friend.x + 0.9, friend.z + 0.5); Object.assign(st, { roomId: friend.roomId, x: p.x, z: p.z, y: 0, act: 'idle', ball: null }); snap(); path = []; task = null; }
      }
      return;
    }
    if (task?.type === 'follow') task = null;
    timer -= dt;
    const distF = Math.hypot(friend.x - st.x, friend.z - st.z);
    // tasks first
    if (task?.type === 'fetch' && timer <= 0 && !path.length) {
      if (Math.hypot(task.ball.x - st.x, task.ball.z - st.z) < 0.4) { st.ball = 'mouth'; task = { type: 'bring', thrower: task.thrower }; st.act = 'run'; }
      else { st.ball = { ...task.ball }; path = walk.pathToPoint(st, walk.nearestFree(task.ball.x, task.ball.z)) || []; if (!path.length) { st.ball = 'mouth'; task = { type: 'bring', thrower: task.thrower }; } st.act = 'run'; }
    } else if (task?.type === 'bring' && !path.length) {
      if (distF < 1.0) { st.ball = null; task = null; st.act = 'sit'; timer = 2; hop = 1; showHearts(); ctx.use('live.send')?.({ type: 'pet-cmd', cmd: 'pet', userId: myId() }); }
      else { path = walk.pathToPoint(st, walk.nearestFree(friend.x + 0.5, friend.z + 0.5)) || []; st.act = 'run'; if (!path.length) { st.ball = null; task = null; } }
    } else if (task?.type === 'come' && !path.length) {
      if (distF < 1.2) { task = null; st.act = 'sit'; timer = 2.5; } else { path = walk.pathToPoint(st, walk.nearestFree(friend.x + 0.7, friend.z + 0.4)) || []; st.act = 'run'; if (!path.length) task = null; }
    } else if (task?.type === 'nap') {
      if (!path.length && st.act !== 'nap') { st.x = task.spot.x; st.z = task.spot.z; st.y = task.spot.y; st.act = 'nap'; timer = 10 + Math.random() * 10; hop = 0.6; }
      if (st.act === 'nap' && (timer <= 0 || distF < 0.7)) { task = null; st.y = 0; const p = walk.nearestFree(st.x + 0.8, st.z); st.x = p.x; st.z = p.z; st.act = 'idle'; timer = 1; hop = 0.6; }
    } else if (!task && !path.length && timer <= 0) {
      // free time: decide what to do next
      const sleepy = night > 0.6 ? 0.55 : happy < 35 ? 0.35 : 0.12;
      if (friend.sit && distF > 1.1) { path = walk.pathToPoint(st, walk.nearestFree(friend.x + 0.6, friend.z + 0.6)) || []; st.act = 'walk'; timer = 3; }
      else if (friend.sit) { st.act = 'sleep'; timer = 5; }
      else if (distF > 3.4) { path = walk.pathToPoint(st, walk.nearestFree(friend.x + 0.7, friend.z + 0.5)) || []; st.act = 'run'; timer = 2; }
      else if (Math.random() < sleepy) {
        const spot = napSpot(walk);
        if (spot) { task = { type: 'nap', spot }; path = walk.pathToItem(st, spot.item) || []; st.act = 'walk'; }
        else { st.act = 'sleep'; timer = 6 + Math.random() * 6; }
      } else if (Math.random() < 0.55) {
        const [w, d] = walk.size;
        path = walk.pathToPoint(st, walk.nearestFree((Math.random() - 0.5) * (w - 1.5), (Math.random() - 0.5) * (d - 1.5))) || []; st.act = 'walk'; timer = 1 + Math.random() * 2;
      } else { st.act = Math.random() < 0.35 ? 'sit' : 'idle'; timer = 2 + Math.random() * 3; if (happy > 70 && Math.random() < 0.4) hop = 1; }
    }
    // walk along the path
    if (path.length) {
      const next = path[0];
      const dx = next.x - st.x, dz = next.z - st.z, len = Math.hypot(dx, dz);
      const step = SPEED * (st.act === 'run' ? 1.6 : 1) * dt;
      if (len <= step) { st.x = next.x; st.z = next.z; path.shift(); } else { st.x += dx / len * step; st.z += dz / len * step; }
      if (len > 0.01) st.ry = turn(st.ry, Math.atan2(dx, dz), dt * 10);
      if (!path.length && (st.act === 'walk' || st.act === 'run') && !task) st.act = 'idle';
    } else if (st.act !== 'nap' && st.act !== 'sleep' && distF < 2.5) st.ry = turn(st.ry, Math.atan2(friend.x - st.x, friend.z - st.z), dt * 3); // look at my friend
    if (st.act === 'spin') { spin += dt * 9; if (timer <= 0) { st.act = 'idle'; spin = 0; } }
    else if (st.act === 'sit' && timer <= 0 && !task) st.act = 'idle';
    // tell the others (often while moving, now and then when still)
    sendT -= dt;
    const moving = path.length > 0;
    if (sendT <= 0 || (moving && sendT < 0.8)) { send(false); sendT = moving ? 0.2 : 2; }
  }
  function send(force) {
    const s = { roomId: st.roomId, x: +st.x.toFixed(2), z: +st.z.toFixed(2), y: +st.y.toFixed(2), ry: +st.ry.toFixed(2), act: st.act, ball: st.ball, fav: st.fav };
    const key = JSON.stringify(s);
    if (!force && key === lastSent && sendT > -5) return;
    lastSent = key;
    ctx.use('live.send')?.({ type: 'pet', s, happy: Math.round(happy) });
  }
  const turn = (a, b, k) => { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * Math.min(1, k); };
  function snap() { const g = st.roomId && world.toGlobal(st.roomId, st.x, st.z, st.y); if (g) shown.copy(g); }

  // ---------- every frame ----------
  function update(dt, { night = 0 } = {}) {
    if (!mesh) return;
    const brainHere = isBrain();
    if (brainHere) brain(dt, night);
    // floating hearts drift up and fade
    for (let i = hearts.length - 1; i >= 0; i--) {
      const hh = hearts[i]; hh.t += dt; if (hh.t < 0) continue;
      hh.sp.position.y += dt * 0.6; hh.sp.material.opacity = Math.max(0, 1 - hh.t / 1.4);
      if (hh.t > 1.4) { scene.remove(hh.sp); hearts.splice(i, 1); }
    }
    // show it only when its room is on the floor I'm looking at
    const visible = !!st.roomId && world.roomFloor(st.roomId) === world.viewFloor();
    mesh.visible = visible;
    if (!st.roomId) return;
    const target = world.toGlobal(st.roomId, st.x, st.z, st.y); if (!target) return;
    const before = shown.clone();
    shown.lerp(target, brainHere ? 1 : Math.min(1, dt * 8));
    const moved = before.distanceTo(shown) / Math.max(dt, 0.001);
    const moving = moved > 0.2 && st.act !== 'nap';
    if (!brainHere) mesh.rotation.y = turn(mesh.rotation.y, st.ry + (st.act === 'spin' ? (spin += dt * 9) : 0), dt * 10);
    else mesh.rotation.y = st.ry + (st.act === 'spin' ? spin : 0);
    if (st.act !== 'spin' && !brainHere) spin = 0;
    // animate
    const u = mesh.userData;
    u.phase += dt * (moving ? (st.act === 'run' ? 20 : 14) : 3);
    const sw = moving ? Math.sin(u.phase) * 0.7 : 0;
    u.legs[0].rotation.x = sw; u.legs[3].rotation.x = sw; u.legs[1].rotation.x = -sw; u.legs[2].rotation.x = -sw;
    const wag = (kind === 'dog' ? 2.5 : 0.8) * (happy > 70 ? 1.8 : happy < 35 ? 0.5 : 1);
    u.tail.rotation.y = Math.sin(u.phase * wag) * (kind === 'dog' ? 0.6 : 0.3);
    const lying = (st.act === 'sleep' || st.act === 'nap') && !moving, sitting = st.act === 'sit' && !moving;
    u.body.position.y = lying ? -0.12 : sitting ? -0.04 : (moving ? Math.abs(Math.sin(u.phase)) * 0.02 : 0);
    u.body.rotation.x = sitting ? -0.35 : 0;
    u.head.rotation.x = lying ? 0.3 : 0;
    for (const l of u.legs) l.visible = !lying;
    hop = Math.max(0, hop - dt * 2.2);
    mesh.position.set(shown.x, shown.y + Math.sin(hop * Math.PI) * 0.35, shown.z);
    // the ball: flying, on the floor, or in the mouth
    if (flying) {
      flying.t += dt * 1.4; const k = Math.min(1, flying.t);
      if (!ballMesh) ballMesh = makeBall();
      ballMesh.position.lerpVectors(flying.from, flying.to, k); ballMesh.position.y += Math.sin(k * Math.PI) * 1.2;
      if (k >= 1) flying = null;
    } else if (st.ball === 'mouth' && visible) {
      if (!ballMesh) ballMesh = makeBall();
      ballMesh.position.copy(mesh.position).add(new THREE.Vector3(Math.sin(mesh.rotation.y) * 0.32, 0.3, Math.cos(mesh.rotation.y) * 0.32));
    } else if (st.ball && typeof st.ball === 'object' && visible) {
      if (!ballMesh) ballMesh = makeBall();
      const g = world.toGlobal(st.roomId, st.ball.x, st.ball.z, 0.08); if (g) ballMesh.position.copy(g);
    } else if (ballMesh) { scene.remove(ballMesh); ballMesh = null; }
  }

  return { setHouse, update, tap, ask, cheer, get name() { return name; }, get kind() { return kind; }, get mesh() { return mesh; } };
}
