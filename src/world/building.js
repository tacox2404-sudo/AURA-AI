// THE BUILDING (owned by World): the whole house as one cosy multi-floor penthouse.
//
//   - The rooms of the house are stacked into floors, two rooms side by side per floor, in the order of
//     house.rooms. The first room (the Entrance) is on the ground floor; the top floor is the Penthouse.
//   - Rooms on the same floor share a wall with an open doorway, so you just walk from one into the other.
//   - Every floor has a wooden balcony on the right side, and a spiral staircase outside joins the
//     balconies: walk out of the right-hand room, climb the spiral, walk in on the next floor.
//   - Nothing here is saved. The building is worked out from house.rooms every time, so every house
//     (old ones too) becomes a building automatically, and adding a room adds it to the top.
//
// Coordinates: "building" coordinates are metres; a room's cells go from (ox, oz) to (ox + w, oz + d),
// and floor number f stands at height y = f * FLOOR_H. Room "local" coordinates (used by the walk grid,
// presence and seats) are centred on the room, exactly like before.

import * as THREE from 'three';

export const FLOOR_H = 3.0;     // floor to floor height (walls are 2.6 high)
export const PER_FLOOR = 2;     // rooms side by side on one floor
const STAIR_R = 1.05;           // outer radius of the spiral staircase
const WALK_R = 0.62;            // where you walk on the steps (from the centre pole)
const STEPS = 16;               // steps per floor

export const floorName = (f, count) => (f === 0 ? 'Ground floor' : f === count - 1 ? 'Penthouse' : `Floor ${f}`);

/**
 * Work out where every room goes. walks: Map roomId -> walk grid (to find free cells for doorways).
 * Returns { floors, rooms: Map(id -> info), links, stair, toGlobal, cellGlobal }.
 *   info = { room, floor, index, ox, oz, y, w, d, left: id|null, right: id|null }
 *   links = [{ type: 'door' | 'stairs', a, b, cellA, cellB }]  (a = left / lower room, b = right / upper room)
 */
export function layoutBuilding(house, walks) {
  const rooms = new Map(); const floors = []; const links = [];
  const list = house?.rooms || [];
  for (let i = 0; i < list.length; i += PER_FLOOR) {
    const f = floors.length; const ids = []; let x = 0; let depth = 0;
    for (const room of list.slice(i, i + PER_FLOOR)) {
      const [w, d] = room.size;
      const prev = ids[ids.length - 1];
      rooms.set(room.id, { room, floor: f, index: ids.length, ox: x, oz: 0, y: f * FLOOR_H, w, d, left: prev || null, right: null });
      if (prev) rooms.get(prev).right = room.id;
      ids.push(room.id); x += w; depth = Math.max(depth, d);
    }
    floors.push({ level: f, y: f * FLOOR_H, rooms: ids, right: x, depth, name: '' });
  }
  floors.forEach((fl) => { fl.name = floorName(fl.level, floors.length); });
  const xMax = Math.max(8, ...floors.map((fl) => fl.right));
  const stair = { x: xMax + 2.3, z: 1.5, r: STAIR_R };
  const free = (id, x, z) => !walks.get(id)?.isBlockedCell(x, z);
  const byCloseness = (n, target) => Array.from({ length: Math.max(0, n - 2) }, (_, k) => k + 1).sort((p, q) => Math.abs(p + 0.5 - target) - Math.abs(q + 0.5 - target));

  // doorways between neighbours on the same floor (in the wall they share)
  for (const info of rooms.values()) {
    if (!info.right) continue;
    const other = rooms.get(info.right);
    const n = Math.min(info.d, other.d);
    const zs = byCloseness(n, n * 0.55);
    const z = zs.find((k) => free(info.room.id, info.w - 1, k) && free(other.room.id, 0, k)) ?? zs.find((k) => free(info.room.id, info.w - 1, k) || free(other.room.id, 0, k)) ?? 1;
    links.push({ type: 'door', a: info.room.id, b: other.room.id, cellA: { x: info.w - 1, z }, cellB: { x: 0, z } });
  }
  // balcony doors (right wall of the right-most room of every floor) and the stairs between floors
  for (const fl of floors) {
    const info = rooms.get(fl.rooms[fl.rooms.length - 1]);
    const zs = byCloseness(info.d, stair.z);
    const z = zs.find((k) => free(info.room.id, info.w - 1, k)) ?? 1;
    fl.balcony = { roomId: info.room.id, cell: { x: info.w - 1, z } };
  }
  for (let f = 0; f < floors.length - 1; f++) {
    const lo = floors[f].balcony, hi = floors[f + 1].balcony;
    links.push({ type: 'stairs', a: lo.roomId, b: hi.roomId, cellA: lo.cell, cellB: hi.cell, floor: f });
  }

  /** room-local position -> building position */
  const toGlobal = (id, x, z, y = 0) => { const r = rooms.get(id); return new THREE.Vector3(r.ox + r.w / 2 + x, r.y + y, r.oz + r.d / 2 + z); };
  /** centre of a cell of a room, in building coordinates */
  const cellGlobal = (id, c) => { const r = rooms.get(id); return new THREE.Vector3(r.ox + c.x + 0.5, r.y, r.oz + c.z + 0.5); };
  return { floors, rooms, links, stair, xMax, toGlobal, cellGlobal };
}

