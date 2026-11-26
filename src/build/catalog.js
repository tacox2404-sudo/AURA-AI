// FURNITURE CATALOG (owned by Building).
// Every item is built from simple boxes and cylinders, so we need no 3D files yet.
// Later you can swap any item for a real CC0 model (Kenney / Quaternius) by
// replacing its build() function with a GLTF loader. The id must stay the same.
//
// Palette categories: Seating (you can sit on these), Tables, Games, Fun, Boards, Decor,
// Kitchen, Bathroom, Bedroom, Garden, Party.
//
// Item fields:
//   id        unique id, saved in houses (never rename one that is in use)
//   name      shown in the build palette
//   cat       palette category
//   size      [w, d] in floor cells
//   wall      true = prefers to stand against the back wall
//   activity  what opens when someone taps it (see src/activities/registry.js)
//   build(t)  returns a THREE.Group; t = room theme colours { floor, wall, accent, wood }

import * as THREE from 'three';

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, flatShading: true, ...opts }));
  return matCache.get(key);
}
function box(g, w, h, d, color, x = 0, y = 0, z = 0, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function cyl(g, r, h, color, x = 0, y = 0, z = 0, seg = 10, rTop = r) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, h, seg), mat(color));
  m.position.set(x, y + h / 2, z); m.castShadow = true; g.add(m); return m;
}
function ball(g, r, color, x = 0, y = 0, z = 0, opts) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(color, opts));
  m.position.set(x, y, z); m.castShadow = true; g.add(m); return m;
}
function legs(g, w, d, h, color, inset = 0.08, t = 0.08) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, t, h, t, color, sx * (w / 2 - inset), 0, sz * (d / 2 - inset));
}
function board(g, w, h, frame, face, y = 0.9) {
  box(g, 0.08, y, 0.08, frame, -w / 2 + 0.1, 0, 0); box(g, 0.08, y, 0.08, frame, w / 2 - 0.1, 0, 0);
  box(g, w, h, 0.08, frame, 0, y - 0.1, 0); box(g, w - 0.14, h - 0.14, 0.1, face, 0, y - 0.03, 0.01);
}
const G = (fn) => (t) => { const g = new THREE.Group(); fn(g, t); return g; };

