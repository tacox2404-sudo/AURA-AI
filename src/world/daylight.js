// DAYLIGHT + WINDOWS (owned by World): the room follows your real clock.
// Morning is soft and pink, midday bright, the evening golden, and at night the room goes
// dark blue while lamps, candles and the fireplace glow warm. Windows on the walls show the sky.
//
// Everything here is decoration: nothing is saved and other players don't need it
// (each person sees their own time of day, which is nice for long-distance houses).

import * as THREE from 'three';

// Key moments of the day (hour -> colours). We blend between the two nearest ones.
const KEYS = [
  { h: 0, sky: '#1b2140', sun: '#8fa3ff', sunI: 0.25, hemi: 0.55, night: 1 },
  { h: 5.5, sky: '#2c3560', sun: '#9fb0ff', sunI: 0.3, hemi: 0.65, night: 1 },
  { h: 7, sky: '#ffc4a8', sun: '#ffcfa8', sunI: 1.1, hemi: 1.1, night: 0.25 },
  { h: 9, sky: '#bfe3ff', sun: '#fff3df', sunI: 1.6, hemi: 1.4, night: 0 },
  { h: 16.5, sky: '#bfe3ff', sun: '#fff3df', sunI: 1.6, hemi: 1.4, night: 0 },
  { h: 18.5, sky: '#ffb38a', sun: '#ffb070', sunI: 1.2, hemi: 1.1, night: 0.3 },
  { h: 20, sky: '#4b3f78', sun: '#b9a3ff', sunI: 0.45, hemi: 0.75, night: 0.85 },
  { h: 24, sky: '#1b2140', sun: '#8fa3ff', sunI: 0.25, hemi: 0.55, night: 1 },
];

/** The light for a given hour (0-24, can have decimals). */
export function lightAt(hour) {
  let a = KEYS[0], b = KEYS[1];
  for (let i = 0; i < KEYS.length - 1; i++) if (hour >= KEYS[i].h && hour <= KEYS[i + 1].h) { a = KEYS[i]; b = KEYS[i + 1]; break; }
  const t = (hour - a.h) / Math.max(0.001, b.h - a.h);
  const mix = (x, y) => x + (y - x) * t;
  return {
    sky: new THREE.Color(a.sky).lerp(new THREE.Color(b.sky), t),
    sun: new THREE.Color(a.sun).lerp(new THREE.Color(b.sun), t),
    sunI: mix(a.sunI, b.sunI), hemi: mix(a.hemi, b.hemi), night: mix(a.night, b.night),
  };
}

// Things that give light at night, and how high the light sits on them.
export const GLOWING = { lamp: 1.45, candles: 0.45, fireplace: 0.5, tv: 1.0, arcade: 1.3, jukebox: 1.0, portal: 1.0 };

/**
 * Windows for one room, on its outside walls only.
 * walk: the room's walk grid. sides: which walls are outside walls ([x, z] directions, see roomMesh.js).
 * avoid: cells with a door in them (no window right next to a door).
 * Returns { group, windows: [{ group, out }], update(light) }.
 */
export function buildWindows(room, walk, sides, avoid = [], skies = null) {
  const [w, d] = room.size;
  const group = new THREE.Group();
  const nearDoor = (x, z) => avoid.some((c) => Math.abs(c.x - x) <= 1 && Math.abs(c.z - z) <= 1);
  // the glass shows a live sky picture (sky.js); the first window can show the partner's city instead
  const glassMat = new THREE.MeshBasicMaterial({ color: skies ? '#ffffff' : '#bfe3ff', map: skies?.home || null });
  const partnerMat = skies?.partner ? new THREE.MeshBasicMaterial({ map: skies.partner }) : null;
  const frameMat = new THREE.MeshStandardMaterial({ color: '#fffaf0', roughness: 0.6 });
  const sillMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(room.theme.wood || '#a47148'), roughness: 0.7 });
  const windows = [];
  const cellsOf = ([ox, oz]) => (oz ? Array.from({ length: w }, (_, x) => ({ x, z: oz < 0 ? 0 : d - 1 })) : Array.from({ length: d }, (_, z) => ({ x: ox < 0 ? 0 : w - 1, z })));
  for (const out of sides) {
    const cells = cellsOf(out); const n = cells.length;
    const order = [Math.round(n / 3), Math.round((2 * n) / 3) - 1, ...cells.map((_, i) => i)];
    let placed = 0; const taken = [];
    for (const i of order) {
      if (placed >= 2 || i < 1 || i > n - 2 || taken.some((k) => Math.abs(k - i) < 2)) continue;
      const c = cells[i];
      if (walk.isBlockedCell(c.x, c.z) || nearDoor(c.x, c.z)) continue;
      taken.push(i); placed++;
      const [ox, oz] = out; const ry = Math.atan2(-ox, -oz);
      const p = walk.cellCenter(c.x, c.z);
      const g = new THREE.Group();
      g.position.set(ox ? ox * w / 2 - ox * 0.02 : p.x, 0, oz ? oz * d / 2 - oz * 0.02 : p.z); g.rotation.y = ry;
      const bar = (bw, bh, x, y, z = 0.03) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.06), frameMat); m.position.set(x, y, z); g.add(m); };
      // glass on both faces of the wall, so the window shows from outside too
      const mine = windows.length === 0 && partnerMat ? partnerMat : glassMat;
      for (const z of [0.01, -0.25]) { const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.85), mine); glass.position.set(0, 1.65, z); if (z < 0) glass.rotation.y = Math.PI; g.add(glass); }
      for (const z of [0.03, -0.27]) { bar(0.92, 0.07, 0, 2.1, z); bar(0.92, 0.07, 0, 1.2, z); bar(0.07, 0.95, -0.43, 1.65, z); bar(0.07, 0.95, 0.43, 1.65, z); bar(0.04, 0.85, 0, 1.65, z); bar(0.8, 0.04, 0, 1.65, z); }
      const sill = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.16), sillMat); sill.position.set(0, 1.17, 0.07); g.add(sill);
      group.add(g); windows.push({ group: g, out, partner: mine === partnerMat });
    }
  }
  function update(light) {
    if (skies) return; // the live sky picture already follows the time of day
    // by day the glass shows the sky; at night it glows a little warm (lights on inside)
    glassMat.color.copy(light.sky).lerp(new THREE.Color('#ffffff'), 0.15 * (1 - light.night)).lerp(new THREE.Color('#ffd28a'), 0.35 * light.night);
  }
  return { group, windows, update };
}