/** The rooms to walk through to get from one room to another: list of { link, from, to }, or null. */
export function findRoute(layout, fromId, toId) {
  if (fromId === toId) return [];
  const prev = new Map([[fromId, null]]); const queue = [fromId];
  while (queue.length) {
    const id = queue.shift();
    if (id === toId) break;
    for (const link of layout.links) {
      const next = link.a === id ? link.b : link.b === id ? link.a : null;
      if (next && !prev.has(next)) { prev.set(next, { link, from: id }); queue.push(next); }
    }
  }
  if (!prev.has(toId)) return null;
  const route = [];
  for (let id = toId; prev.get(id); id = prev.get(id).from) route.unshift({ link: prev.get(id).link, from: prev.get(id).from, to: id });
  return route;
}

/**
 * The exact points (building coordinates, with height) you walk through to use a link,
 * starting on the cell next to the link in room `from` and ending on the cell in room `to`.
 */
export function linkPath(layout, link, from) {
  const up = link.a === from;
  const start = layout.cellGlobal(from, up ? link.cellA : link.cellB);
  const end = layout.cellGlobal(up ? link.b : link.a, up ? link.cellB : link.cellA);
  if (link.type === 'door') return [start, end];
  // stairs: out of the balcony door, along the balcony, round the spiral, and in again upstairs
  const { stair } = layout;
  const lo = layout.rooms.get(link.a), hi = layout.rooms.get(link.b);
  const outside = (info, cell) => new THREE.Vector3(info.ox + info.w + 0.7, info.y, info.oz + cell.z + 0.5);
  const foot = (y) => new THREE.Vector3(stair.x - WALK_R - 0.55, y, stair.z);
  const pts = [layout.cellGlobal(link.a, link.cellA), outside(lo, link.cellA), foot(lo.y)];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS, th = Math.PI + t * Math.PI * 2;
    pts.push(new THREE.Vector3(stair.x + Math.cos(th) * WALK_R, lo.y + t * FLOOR_H, stair.z + Math.sin(th) * WALK_R));
  }
  pts.push(foot(hi.y), outside(hi, link.cellB), layout.cellGlobal(link.b, link.cellB));
  return up ? pts : pts.reverse();
}

// ---------- the parts of the building that are not rooms ----------

const matCache = new Map();
const mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true, ...o })); return matCache.get(k); };
const box = (g, w, h, d, c, x, y, z, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
const cyl = (g, r, h, c, x, y, z, seg = 10, rTop = r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, h, seg), mat(c)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
const tube = (g, pts, r, c) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length * 4), r, 6), mat(c)); g.add(m); return m; };

