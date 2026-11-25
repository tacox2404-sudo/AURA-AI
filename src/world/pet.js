// HOUSE PET (owned by World): every house has a little low-poly pet that lives in it.
// A cat in Love Nest and solo houses, a puppy in friends and family houses. It wanders around,
// comes over when you are far away, curls up next to you when you sit, naps at night,
// and if you tap it, it does a happy hop with hearts.
//
// The pet runs on each device by itself (nothing is sent over the network), so it is
// always smooth. Its name comes from the house id, so everyone in the house calls it the same.

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

/**
 * Create the pet. Call update(dt, ctx) every frame, place(walk) when the room changes.
 * ctx for update: { me: {x, z, sitting}, walk, night (0-1) }
 */
export function createPet(scene) {
  let mesh = null, kind = null, name = 'Mochi', houseId = null;
  const pos = new THREE.Vector3(); const origin = new THREE.Vector3(); let path = []; let state = 'idle'; let timer = 1; let hop = 0;
  const hearts = [];
  const SPEED = 1.6;

  function setHouse(house) {
    if (!house) { if (mesh) scene.remove(mesh); mesh = null; houseId = null; return; }
    if (house.id === houseId) return;
    houseId = house.id; kind = petKindFor(house); name = petNameFor(house);
    if (mesh) scene.remove(mesh);
    mesh = buildPetMesh(kind, house); mesh.traverse((o) => { o.userData.isPet = true; });
    scene.add(mesh);
  }

  /** Put the pet somewhere free in a new room (near the given spot). org = where the room's centre is in the building. */
  function place(walk, near, org) {
    if (!mesh || !walk) return;
    if (org) origin.copy(org);
    const p = walk.nearestFree((near?.x ?? 0) + 1.2, (near?.z ?? 0) + 0.4);
    pos.set(p.x, 0, p.z); path = []; state = 'idle'; timer = 1.5;
    mesh.position.copy(pos).add(origin);
  }

  function pet() { // tapped!
    if (!mesh) return null;
    hop = 1; state = 'idle'; path = []; timer = 2;
    for (let i = 0; i < 3; i++) {
      const sp = heartSprite(); sp.position.set(origin.x + pos.x + (i - 1) * 0.2, origin.y + 0.7, origin.z + pos.z); scene.add(sp);
      hearts.push({ sp, t: -i * 0.15 });
    }
    return { name, kind };
  }

  function update(dt, { me, walk, night }) {
    if (!mesh) return;
    const u = mesh.userData;
    // floating hearts drift up and fade
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i]; h.t += dt; if (h.t < 0) continue;
      h.sp.position.y += dt * 0.6; h.sp.material.opacity = Math.max(0, 1 - h.t / 1.4);
      if (h.t > 1.4) { scene.remove(h.sp); hearts.splice(i, 1); }
    }
    if (!walk) return;
    const distMe = Math.hypot(me.x - pos.x, me.z - pos.z);
    timer -= dt;
    // decide what to do next
    if (!path.length && timer <= 0) {
      if (me.sitting && distMe > 1.1) { state = 'come'; path = walk.pathToPoint(pos, walk.nearestFree(me.x + 0.6, me.z + 0.6)) || []; timer = 3; }
      else if (me.sitting) { state = 'sleep'; timer = 4; }
      else if (distMe > 3.2) { state = 'come'; path = walk.pathToPoint(pos, walk.nearestFree(me.x + 0.7, me.z + 0.5)) || []; timer = 2; }
      else if (night > 0.6 && Math.random() < 0.6) { state = 'sleep'; timer = 6 + Math.random() * 6; }
      else if (Math.random() < 0.55) {
        const [w, d] = walk.size;
        const target = walk.nearestFree((Math.random() - 0.5) * (w - 1.5), (Math.random() - 0.5) * (d - 1.5));
        state = 'wander'; path = walk.pathToPoint(pos, target) || []; timer = 1 + Math.random() * 2;
      } else { state = Math.random() < 0.3 ? 'sit' : 'idle'; timer = 2 + Math.random() * 3; }
    }
    // walk along the path
    let moving = false;
    if (path.length) {
      const next = path[0];
      const dx = next.x - pos.x, dz = next.z - pos.z, len = Math.hypot(dx, dz);
      const step = (state === 'come' ? SPEED * 1.5 : SPEED) * dt;
      if (len <= step) { pos.x = next.x; pos.z = next.z; path.shift(); } else { pos.x += dx / len * step; pos.z += dz / len * step; }
      if (len > 0.01) { let diff = Math.atan2(dx, dz) - mesh.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); mesh.rotation.y += diff * Math.min(1, dt * 10); moving = true; }
    } else if (state !== 'sleep' && distMe < 2.5) {
      // look at me
      let diff = Math.atan2(me.x - pos.x, me.z - pos.z) - mesh.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      mesh.rotation.y += diff * Math.min(1, dt * 3);
    }
    // animate
    u.phase += dt * (moving ? 14 : 3);
    const sw = moving ? Math.sin(u.phase) * 0.7 : 0;
    u.legs[0].rotation.x = sw; u.legs[3].rotation.x = sw; u.legs[1].rotation.x = -sw; u.legs[2].rotation.x = -sw;
    u.tail.rotation.y = Math.sin(u.phase * (kind === 'dog' ? 2.5 : 0.8)) * (kind === 'dog' ? 0.6 : 0.3);
    const lying = state === 'sleep' && !moving, sitting = state === 'sit' && !moving;
    u.body.position.y = lying ? -0.12 : sitting ? -0.04 : (moving ? Math.abs(Math.sin(u.phase)) * 0.02 : 0);
    u.body.rotation.x = sitting ? -0.35 : 0;
    u.head.rotation.x = lying ? 0.3 : 0;
    for (const l of u.legs) l.visible = !lying;
    hop = Math.max(0, hop - dt * 2.2);
    mesh.position.set(origin.x + pos.x, origin.y + Math.sin(hop * Math.PI) * 0.35, origin.z + pos.z);
  }

  return { setHouse, place, update, pet, get name() { return name; }, get kind() { return kind; }, get mesh() { return mesh; } };
}