export const CATALOG = [
  // ---------------- Seating ----------------
  { id: 'sofa', name: 'Sofa', cat: 'Seating', size: [2, 1], wall: true, build: G((g, t) => {
    box(g, 1.9, 0.35, 0.85, t.accent, 0, 0.1); box(g, 1.9, 0.5, 0.22, t.accent, 0, 0.35, -0.32);
    box(g, 0.2, 0.3, 0.85, t.accent, -0.85, 0.35); box(g, 0.2, 0.3, 0.85, t.accent, 0.85, 0.35);
    box(g, 0.8, 0.12, 0.6, '#f4efe6', -0.42, 0.45, 0.05); box(g, 0.8, 0.12, 0.6, '#f4efe6', 0.42, 0.45, 0.05);
  }) },
  { id: 'armchair', name: 'Armchair', cat: 'Seating', size: [1, 1], build: G((g, t) => {
    box(g, 0.85, 0.35, 0.8, t.accent, 0, 0.1); box(g, 0.85, 0.5, 0.2, t.accent, 0, 0.35, -0.3);
    box(g, 0.15, 0.25, 0.8, t.accent, -0.35, 0.4); box(g, 0.15, 0.25, 0.8, t.accent, 0.35, 0.4);
  }) },
  { id: 'beanbag', name: 'Beanbag', cat: 'Seating', size: [1, 1], build: G((g, t) => { const b = ball(g, 0.42, t.accent, 0, 0.3); b.scale.set(1, 0.7, 1); }) },
  { id: 'chair', name: 'Chair', cat: 'Seating', size: [1, 1], build: G((g, t) => {
    legs(g, 0.5, 0.5, 0.45, t.wood); box(g, 0.55, 0.08, 0.55, t.wood, 0, 0.45); box(g, 0.55, 0.55, 0.08, t.wood, 0, 0.5, -0.24);
  }) },
  { id: 'bench', name: 'Bench', cat: 'Seating', size: [2, 1], build: G((g, t) => { legs(g, 1.6, 0.4, 0.4, t.wood); box(g, 1.7, 0.1, 0.45, t.wood, 0, 0.4); }) },

  // ---------------- Tables ----------------
  { id: 'table', name: 'Dining table', cat: 'Tables', size: [2, 1], build: G((g, t) => { legs(g, 1.7, 0.8, 0.7, t.wood); box(g, 1.8, 0.08, 0.9, t.wood, 0, 0.7); }) },
  { id: 'coffee_table', name: 'Coffee table', cat: 'Tables', size: [1, 1], build: G((g, t) => { legs(g, 0.8, 0.6, 0.3, t.wood); box(g, 0.9, 0.07, 0.7, t.wood, 0, 0.3); }) },
  { id: 'desk', name: 'Desk', cat: 'Tables', size: [2, 1], wall: true, build: G((g, t) => {
    legs(g, 1.6, 0.6, 0.72, t.wood); box(g, 1.7, 0.07, 0.7, t.wood, 0, 0.72); box(g, 0.6, 0.4, 0.05, '#222', 0, 0.8, -0.2); box(g, 0.55, 0.35, 0.02, '#7fd3ff', 0, 0.82, -0.17, { emissive: '#2a6f9a' });
  }) },
  { id: 'connect4_table', name: 'Connect Four', cat: 'Games', size: [1, 1], activity: 'connect4', build: G((g, t) => {
    legs(g, 0.8, 0.8, 0.6, t.wood); box(g, 0.9, 0.06, 0.9, t.wood, 0, 0.6); box(g, 0.7, 0.55, 0.08, '#2f5fd0', 0, 0.66);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) ball(g, 0.06, (i + j) % 2 ? '#ffd23f' : '#ff4d4d', -0.2 + i * 0.2, 0.8 + j * 0.14, 0.05);
  }) },
  { id: 'tictactoe_table', name: 'Tic-Tac-Toe', cat: 'Games', size: [1, 1], activity: 'tictactoe', build: G((g, t) => {
    legs(g, 0.8, 0.8, 0.6, t.wood); box(g, 0.9, 0.06, 0.9, '#f4efe6', 0, 0.6);
    for (const p of [-0.13, 0.13]) { box(g, 0.02, 0.02, 0.7, '#333', p, 0.66); box(g, 0.7, 0.02, 0.02, '#333', 0, 0.66, p); }
    ball(g, 0.07, '#ff4d6d', 0, 0.72, 0); ball(g, 0.07, '#4d7bff', 0.26, 0.72, -0.26);
  }) },
  { id: 'easel', name: 'Drawing easel', cat: 'Games', size: [1, 1], activity: 'draw', build: G((g, t) => {
    box(g, 0.06, 1.5, 0.06, t.wood, -0.3, 0, 0.1); box(g, 0.06, 1.5, 0.06, t.wood, 0.3, 0, 0.1); box(g, 0.06, 1.4, 0.06, t.wood, 0, 0, -0.25);
    box(g, 0.8, 0.6, 0.04, '#ffffff', 0, 0.75, 0.13); box(g, 0.3, 0.04, 0.04, '#ff6b6b', -0.1, 1.0, 0.16); box(g, 0.2, 0.04, 0.04, '#4dabf7', 0.1, 0.9, 0.16);
  }) },
  { id: 'arcade', name: 'Arcade machine', cat: 'Games', size: [1, 1], wall: true, activity: 'games', build: G((g, t) => {
    box(g, 0.8, 1.6, 0.7, '#3b2a7a'); box(g, 0.62, 0.45, 0.05, '#0ff', 0, 1.0, 0.33, { emissive: '#0aa' }); box(g, 0.8, 0.12, 0.35, '#222', 0, 0.8, 0.35);
    ball(g, 0.05, '#ff3b3b', -0.15, 0.97, 0.42); ball(g, 0.04, '#ffd23f', 0.1, 0.95, 0.42); box(g, 0.8, 0.15, 0.7, '#ff4fd8', 0, 1.6, 0, { emissive: '#a0278a' });
  }) },
  { id: 'pool_table', name: 'Pool table', cat: 'Games', size: [2, 1], activity: 'games', build: G((g, t) => {
    legs(g, 1.7, 0.8, 0.7, '#5a3b22', 0.15, 0.15); box(g, 1.9, 0.12, 1.0, '#5a3b22', 0, 0.7); box(g, 1.7, 0.04, 0.8, '#1f8a4c', 0, 0.82);
    ball(g, 0.05, '#fff', -0.4, 0.89, 0); ball(g, 0.05, '#ff3b3b', 0.3, 0.89, 0.1); ball(g, 0.05, '#ffd23f', 0.4, 0.89, -0.1);
  }) },
  { id: 'trophy', name: 'Trophy stand', cat: 'Games', size: [1, 1], activity: 'leaderboard', build: G((g, t) => {
    box(g, 0.6, 0.8, 0.6, t.wood); cyl(g, 0.1, 0.15, '#e6b800', 0, 0.8); cyl(g, 0.05, 0.15, '#e6b800', 0, 0.95); cyl(g, 0.18, 0.25, '#ffd23f', 0, 1.1, 0, 10, 0.25);
  }) },

  // ---------------- Fun & media ----------------
  { id: 'tv', name: 'TV + movie night', cat: 'Fun', size: [2, 1], wall: true, activity: 'movies', build: G((g, t) => {
    box(g, 1.6, 0.5, 0.5, t.wood); box(g, 1.5, 0.85, 0.08, '#111', 0, 0.6, -0.1); box(g, 1.4, 0.75, 0.02, '#334d80', 0, 0.65, -0.05, { emissive: '#1d2e55' });
  }) },
  { id: 'portal', name: 'Portal (link)', cat: 'Fun', size: [1, 1], wall: true, activity: 'portal', build: G((g, t) => {
    box(g, 0.15, 1.8, 0.2, '#6c4cff', -0.4); box(g, 0.15, 1.8, 0.2, '#6c4cff', 0.4); box(g, 0.95, 0.15, 0.2, '#6c4cff', 0, 1.8);
    box(g, 0.65, 1.65, 0.04, '#a98bff', 0, 0.1, 0, { emissive: '#7a54ff', transparent: true, opacity: 0.75 });
  }) },
  { id: 'jukebox', name: 'Jukebox', cat: 'Fun', size: [1, 1], wall: true, activity: 'portal', build: G((g, t) => {
    box(g, 0.8, 1.2, 0.55, '#b3261e'); cyl(g, 0.4, 0.55, '#ffcf5c', 0, 1.2, 0, 12); box(g, 0.5, 0.3, 0.05, '#ffe9a8', 0, 0.75, 0.28, { emissive: '#c08a00' });
  }) },
  { id: 'bookshelf', name: 'Bookshelf', cat: 'Fun', size: [1, 1], wall: true, activity: 'notes', build: G((g, t) => {
    box(g, 0.9, 1.8, 0.4, t.wood); const cols = ['#e76f51', '#2a9d8f', '#e9c46a', '#264653', '#f4a261'];
    for (let s = 0; s < 3; s++) for (let i = 0; i < 5; i++) box(g, 0.12, 0.38, 0.3, cols[(i + s) % 5], -0.3 + i * 0.15, 0.15 + s * 0.55, 0.08);
  }) },

  // ---------------- Boards (the AI's building blocks) ----------------
  { id: 'photo_frame', name: 'Memory gallery', cat: 'Boards', size: [1, 1], wall: true, activity: 'gallery', build: G((g, t) => {
    board(g, 0.9, 0.75, '#c9a227', '#f6e7c1', 1.5); box(g, 0.25, 0.2, 0.02, '#ff8fab', -0.2, 1.4, 0.07); box(g, 0.25, 0.2, 0.02, '#8ecae6', 0.15, 1.2, 0.07);
  }) },
  { id: 'link_board', name: 'Link board', cat: 'Boards', size: [1, 1], wall: true, activity: 'links', build: G((g, t) => {
    board(g, 0.95, 0.75, t.wood, '#d9b38c', 1.4); for (let i = 0; i < 4; i++) box(g, 0.25, 0.18, 0.02, ['#fff3b0', '#cdeac0', '#ffc8dd', '#bde0fe'][i], -0.18 + (i % 2) * 0.36, 1.25 - Math.floor(i / 2) * 0.28, 0.07);
  }) },
  { id: 'calendar_board', name: 'Calendar + countdown', cat: 'Boards', size: [1, 1], wall: true, activity: 'calendar', build: G((g, t) => {
    board(g, 0.9, 0.8, '#444', '#ffffff', 1.45); box(g, 0.76, 0.16, 0.02, '#e63946', 0, 1.55, 0.07);
    for (let i = 0; i < 12; i++) box(g, 0.12, 0.1, 0.02, i === 7 ? '#e63946' : '#ddd', -0.27 + (i % 4) * 0.18, 1.35 - Math.floor(i / 4) * 0.15, 0.07);
  }) },
  { id: 'checklist_board', name: 'Checklist + notes', cat: 'Boards', size: [1, 1], wall: true, activity: 'notes', build: G((g, t) => {
    board(g, 0.8, 0.9, '#2b2d42', '#2b2d42', 1.5); for (let i = 0; i < 4; i++) box(g, 0.5, 0.04, 0.02, '#edf2f4', 0.05, 1.3 - i * 0.16, 0.07);
  }) },
  { id: 'weather_window', name: 'Weather window', cat: 'Boards', size: [1, 1], wall: true, activity: 'weather', build: G((g, t) => {
    box(g, 0.9, 0.9, 0.1, '#ffffff', 0, 0.9); box(g, 0.78, 0.78, 0.04, '#9bd4ff', 0, 0.96, 0.04, { emissive: '#4a8fc2' }); ball(g, 0.12, '#ffd23f', 0.18, 1.55, 0.08, { emissive: '#c99a00' });
    box(g, 0.04, 0.78, 0.05, '#fff', 0, 0.96, 0.06); box(g, 0.78, 0.04, 0.05, '#fff', 0, 1.33, 0.06);
  }) },
  { id: 'globe', name: 'Travel globe', cat: 'Boards', size: [1, 1], activity: 'travel', build: G((g, t) => {
    box(g, 0.5, 0.7, 0.5, t.wood); cyl(g, 0.04, 0.2, '#888', 0, 0.7); ball(g, 0.3, '#3a86ff', 0, 1.15, 0); ball(g, 0.12, '#52b788', 0.12, 1.25, 0.18); ball(g, 0.1, '#52b788', -0.15, 1.05, 0.2);
  }) },
  { id: 'gift_box', name: 'Wish list gift box', cat: 'Boards', size: [1, 1], activity: 'wishlist', build: G((g, t) => {
    box(g, 0.6, 0.5, 0.6, '#ff6b9a'); box(g, 0.64, 0.12, 0.64, '#ff8fb3', 0, 0.5); box(g, 0.1, 0.63, 0.62, '#ffd23f'); box(g, 0.62, 0.63, 0.1, '#ffd23f');
    ball(g, 0.1, '#ffd23f', -0.08, 0.7, 0); ball(g, 0.1, '#ffd23f', 0.08, 0.7, 0);
  }) },
  { id: 'mailbox', name: 'Thinking-of-you mailbox', cat: 'Boards', size: [1, 1], activity: 'nudge', build: G((g, t) => {
    box(g, 0.1, 0.9, 0.1, t.wood); box(g, 0.45, 0.35, 0.6, t.accent, 0, 0.9); box(g, 0.04, 0.25, 0.12, '#ff3b3b', 0.25, 1.05, 0.15);
  }) },
  { id: 'welcome_sign', name: 'Welcome + invite sign', cat: 'Boards', size: [1, 1], activity: 'invite', build: G((g, t) => {
    box(g, 0.08, 1.0, 0.08, t.wood); box(g, 0.9, 0.5, 0.08, t.wood, 0, 0.9); box(g, 0.78, 0.38, 0.02, '#fff7e6', 0, 0.96, 0.05);
  }) },
  { id: 'noticeboard', name: 'Chat noticeboard', cat: 'Boards', size: [1, 1], wall: true, activity: 'chat', build: G((g, t) => {
    board(g, 0.95, 0.75, t.wood, '#c49a6c', 1.4); for (let i = 0; i < 5; i++) box(g, 0.2, 0.2, 0.02, ['#ffd6a5', '#caffbf', '#9bf6ff', '#ffc6ff', '#fdffb6'][i], -0.3 + i * 0.15, 1.15 + (i % 2) * 0.22, 0.07);
  }) },
  { id: 'big_button', name: 'Big button', cat: 'Boards', size: [1, 1], activity: 'portal', build: G((g, t) => {
    box(g, 0.5, 0.8, 0.5, '#444'); cyl(g, 0.18, 0.12, '#ff3b3b', 0, 0.8, 0, 14);
  }) },

  // ---------------- Decor ----------------
  { id: 'plant', name: 'Plant', cat: 'Decor', size: [1, 1], build: G((g, t) => { cyl(g, 0.2, 0.35, '#c96f4a', 0, 0, 0, 8, 0.25); ball(g, 0.3, '#4f9d69', 0, 0.6); ball(g, 0.2, '#62b37a', 0.12, 0.85, 0.05); }) },
  { id: 'tall_plant', name: 'Tall plant', cat: 'Decor', size: [1, 1], build: G((g, t) => { cyl(g, 0.22, 0.4, '#f1f1f1', 0, 0, 0, 8); cyl(g, 0.04, 0.8, '#6b4f2a', 0, 0.4); ball(g, 0.35, '#2d6a4f', 0, 1.35); }) },
  { id: 'lamp', name: 'Floor lamp', cat: 'Decor', size: [1, 1], build: G((g, t) => { cyl(g, 0.18, 0.05, '#333'); cyl(g, 0.03, 1.4, '#333', 0, 0.05); cyl(g, 0.25, 0.3, '#fff1c1', 0, 1.4, 0, 10, 0.15).material = mat('#fff1c1', { emissive: '#ffcc66' }); }) },
  { id: 'rug', name: 'Rug', cat: 'Decor', size: [2, 2], floorOnly: true, build: G((g, t) => { box(g, 1.8, 0.03, 1.8, t.accent); box(g, 1.4, 0.035, 1.4, '#f4efe6'); }) },
  { id: 'heart_balloon', name: 'Heart balloons', cat: 'Decor', size: [1, 1], build: G((g, t) => {
    for (const [x, y, c] of [[-0.15, 1.5, '#ff4d6d'], [0.15, 1.7, '#ff8fab'], [0, 1.3, '#ffb3c6']]) { const b = ball(g, 0.18, c, x, y, 0, { emissive: '#400010' }); b.scale.set(1, 1.1, 0.8); cyl(g, 0.005, y - 0.15, '#999', x / 2, 0); }
  }) },
  { id: 'candles', name: 'Candles', cat: 'Decor', size: [1, 1], build: G((g, t) => { for (const [x, h] of [[-0.15, 0.3], [0.05, 0.45], [0.2, 0.25]]) { cyl(g, 0.06, h, '#fff8e7', x); ball(g, 0.04, '#ffb703', x, h + 0.05, 0, { emissive: '#ff8800' }); } }) },
  { id: 'fireplace', name: 'Fireplace', cat: 'Decor', size: [2, 1], wall: true, build: G((g, t) => {
    box(g, 1.6, 1.1, 0.5, '#b5838d'); box(g, 0.9, 0.6, 0.1, '#2b2b2b', 0, 0.1, 0.22); ball(g, 0.15, '#ff8800', 0, 0.25, 0.2, { emissive: '#ff5500' }); box(g, 1.8, 0.1, 0.6, '#6d4c41', 0, 1.1);
  }) },
  { id: 'clock', name: 'Grandfather clock', cat: 'Decor', size: [1, 1], wall: true, activity: 'calendar', build: G((g, t) => { box(g, 0.5, 1.9, 0.35, t.wood); cyl(g, 0.18, 0.04, '#fff', 0, 1.55, 0.18, 12).rotation.x = Math.PI / 2; }) },

  { id: 'piano', name: 'Piano', cat: 'Fun', size: [2, 1], wall: true, build: G((g, t) => { box(g, 1.5, 1.1, 0.5, '#1b1b1b'); box(g, 1.4, 0.05, 0.25, '#ffffff', 0, 0.75, 0.3); for (let i = 0; i < 8; i++) box(g, 0.05, 0.03, 0.15, '#111', -0.55 + i * 0.16, 0.79, 0.27); }) },
  { id: 'tree', name: 'Indoor tree', cat: 'Decor', size: [1, 1], build: G((g, t) => { cyl(g, 0.25, 0.3, '#8d6e63'); cyl(g, 0.08, 1.0, '#6d4c41', 0, 0.3); ball(g, 0.5, '#3a7d44', 0, 1.6); ball(g, 0.35, '#4caf50', 0.25, 1.9, 0.1); }) },

  // ---------------- Kitchen ----------------
  { id: 'fridge', name: 'Fridge', cat: 'Kitchen', size: [1, 1], wall: true, activity: 'notes', build: G((g, t) => { box(g, 0.8, 1.8, 0.7, '#e9ecef'); box(g, 0.04, 0.4, 0.04, '#999', 0.3, 1.1, 0.36); box(g, 0.04, 0.3, 0.04, '#999', 0.3, 0.5, 0.36); box(g, 0.78, 0.02, 0.02, '#bbb', 0, 1.0, 0.36); }) },
  { id: 'counter', name: 'Kitchen counter', cat: 'Kitchen', size: [2, 1], wall: true, build: G((g, t) => { box(g, 1.9, 0.85, 0.7, t.wood); box(g, 1.95, 0.06, 0.75, '#f8f9fa', 0, 0.85); box(g, 0.5, 0.05, 0.4, '#adb5bd', 0.4, 0.9); }) },
  { id: 'stove', name: 'Stove + oven', cat: 'Kitchen', size: [1, 1], wall: true, build: G((g, t) => {
    box(g, 0.85, 0.85, 0.7, '#f1f3f5'); box(g, 0.6, 0.35, 0.02, '#343a40', 0, 0.2, 0.36); box(g, 0.5, 0.04, 0.04, '#adb5bd', 0, 0.62, 0.37);
    for (const [x, z] of [[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]]) cyl(g, 0.12, 0.03, '#222', x, 0.85, z, 12);
    cyl(g, 0.15, 0.18, '#c0392b', 0.2, 0.88, 0.15, 12); // a pot on the stove
  }) },
  { id: 'kitchen_sink', name: 'Kitchen sink', cat: 'Kitchen', size: [1, 1], wall: true, build: G((g, t) => {
    box(g, 0.85, 0.85, 0.7, t.wood); box(g, 0.9, 0.06, 0.75, '#f8f9fa', 0, 0.85); box(g, 0.55, 0.04, 0.4, '#8ecae6', 0, 0.88);
    box(g, 0.06, 0.35, 0.06, '#adb5bd', 0, 0.9, -0.28); box(g, 0.06, 0.06, 0.25, '#adb5bd', 0, 1.2, -0.17);
  }) },
  { id: 'pantry', name: 'Pantry cupboard', cat: 'Kitchen', size: [1, 1], wall: true, build: G((g, t) => {
    box(g, 0.85, 1.9, 0.5, t.wood); box(g, 0.02, 1.8, 0.02, '#3d2b1f', 0, 0.05, 0.26); box(g, 0.04, 0.2, 0.04, '#e9c46a', -0.08, 0.95, 0.27); box(g, 0.04, 0.2, 0.04, '#e9c46a', 0.08, 0.95, 0.27);
  }) },
  { id: 'kitchen_island', name: 'Kitchen island', cat: 'Kitchen', size: [2, 1], build: G((g, t) => {
    box(g, 1.8, 0.85, 0.8, t.accent); box(g, 1.9, 0.07, 0.9, '#f8f9fa', 0, 0.85);
    ball(g, 0.1, '#ff6b35', -0.5, 1.0, 0); ball(g, 0.09, '#9ccc65', -0.35, 0.99, 0.1); ball(g, 0.1, '#ffd23f', -0.42, 1.0, -0.12); // fruit
    cyl(g, 0.12, 0.04, '#ffffff', 0.4, 0.92, 0, 12); // a plate
  }) },
  { id: 'coffee_machine', name: 'Coffee corner', cat: 'Kitchen', size: [1, 1], wall: true, build: G((g, t) => {
    legs(g, 0.6, 0.5, 0.8, t.wood); box(g, 0.7, 0.06, 0.55, t.wood, 0, 0.8);
    box(g, 0.35, 0.45, 0.3, '#2b2d42', 0, 0.86); box(g, 0.25, 0.08, 0.1, '#8d99ae', 0, 1.05, 0.15); cyl(g, 0.06, 0.1, '#ffffff', 0, 0.9, 0.12, 10);
  }) },

  // ---------------- Bathroom ----------------
  { id: 'bathtub', name: 'Bathtub', cat: 'Bathroom', size: [2, 1], wall: true, build: G((g, t) => { box(g, 1.8, 0.6, 0.85, '#ffffff'); box(g, 1.6, 0.05, 0.65, '#8ecae6', 0, 0.5); ball(g, 0.1, '#ffd23f', 0.3, 0.6, 0); }) },
  { id: 'shower', name: 'Shower', cat: 'Bathroom', size: [1, 1], wall: true, build: G((g, t) => {
    box(g, 0.9, 0.1, 0.9, '#e9ecef'); box(g, 0.9, 2.0, 0.05, '#dee2e6', 0, 0, -0.42);
    box(g, 0.04, 2.0, 0.9, '#bde0fe', -0.43, 0, 0, { transparent: true, opacity: 0.4 }); box(g, 0.04, 2.0, 0.9, '#bde0fe', 0.43, 0, 0, { transparent: true, opacity: 0.4 });
    box(g, 0.04, 0.04, 0.3, '#adb5bd', 0, 1.8, -0.27); cyl(g, 0.1, 0.03, '#adb5bd', 0, 1.77, -0.12, 10);
  }) },
  { id: 'toilet', name: 'Toilet', cat: 'Bathroom', size: [1, 1], wall: true, build: G((g, t) => {
    box(g, 0.5, 0.5, 0.2, '#ffffff', 0, 0.3, -0.25); cyl(g, 0.2, 0.4, '#ffffff', 0, 0, 0.05, 12, 0.24); cyl(g, 0.25, 0.04, '#f1f3f5', 0, 0.4, 0.05, 12);
  }) },
  { id: 'bath_sink', name: 'Sink + mirror', cat: 'Bathroom', size: [1, 1], wall: true, build: G((g, t) => {
    box(g, 0.8, 0.8, 0.5, t.wood); box(g, 0.85, 0.06, 0.55, '#ffffff', 0, 0.8); box(g, 0.45, 0.04, 0.3, '#8ecae6', 0, 0.83);
    box(g, 0.7, 0.7, 0.04, '#c9d6df', 0, 1.15, -0.24, { metalness: 0.4, roughness: 0.2 }); box(g, 0.78, 0.78, 0.03, '#ffffff', 0, 1.11, -0.26);
  }) },
  { id: 'towel_rack', name: 'Towel rack', cat: 'Bathroom', size: [1, 1], build: G((g, t) => {
    box(g, 0.05, 1.2, 0.05, '#adb5bd', -0.3); box(g, 0.05, 1.2, 0.05, '#adb5bd', 0.3); box(g, 0.65, 0.04, 0.04, '#adb5bd', 0, 1.15);
    box(g, 0.25, 0.6, 0.06, t.accent, -0.13, 0.58); box(g, 0.25, 0.5, 0.06, '#f4efe6', 0.14, 0.68);
  }) },
  { id: 'bath_mat', name: 'Bath mat', cat: 'Bathroom', size: [1, 1], floorOnly: true, build: G((g, t) => { box(g, 0.85, 0.03, 0.6, '#a8dadc'); box(g, 0.7, 0.035, 0.45, '#f1faee'); }) },

  // ---------------- Bedroom ----------------
  { id: 'bed', name: 'Bed', cat: 'Bedroom', size: [2, 2], wall: true, build: G((g, t) => {
    box(g, 1.5, 0.35, 1.9, t.wood); box(g, 1.4, 0.2, 1.75, '#ffffff', 0, 0.35); box(g, 1.42, 0.12, 1.1, t.accent, 0, 0.5, 0.3); box(g, 1.5, 0.8, 0.12, t.wood, 0, 0.35, -0.9);
    box(g, 0.5, 0.12, 0.3, '#f4efe6', -0.35, 0.55, -0.6); box(g, 0.5, 0.12, 0.3, '#f4efe6', 0.35, 0.55, -0.6);
  }) },
  { id: 'bunk_bed', name: 'Bunk bed', cat: 'Bedroom', size: [1, 2], wall: true, build: G((g, t) => {
    for (const sx of [-0.42, 0.42]) for (const sz of [-0.9, 0.9]) box(g, 0.08, 1.9, 0.08, t.wood, sx, 0, sz);
    for (const y of [0.3, 1.2]) { box(g, 0.9, 0.12, 1.85, t.wood, 0, y); box(g, 0.82, 0.12, 1.75, '#ffffff', 0, y + 0.12); box(g, 0.84, 0.08, 1.0, y > 1 ? '#4dabf7' : t.accent, 0, y + 0.24, 0.35); }
    for (let i = 0; i < 4; i++) box(g, 0.04, 0.04, 0.3, t.wood, 0.46, 0.45 + i * 0.25, 0.75); // ladder steps
  }) },
  { id: 'nightstand', name: 'Nightstand', cat: 'Bedroom', size: [1, 1], build: G((g, t) => {
    box(g, 0.5, 0.5, 0.45, t.wood); box(g, 0.1, 0.04, 0.03, '#e9c46a', 0, 0.32, 0.23);
    cyl(g, 0.07, 0.15, '#666', 0, 0.5); cyl(g, 0.15, 0.18, '#fff1c1', 0, 0.65, 0, 10, 0.1).material = mat('#fff1c1', { emissive: '#ffcc66' });
  }) },
  { id: 'closet', name: 'Clothes closet', cat: 'Bedroom', size: [2, 1], wall: true, build: G((g, t) => {
    box(g, 1.6, 2.0, 0.6, t.wood); box(g, 0.02, 1.9, 0.02, '#3d2b1f', 0, 0.05, 0.31);
    box(g, 0.04, 0.25, 0.04, '#e9c46a', -0.1, 1.0, 0.32); box(g, 0.04, 0.25, 0.04, '#e9c46a', 0.1, 1.0, 0.32);
  }) },
  { id: 'dresser', name: 'Dresser + mirror', cat: 'Bedroom', size: [1, 1], wall: true, build: G((g, t) => {
    box(g, 0.9, 0.8, 0.45, t.wood); for (let i = 0; i < 3; i++) box(g, 0.8, 0.02, 0.02, '#3d2b1f', 0, 0.25 + i * 0.25, 0.23);
    box(g, 0.6, 0.75, 0.04, '#c9d6df', 0, 0.85, -0.18, { metalness: 0.4, roughness: 0.2 }); ball(g, 0.05, t.accent, 0.3, 0.85, 0.05);
  }) },
  { id: 'teddy', name: 'Giant teddy bear', cat: 'Bedroom', size: [1, 1], build: G((g, t) => {
    const fur = '#b07d52'; const b = ball(g, 0.3, fur, 0, 0.3); b.scale.set(1, 1.1, 0.9); ball(g, 0.2, fur, 0, 0.75);
    ball(g, 0.07, fur, -0.15, 0.92); ball(g, 0.07, fur, 0.15, 0.92); ball(g, 0.06, '#f4d6b0', 0, 0.72, 0.17); ball(g, 0.08, t.accent, 0, 0.55, 0.15);
  }) },

  // ---------------- Garden ----------------
  { id: 'bush', name: 'Round bush', cat: 'Garden', size: [1, 1], build: G((g, t) => { ball(g, 0.38, '#4f9d69', 0, 0.35); ball(g, 0.25, '#62b37a', 0.2, 0.55, 0.1); ball(g, 0.22, '#3d8b5a', -0.2, 0.5, -0.05); }) },
  { id: 'flower_bed', name: 'Flower bed', cat: 'Garden', size: [2, 1], build: G((g, t) => {
    box(g, 1.8, 0.25, 0.7, '#8d6e63'); box(g, 1.7, 0.05, 0.6, '#5d4037', 0, 0.25);
    const cols = ['#ff4d6d', '#ffd23f', '#c77dff', '#ff8fab', '#ffffff', '#ff9f1c'];
    for (let i = 0; i < 12; i++) { const x = -0.7 + (i % 6) * 0.28, z = i < 6 ? -0.15 : 0.15; cyl(g, 0.015, 0.25, '#4f9d69', x, 0.28, z, 5); ball(g, 0.07, cols[i % 6], x, 0.56, z); }
  }) },
  { id: 'fountain', name: 'Wishing fountain', cat: 'Garden', size: [2, 2], activity: 'wishlist', build: G((g, t) => {
    cyl(g, 0.9, 0.35, '#bfc5cc', 0, 0, 0, 16); cyl(g, 0.78, 0.05, '#4dabf7', 0, 0.32, 0, 16);
    cyl(g, 0.12, 0.7, '#bfc5cc', 0, 0.35, 0, 10); cyl(g, 0.35, 0.12, '#bfc5cc', 0, 1.0, 0, 12); ball(g, 0.15, '#8ecae6', 0, 1.2, 0, { emissive: '#2a6f9a' });
  }) },
  { id: 'bbq', name: 'Barbecue', cat: 'Garden', size: [1, 1], build: G((g, t) => {
    for (const a of [0, 2.1, 4.2]) box(g, 0.05, 0.6, 0.05, '#333', Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22);
    const k = ball(g, 0.35, '#222', 0, 0.75); k.scale.set(1, 0.6, 1); box(g, 0.6, 0.03, 0.6, '#888', 0, 0.85);
    for (const x of [-0.15, 0.1]) box(g, 0.18, 0.06, 0.08, '#a0522d', x, 0.88, 0.05); ball(g, 0.06, '#ff5500', 0, 0.82, -0.15, { emissive: '#ff3300' });
  }) },
  { id: 'picnic_table', name: 'Picnic table', cat: 'Garden', size: [2, 2], build: G((g, t) => {
    legs(g, 1.6, 0.6, 0.7, t.wood); box(g, 1.8, 0.07, 0.8, t.wood, 0, 0.7);
    box(g, 1.8, 0.06, 0.3, t.wood, 0, 0.4, -0.75); box(g, 1.8, 0.06, 0.3, t.wood, 0, 0.4, 0.75);
    for (const z of [-0.75, 0.75]) { box(g, 0.06, 0.4, 0.06, t.wood, -0.75, 0, z); box(g, 0.06, 0.4, 0.06, t.wood, 0.75, 0, z); }
    box(g, 0.8, 0.01, 0.8, '#e63946', 0, 0.77); ball(g, 0.1, '#ff6b35', 0.2, 0.85, 0.1); // checked cloth + fruit
  }) },
  { id: 'garden_lamp', name: 'Garden lantern', cat: 'Garden', size: [1, 1], build: G((g, t) => {
    cyl(g, 0.15, 0.08, '#2b2d42'); cyl(g, 0.03, 1.2, '#2b2d42', 0, 0.08); box(g, 0.25, 0.3, 0.25, '#fff1c1', 0, 1.25, 0, { emissive: '#ffb703' }); cyl(g, 0.2, 0.1, '#2b2d42', 0, 1.55, 0, 4, 0.02);
  }) },
  { id: 'fence', name: 'Wooden fence', cat: 'Garden', size: [2, 1], wall: true, build: G((g, t) => {
    for (let i = 0; i < 6; i++) box(g, 0.14, 0.8, 0.06, '#f4efe6', -0.8 + i * 0.32, 0, -0.35);
    box(g, 1.9, 0.08, 0.04, '#f4efe6', 0, 0.25, -0.31); box(g, 1.9, 0.08, 0.04, '#f4efe6', 0, 0.6, -0.31);
  }) },

  // ---------------- Party ----------------
  { id: 'dj_booth', name: 'DJ booth', cat: 'Party', size: [2, 1], wall: true, activity: 'portal', build: G((g, t) => {
    box(g, 1.8, 0.9, 0.6, '#1b1b2f'); box(g, 1.7, 0.05, 0.02, '#ff4fd8', 0, 0.6, 0.31, { emissive: '#a0278a' });
    for (const x of [-0.45, 0.45]) { cyl(g, 0.22, 0.04, '#333', x, 0.9, 0, 16); cyl(g, 0.05, 0.05, '#ff4fd8', x, 0.94, 0, 8); }
    box(g, 0.3, 0.05, 0.3, '#444', 0, 0.9);
  }) },
  { id: 'speaker', name: 'Big speaker', cat: 'Party', size: [1, 1], build: G((g, t) => {
    box(g, 0.6, 1.2, 0.5, '#222'); cyl(g, 0.22, 0.04, '#555', 0, 0.35, 0.26, 14).rotation.x = Math.PI / 2; cyl(g, 0.12, 0.04, '#555', 0, 0.9, 0.26, 14).rotation.x = Math.PI / 2;
  }) },
  { id: 'disco_ball', name: 'Disco ball', cat: 'Party', size: [1, 1], build: G((g, t) => {
    cyl(g, 0.2, 0.05, '#333'); cyl(g, 0.02, 1.5, '#888', 0, 0.05); ball(g, 0.3, '#dfe7fd', 0, 1.85, 0, { metalness: 0.9, roughness: 0.15, emissive: '#7a54ff', emissiveIntensity: 0.25 });
  }) },
  { id: 'party_table', name: 'Cake + snacks table', cat: 'Party', size: [2, 1], build: G((g, t) => {
    legs(g, 1.6, 0.6, 0.7, t.wood); box(g, 1.8, 0.07, 0.8, '#ffffff', 0, 0.7);
    cyl(g, 0.22, 0.2, '#ffc8dd', -0.4, 0.77, 0, 14); cyl(g, 0.16, 0.14, '#ff8fab', -0.4, 0.97, 0, 14);
    for (const x of [-0.45, -0.35]) { cyl(g, 0.015, 0.1, '#fff8e7', x, 1.11); ball(g, 0.025, '#ffb703', x, 1.23, 0, { emissive: '#ff8800' }); }
    cyl(g, 0.15, 0.05, '#e9c46a', 0.3, 0.77, 0, 12); for (let i = 0; i < 3; i++) cyl(g, 0.05, 0.15, ['#ff4d6d', '#4dabf7', '#9ccc65'][i], 0.55 + (i % 2) * 0.1, 0.77, -0.15 + i * 0.15, 8);
  }) },
  { id: 'balloon_arch', name: 'Balloon arch', cat: 'Party', size: [2, 1], wall: true, build: G((g, t) => {
    const cols = ['#ff4d6d', '#ffd23f', '#4dabf7', '#c77dff', '#9ccc65'];
    for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; ball(g, 0.16, cols[i % 5], Math.cos(a) * 0.85, 0.15 + Math.sin(a) * 1.6, 0); }
  }) },
  { id: 'gift_pile', name: 'Pile of presents', cat: 'Party', size: [1, 1], activity: 'wishlist', build: G((g, t) => {
    for (const [x, z, s, c] of [[-0.15, -0.1, 0.35, '#4dabf7'], [0.18, 0.05, 0.3, '#9ccc65'], [-0.05, 0.2, 0.25, '#c77dff']]) { box(g, s, s, s, c, x, 0, z); box(g, 0.05, s + 0.01, s + 0.01, '#ffd23f', x, 0, z); }
    box(g, 0.22, 0.22, 0.22, '#ff6b9a', -0.12, 0.35, -0.1);
  }) },

  // ---------------- extra seats (Seating = you can sit on it) ----------------
  { id: 'deck_chair', name: 'Deck chair', cat: 'Seating', size: [1, 1], build: G((g, t) => {
    legs(g, 0.55, 0.8, 0.42, t.wood); box(g, 0.6, 0.06, 0.85, t.accent, 0, 0.42); box(g, 0.6, 0.6, 0.06, t.accent, 0, 0.45, -0.38).rotation.x = -0.35;
  }) },
  { id: 'loveseat', name: 'Loveseat', cat: 'Seating', size: [2, 1], wall: true, build: G((g, t) => {
    box(g, 1.7, 0.35, 0.8, '#ff8fab', 0, 0.1); box(g, 1.7, 0.55, 0.2, '#ff8fab', 0, 0.35, -0.3);
    box(g, 0.18, 0.3, 0.8, '#ff8fab', -0.76, 0.35); box(g, 0.18, 0.3, 0.8, '#ff8fab', 0.76, 0.35);
    const h1 = ball(g, 0.13, '#ff4d6d', -0.12, 0.88, -0.3); h1.scale.set(1, 1, 0.4); const h2 = ball(g, 0.13, '#ff4d6d', 0.12, 0.88, -0.3); h2.scale.set(1, 1, 0.4);
  }) },
];

export const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((c) => [c.id, c]));
export const CATEGORIES = [...new Set(CATALOG.map((c) => c.cat))];
