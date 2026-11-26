// ROOM LAYOUT (owned by Building): places furniture the way a person would arrange a real room,
// instead of packing everything into a corner.
//
//   - big wall pieces (TV, fireplace, shelves, boards...) go along the back wall, centred; extras spill onto the side walls
//   - the sofa faces the TV or fireplace, with a rug and coffee table in between and armchairs on the sides
//   - chairs go around tables, a chair sits in front of a desk
//   - games, gifts, benches and other loose pieces are spread in a ring around the middle, turned to face it
//   - plants go in the corners, lamps next to the seating
//
// Grid: x runs left to right (0..w-1), z runs back to front (0..d-1); the back wall is z = 0.
// rot 0 = the piece faces front (+z, towards the camera), 1 = faces left, 2 = faces the back wall, 3 = faces right.
// The result is deterministic: the same ingredients always give the same room.

import { CATALOG_BY_ID } from './catalog.js';
import { uid } from '../core/store.js';

const WALL_PRIORITY = ['tv', 'fireplace', 'arcade', 'bookshelf', 'piano', 'bed', 'desk', 'fridge', 'counter', 'jukebox', 'portal',
  'noticeboard', 'photo_frame', 'calendar_board', 'clock', 'link_board', 'checklist_board', 'weather_window', 'bathtub',
  'dj_booth', 'closet', 'bunk_bed', 'stove', 'kitchen_sink', 'pantry', 'coffee_machine', 'shower', 'bath_sink', 'toilet', 'dresser',
  'loveseat', 'balloon_arch', 'fence'];
const PLANTS = ['plant', 'tall_plant', 'tree', 'bush', 'cactus', 'fern'];
const LAMPS = new Set(['lamp', 'table_lamp', 'lava_lamp']); // lamps sit beside the seating or the bed