/** A floating sign. */
export function signSprite(text, { bg = 'rgba(255,250,243,.95)', fg = '#3b2f2a', scale = 1 } = {}) {
  const cv = document.createElement('canvas'); cv.width = 320; cv.height = 72;
  const g = cv.getContext('2d');
  const label = text.length > 20 ? text.slice(0, 19) + '…' : text;
  g.font = 'bold 30px system-ui, sans-serif';
  const w = Math.min(312, g.measureText(label).width + 30);
  g.fillStyle = bg; g.beginPath(); g.roundRect((320 - w) / 2, 8, w, 52, 16); g.fill();
  g.strokeStyle = 'rgba(80,60,40,.3)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 160, 35);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(2.2 * scale, 0.5 * scale, 1); sp.renderOrder = 9;
  return sp;
}

function plantPot(g, x, y, z, big) {
  cyl(g, 0.22, 0.35, '#c96f4a', x, y + 0.17, z, 8, 0.26);
  const leaf = mat('#4f9d69'); const s = big ? 1.3 : 1;
  for (const [dx, dy, dz, r] of [[0, 0.6, 0, 0.3], [0.13, 0.78, 0.05, 0.2], [-0.1, 0.75, -0.08, 0.22]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 0), leaf); b.position.set(x + dx, y + dy * s, z + dz); b.castShadow = true; g.add(b);
  }
}

/**
 * Everything outside the rooms: the garden, the front path, balconies with railings and plants,
 * the spiral staircase, a terrace on the roof, and the signs.
 * Returns { group, perFloor: [Group], stairs: [Group (between f and f+1)], signs: [{ sprite, floor }], tapTargets }
 */
