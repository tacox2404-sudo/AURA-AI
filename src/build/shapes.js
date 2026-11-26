// SHAPE HELPERS (owned by Building): every furniture model is made of simple boxes, cylinders and
// balls so we need no 3D files. Coordinates: x right, z towards the front, y up; (0, 0, 0) is the middle
// of the footprint on the floor. The id of an item must never change once houses use it.
//   box(g, w, h, d, color, x, y, z, opts)      cyl(g, r, h, color, x, y, z, sides, topRadius, opts)
//   ball(g, r, color, x, y, z, opts)           legs(g, w, d, h, color)       board(g, w, h, frame, face)
//   G((group, theme) => { ... })               wraps a model builder; theme = { floor, wall, accent, wood }
// opts can hold { emissive: '#ff8800', transparent: true, opacity: .4 } to make things glow or see-through.

import * as THREE from 'three';

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, flatShading: true, ...opts }));
  return matCache.get(key);
}
export function box(g, w, h, d, color, x = 0, y = 0, z = 0, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
export function cyl(g, r, h, color, x = 0, y = 0, z = 0, seg = 10, rTop = r, opts) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, h, seg), mat(color, opts));
  m.position.set(x, y + h / 2, z); m.castShadow = true; g.add(m); return m;
}
export function ball(g, r, color, x = 0, y = 0, z = 0, opts) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(color, opts));
  m.position.set(x, y, z); m.castShadow = true; g.add(m); return m;
}
export function legs(g, w, d, h, color, inset = 0.08, t = 0.08) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, t, h, t, color, sx * (w / 2 - inset), 0, sz * (d / 2 - inset));
}
export function board(g, w, h, frame, face, y = 0.9) {
  box(g, 0.08, y, 0.08, frame, -w / 2 + 0.1, 0, 0); box(g, 0.08, y, 0.08, frame, w / 2 - 0.1, 0, 0);
  box(g, w, h, 0.08, frame, 0, y - 0.1, 0); box(g, w - 0.14, h - 0.14, 0.1, face, 0, y - 0.03, 0.01);
}
export const G = (fn) => (t) => { const g = new THREE.Group(); fn(g, t); return g; };