export function layoutItems(kinds, w, d) {
  const occ = Array.from({ length: d }, () => Array(w).fill(false));
  const items = [];
  const pending = kinds.filter((k) => CATALOG_BY_ID[k]);
  const defOf = (k) => CATALOG_BY_ID[k];
  const fp = (def, rot) => (rot % 2 ? [def.size[1], def.size[0]] : def.size);
  const cx = Math.floor(w / 2);
  const zc = Math.round(d * 0.55);
  const inside = (x, z, sw, sd) => x >= 0 && z >= 0 && x + sw <= w && z + sd <= d;
  const empty = (x, z, sw, sd) => { for (let i = x; i < x + sw; i++) for (let j = z; j < z + sd; j++) if (occ[j][i]) return false; return true; };
  const crowded = (x, z, sw, sd, clear) => {
    for (let i = x - clear; i < x + sw + clear; i++) for (let j = z - clear; j < z + sd + clear; j++) if (i >= 0 && j >= 0 && i < w && j < d && occ[j][i]) return true;
    return false;
  };

  // Put one piece down if it fits (and keeps `clear` free cells around it). Returns the item or null.
  function put(kind, x, z, rot = 0, clear = 0) {
    const def = defOf(kind); if (!def || !pending.includes(kind)) return null;
    const [sw, sd] = fp(def, rot);
    if (!inside(x, z, sw, sd) || !empty(x, z, sw, sd)) return null;
    if (clear && crowded(x, z, sw, sd, clear)) return null;
    if (!def.floorOnly) for (let i = x; i < x + sw; i++) for (let j = z; j < z + sd; j++) occ[j][i] = true;
    const item = { id: uid('i_'), kind, x, z, rot };
    items.push(item); pending.splice(pending.indexOf(kind), 1);
    return item;
  }
  const take = (pred) => { const k = pending.find(pred); return k; };
  const takeAll = (pred) => pending.filter(pred);
  const tryPlace = (kind, cands, clears = [1, 0]) => { for (const c of clears) for (const [x, z, rot] of cands) if (put(kind, x, z, rot ?? 0, c)) return true; return false; };
  /** which way should a piece at (x,z) face to look at the point (tx,tz)? */
  const facing = (x, z, tx, tz) => { const dx = tx - x, dz = tz - z; return Math.abs(dz) >= Math.abs(dx) ? (dz >= 0 ? 0 : 2) : (dx >= 0 ? 3 : 1); };

  // ---- 1. wall pieces: centred on the back wall, then left wall, then right wall ----
  // with a TV on the back wall, the fireplace and piano go on the side walls (like a real living room)
  const hasTv = pending.includes('tv');
  const sideFirst = hasTv ? [...new Set(takeAll((k) => k === 'fireplace' || k === 'piano'))] : [];
  const wallKinds = takeAll((k) => defOf(k).wall && k !== 'sofa' && !sideFirst.includes(k)).sort((a, b) => {
    const ia = WALL_PRIORITY.indexOf(a), ib = WALL_PRIORITY.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  let spanL = null, spanR = null; let side = 1;
  const placed = {};
  const rowWidth = wallKinds.reduce((sum, k) => sum + defOf(k).size[0], 0);
  const gap = rowWidth + (wallKinds.length - 1) <= w - 2 ? 1 : 0; // breathing room between wall pieces when they all fit
  // put a piece on the left wall (facing right), or else the right wall (facing left)
  function onSideWall(kind) {
    const [fw, fd] = fp(defOf(kind), 3);
    for (let z = 2; z + fd <= d - 1; z += 1) if (put(kind, 0, z, 3)) return true;
    for (let z = 2; z + fd <= d - 1; z += 1) if (put(kind, w - fw, z, 1)) return true;
    return false;
  }
  for (const kind of sideFirst) onSideWall(kind);
  for (const kind of wallKinds) {
    const [sw] = defOf(kind).size;
    let item = null;
    if (spanL === null) {
      item = put(kind, cx - Math.floor(sw / 2), 0, 0);
    } else {
      const tries = side > 0 ? [spanR + 1 + gap, spanL - gap - sw] : [spanL - gap - sw, spanR + 1 + gap];
      for (const x of tries) { if (x >= 1 && x + sw <= w - 1 && (item = put(kind, x, 0, 0))) break; }
      if (item) side = -side;
    }
    if (item) { spanL = spanL === null ? item.x : Math.min(spanL, item.x); spanR = spanR === null ? item.x + sw - 1 : Math.max(spanR, item.x + sw - 1); placed[kind] = placed[kind] || item; continue; }
    onSideWall(kind); // no room on the back wall: spill onto the side walls
  }
  const focal = placed.tv || placed.fireplace || null;

  // ---- 2. the sitting area ----
  const hasSofa = pending.includes('sofa');
  if (focal) {
    // sofa faces the focal piece, rug + coffee table between them
    if (pending.includes('rug')) put('rug', cx - 1, zc - 1, 0);
    if (pending.includes('coffee_table')) put('coffee_table', cx - 1, zc, 0);
    if (hasSofa) tryPlace('sofa', [[cx - 1, Math.min(zc + 2, d - 2), 2], [cx - 1, zc + 1, 2], [cx - 1, d - 2, 2]], [0]);
  } else if (hasSofa) {
    // no TV: sofa against the back wall, coffee table and rug in front of it
    tryPlace('sofa', [[cx - 1, 0, 0]], [0]);
    if (pending.includes('rug')) put('rug', cx - 1, 1, 0);
    if (pending.includes('coffee_table')) put('coffee_table', cx - 1, 2, 0);
  } else if (pending.includes('rug')) {
    put('rug', cx - 1, zc - 1, 0);
  }
  const sofaItem = items.find((i) => i.kind === 'sofa');
  const tableItem = items.find((i) => i.kind === 'coffee_table');
  const midZ = tableItem ? tableItem.z : zc;
  // armchairs flank the middle, facing it
  const chairSpots = [[cx - 3, midZ, 3], [cx + 2, midZ, 1], [cx - 3, midZ + 2, 3], [cx + 2, midZ + 2, 1]];
  for (const kind of takeAll((k) => k === 'armchair')) {
    if (focal || sofaItem || items.some((i) => i.kind === 'rug')) tryPlace(kind, chairSpots, [0]);
    else tryPlace(kind, [[cx - 2, zc, 2], [cx + 1, zc, 2], [cx - 2, zc + 2, 2], [cx + 1, zc + 2, 2]], [0]); // reading chairs facing the wall boards
  }
  // beanbags beside the sofa
  const bagY = sofaItem ? sofaItem.z : zc + 2;
  for (const kind of takeAll((k) => k === 'beanbag')) tryPlace(kind, [[cx - 3, bagY, 0], [cx + 2, bagY, 0], [cx - 3, bagY - 2, 0], [cx + 2, bagY - 2, 0]], [0]);

  // the pool table is the centrepiece of a games room
  if (pending.includes('pool_table')) tryPlace('pool_table', [[cx - 1, zc, 0], [cx - 1, zc - 1, 0], [cx - 1, zc + 1, 0], [1, zc, 0]], [1, 0]);

  // ---- 3. tables with chairs, desks with a chair ----
  const table = take((k) => k === 'table');
  if (table) {
    const spots = [[cx - 1, zc], [cx - 1, zc - 1], [cx - 1, zc + 1], [1, zc]];
    for (const [tx, tz] of spots) if (put('table', tx, tz, 0)) {
      const around = [[tx, tz - 1, 0], [tx + 1, tz + 1, 2], [tx - 1, tz, 3], [tx + 2, tz, 1], [tx + 1, tz - 1, 0], [tx, tz + 1, 2]];
      for (const kind of takeAll((k) => k === 'chair')) tryPlace(kind, around, [0]);
      break;
    }
  }
  const desk = placed.desk;
  for (const kind of takeAll((k) => k === 'chair')) {
    if (desk) tryPlace(kind, [[desk.x, 1, 2], [desk.x + 1, 1, 2]], [0]);
    else tryPlace(kind, [[cx - 2, zc, 2], [cx + 1, zc, 2]], [0]);
  }

  // nightstands go on either side of the bed
  const bed = placed.bed || placed.single_bed || placed.bunk_bed;
  if (bed) for (const kind of takeAll((k) => k === 'nightstand')) tryPlace(kind, [[bed.x - 1, bed.z, 0], [bed.x + defOf(bed.kind).size[0], bed.z, 0]], [0]);

  // ---- 4. loose pieces in a ring around the middle, turned to face it ----
  const ringKinds = takeAll((k) => !PLANTS.includes(k) && !LAMPS.has(k) && k !== 'rug' && !defOf(k).wall);
  const R = Math.max(2.6, Math.min(w, d) * 0.36);
  ringKinds.forEach((kind, n) => {
    const def = defOf(kind);
    // spread along the lower half circle: left side, front, right side (the back is for wall pieces)
    const count = ringKinds.length;
    const t = count === 1 ? 0.2 : n / (count - 1);
    const ang = Math.PI * 1.02 - t * Math.PI * 1.04;
    const tx = cx + Math.cos(ang) * R * 1.15, tz = zc + Math.sin(ang) * R * 0.85;
    let best = null;
    for (let z = 1; z < d - 1; z++) for (let x = 1; x < w - 1; x++) {
      const dist = Math.hypot(x + 0.5 - tx, z + 0.5 - tz);
      if (!best || dist < best.dist) {
        const rot = facing(x, z, cx, zc);
        const [sw, sd] = fp(def, rot);
        if (inside(x, z, sw, sd) && empty(x, z, sw, sd) && !crowded(x, z, sw, sd, 1)) best = { x, z, rot, dist };
      }
    }
    if (best) put(kind, best.x, best.z, best.rot);
  });

  // ---- 5. plants in the corners, lamps by the seating ----
  const corners = [[0, 0], [w - 1, 0], [w - 1, d - 1], [0, d - 1]];
  for (const kind of takeAll((k) => PLANTS.includes(k))) tryPlace(kind, corners.map(([x, z]) => [x, z, 0]), [0]);
  const bedItem = placed.bed || placed.single_bed || placed.bunk_bed;
  const lampSpots = [...(sofaItem ? [[sofaItem.x + 2, sofaItem.z, 0], [sofaItem.x - 1, sofaItem.z, 0]] : []), ...(bedItem ? [[bedItem.x - 1, bedItem.z + 1, 0], [bedItem.x + defOf(bedItem.kind).size[0], bedItem.z + 1, 0]] : [])];
  for (const kind of takeAll((k) => LAMPS.has(k))) tryPlace(kind, [...lampSpots, [1, 1, 0], [w - 2, 1, 0], [0, 1, 0], [w - 1, 1, 0]], [0]);

  // ---- 6. anything left over: any free cell (so nothing is ever dropped) ----
  for (const kind of [...pending]) {
    const def = defOf(kind); const [sw, sd] = def.size;
    let ok = false;
    for (let z = 1; z < d && !ok; z++) for (let x = 0; x < w && !ok; x++) ok = !!put(kind, x, z, 0, def.floorOnly ? 0 : 0);
    if (!ok) for (let z = 0; z < d && !ok; z++) for (let x = 0; x < w && !ok; x++) ok = !!put(kind, x, z, 0, 0);
  }
  return items;
}

/** Re-arrange the furniture of an existing room. Keeps every item's id and data, only moves and turns them. */
export function arrangeRoom(room) {
  const fresh = layoutItems(room.items.map((i) => i.kind), room.size[0], room.size[1]);
  const pool = room.items.map((i) => ({ ...i }));
  return fresh.map((n) => {
    const k = pool.findIndex((o) => o.kind === n.kind);
    const old = k >= 0 ? pool.splice(k, 1)[0] : null;
    return old ? { ...old, x: n.x, z: n.z, rot: n.rot } : n;
  });
}