export function buildOutside(layout, house) {
  const group = new THREE.Group();
  const { floors, stair } = layout;
  const perFloor = floors.map(() => { const g = new THREE.Group(); group.add(g); return g; });
  const stairs = []; const signs = []; const tapTargets = [];
  const wood = '#b07d4f', woodDark = '#8a5a35', rail = '#f4efe6', metal = '#4a4a55';

  // --- garden: grass all around, a stone path to the front door of the entrance
  const grass = new THREE.Mesh(new THREE.BoxGeometry(90, 0.3, 90), new THREE.MeshStandardMaterial({ color: '#8fc47a', roughness: 1 })); // own material: seasons recolour it
  const bushes = [];
  grass.position.set(layout.xMax / 2, -0.36, 4); grass.receiveShadow = true; group.add(grass);
  const entrance = layout.rooms.get(floors[0]?.rooms[0]);
  if (entrance) {
    for (let i = 0; i < 6; i++) box(group, 0.9, 0.06, 0.6, i % 2 ? '#d9d2c5' : '#cfc6b6', entrance.ox + entrance.w / 2 + Math.sin(i) * 0.15, -0.2, entrance.d + 0.7 + i * 0.85);
    // a few round bushes and a lamp post along the path
    for (const s of [-1, 1]) for (const k of [1.6, 4.2]) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), new THREE.MeshStandardMaterial({ color: k > 2 ? '#5e9c5a' : '#6fae64', flatShading: true })); bushes.push(b); b.position.set(entrance.ox + entrance.w / 2 + s * 1.6, 0.1, entrance.d + k); b.castShadow = true; group.add(b);
    }
  }

  // --- one balcony per floor, on the right of the building, out to the spiral staircase
  for (const fl of floors) {
    const g = perFloor[fl.level];
    const x0 = fl.right, x1 = stair.x - WALK_R - 0.25, z1 = Math.max(fl.depth, stair.z + 1.6);
    const deck = box(g, x1 - x0, 0.16, z1, wood, (x0 + x1) / 2, fl.y - 0.08, z1 / 2);
    // planks
    for (let x = x0 + 0.3; x < x1 - 0.1; x += 0.3) box(g, 0.02, 0.005, z1 - 0.1, woodDark, x, fl.y + 0.003, z1 / 2).castShadow = false;
    deck.userData.balcony = fl.level;
    // railings: back, front and the outer side (leaving a gap for the stairs)
    const railY = fl.y + 0.95;
    const railLine = (ax, az, bx, bz) => {
      const len = Math.hypot(bx - ax, bz - az); const n = Math.max(1, Math.round(len / 0.45));
      for (let i = 0; i <= n; i++) box(g, 0.05, 0.95, 0.05, rail, ax + (bx - ax) * i / n, fl.y + 0.47, az + (bz - az) * i / n);
      const top = box(g, Math.abs(bx - ax) + 0.08 || 0.08, 0.06, Math.abs(bz - az) + 0.08 || 0.08, rail, (ax + bx) / 2, railY, (az + bz) / 2); top.castShadow = false;
    };
    railLine(x0 + 0.1, z1 - 0.05, x1 - 0.05, z1 - 0.05);
    railLine(x0 + 0.1, 0.05, x1 - 0.05, 0.05);
    railLine(x1 - 0.05, stair.z + 1.0, x1 - 0.05, z1 - 0.05);
    // support posts under upper balconies
    if (fl.level > 0) for (const z of [0.2, z1 - 0.2]) box(g, 0.14, FLOOR_H - 0.16, 0.14, woodDark, x1 - 0.2, fl.y - FLOOR_H / 2 - 0.08, z);
    // plants on the balcony
    plantPot(g, x1 - 0.45, fl.y, z1 - 0.5, fl.level === floors.length - 1);
    if (z1 > 4) plantPot(g, x0 + 0.45, fl.y, z1 - 0.5);
    // the top floor gets a little terrace: a parasol and a lounger
    if (fl.level === floors.length - 1 && z1 > 4.5) {
      const px = (x0 + x1) / 2, pz = z1 - 2.2;
      cyl(g, 0.03, 2.1, metal, px, fl.y + 1.05, pz);
      const top = cyl(g, 1.1, 0.35, '#e76f51', px, fl.y + 2.15, pz, 8, 0.05); top.material = mat('#e76f51');
      box(g, 0.6, 0.12, 1.5, '#f4efe6', px - 0.1, fl.y + 0.32, pz + 0.9); box(g, 0.6, 0.4, 0.12, '#f4efe6', px - 0.1, fl.y + 0.55, pz + 0.2).rotation.x = -0.5;
      for (const [dx, dz] of [[-0.25, 0.3], [0.25, 0.3], [-0.25, 1.55], [0.25, 1.55]]) box(g, 0.05, 0.26, 0.05, metal, px - 0.1 + dx, fl.y + 0.13, pz + dz);
    }
    // up / down signs at the foot of the stairs
    const sx = stair.x - WALK_R - 0.55;
    if (fl.level < floors.length - 1) {
      const s = signSprite(`⬆ ${floors[fl.level + 1].name}`, { bg: 'rgba(42,34,64,.88)', fg: '#ffe08a', scale: 0.9 });
      s.position.set(sx, fl.y + 2.5, stair.z); s.userData.stairs = 'up'; s.userData.floor = fl.level;
      g.add(s); signs.push({ sprite: s, floor: fl.level }); tapTargets.push(s);
    }
    if (fl.level > 0) {
      const s = signSprite(`⬇ ${floors[fl.level - 1].name}`, { bg: 'rgba(42,34,64,.88)', fg: '#bfe3ff', scale: 0.9 });
      s.position.set(sx, fl.y + (fl.level < floors.length - 1 ? 2.0 : 2.5), stair.z); s.userData.stairs = 'down'; s.userData.floor = fl.level;
      g.add(s); signs.push({ sprite: s, floor: fl.level }); tapTargets.push(s);
    }
  }

  // --- columns under parts of a floor that stick out past the floor below (so nothing floats)
  for (const fl of floors) {
    if (fl.level === 0) continue;
    const below = floors[fl.level - 1];
    for (const id of fl.rooms) {
      const r = layout.rooms.get(id);
      for (const [x, z] of [[r.ox, r.oz], [r.ox + r.w, r.oz], [r.ox, r.oz + r.d], [r.ox + r.w, r.oz + r.d]]) {
        if (x <= below.right + 0.01 && z <= below.depth + 0.01) continue; // the floor below holds it up
        const col = box(perFloor[fl.level], 0.3, fl.y, 0.3, '#efe7da', x - Math.sign(x - r.ox - r.w / 2) * 0.15, fl.y / 2 - 0.2, z - Math.sign(z - r.oz - r.d / 2) * 0.15);
        col.userData.column = true;
      }
    }
  }

  // --- the spiral staircase: a centre pole, wedge steps and a handrail, one turn per floor
  for (let f = 0; f < floors.length - 1; f++) {
    const g = new THREE.Group(); group.add(g); stairs.push(g);
    const y0 = floors[f].y;
    cyl(g, 0.09, FLOOR_H + 0.1, metal, stair.x, y0 + FLOOR_H / 2, stair.z, 10);
    const railPts = [];
    for (let i = 0; i < STEPS; i++) {
      const th = Math.PI + ((i + 0.5) / STEPS) * Math.PI * 2;
      const y = y0 + ((i + 1) / STEPS) * FLOOR_H;
      const step = new THREE.Mesh(new THREE.BoxGeometry(STAIR_R - 0.08, 0.07, 0.42), mat(i % 2 ? wood : '#a8744a'));
      step.position.set(stair.x + Math.cos(th) * (STAIR_R / 2 + 0.04), y - 0.035, stair.z + Math.sin(th) * (STAIR_R / 2 + 0.04));
      step.rotation.y = -th; step.castShadow = true; step.receiveShadow = true;
      step.userData.stairs = 'gap'; step.userData.floor = f;
      g.add(step); tapTargets.push(step);
      // a baluster on every other step
      if (i % 2 === 0) box(g, 0.03, 0.9, 0.03, rail, stair.x + Math.cos(th) * (STAIR_R - 0.05), y + 0.45, stair.z + Math.sin(th) * (STAIR_R - 0.05)).castShadow = false;
    }
    for (let i = 0; i <= 32; i++) {
      const t = i / 32, th = Math.PI + t * Math.PI * 2;
      railPts.push(new THREE.Vector3(stair.x + Math.cos(th) * (STAIR_R - 0.05), y0 + t * FLOOR_H + 0.95, stair.z + Math.sin(th) * (STAIR_R - 0.05)));
    }
    tube(g, railPts, 0.03, rail);
  }

  // --- signs over the doorways between rooms (one on each side, naming the room behind)
  for (const link of layout.links) {
    if (link.type !== 'door') continue;
    for (const [id, cell, other] of [[link.a, link.cellA, link.b], [link.b, link.cellB, link.a]]) {
      const info = layout.rooms.get(id); const otherRoom = layout.rooms.get(other).room;
      const p = layout.cellGlobal(id, cell);
      const s = signSprite(`🚪 ${otherRoom.name}`, { scale: 0.85 });
      s.position.set(p.x + (id === link.a ? 0.15 : -0.15), info.y + 2.45, p.z);
      s.userData.go = other; s.userData.room = id;
      group.add(s); signs.push({ sprite: s, floor: info.floor, room: id }); tapTargets.push(s);
    }
  }
  const bounds = { x0: -1, x1: stair.x + 2, z0: -1, z1: Math.max(...floors.map((f) => f.depth)) + 6, top: floors.length * FLOOR_H + 2 };
  return { group, perFloor, stairs, signs, tapTargets, garden: { grass, bushes }, bounds };
}
