// FURNITURE CATALOG (owned by Building).
// The first 43 items live here; src/build/catalogMore.js and catalogTeam.js (the team's 30 extra pieces) have the rest; src/build/catalogInfo.js gives EVERY item
// its cluster, description and style tags (that is what the catalogue screen shows).
// Item fields:
//   id        unique id, saved in houses (never rename one that is in use)
//   name      shown in the catalogue
//   cat       old palette category (kept for old code and seats: 'Seating' items can be sat on)
//   cluster   catalogue group (see CLUSTERS)      desc / style  text and tags for the catalogue
//   size      [w, d] in floor cells
//   wall      true = prefers to stand against the back wall
//   activity  what opens when someone taps it (see src/activities/registry.js)
//   build(t)  returns a THREE.Group; t = room theme colours { floor, wall, accent, wood }

import { mat, box, cyl, ball, legs, board, G } from './shapes.js';
import { MORE } from './catalogMore.js';
import { TEAM } from './catalogTeam.js';
import { INFO, CLUSTERS } from './catalogInfo.js';

export { mat, CLUSTERS };

const BASE = [
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

  // ---------------- Rooms (kitchen, bath, bedroom) ----------------
  { id: 'bed', name: 'Bed', cat: 'Home', size: [2, 2], wall: true, build: G((g, t) => {
    box(g, 1.5, 0.35, 1.9, t.wood); box(g, 1.4, 0.2, 1.75, '#ffffff', 0, 0.35); box(g, 1.42, 0.12, 1.1, t.accent, 0, 0.5, 0.3); box(g, 1.5, 0.8, 0.12, t.wood, 0, 0.35, -0.9);
    box(g, 0.5, 0.12, 0.3, '#f4efe6', -0.35, 0.55, -0.6); box(g, 0.5, 0.12, 0.3, '#f4efe6', 0.35, 0.55, -0.6);
  }) },
  { id: 'fridge', name: 'Fridge', cat: 'Home', size: [1, 1], wall: true, activity: 'notes', build: G((g, t) => { box(g, 0.8, 1.8, 0.7, '#e9ecef'); box(g, 0.04, 0.4, 0.04, '#999', 0.3, 1.1, 0.36); box(g, 0.04, 0.3, 0.04, '#999', 0.3, 0.5, 0.36); box(g, 0.78, 0.02, 0.02, '#bbb', 0, 1.0, 0.36); }) },
  { id: 'counter', name: 'Kitchen counter', cat: 'Home', size: [2, 1], wall: true, build: G((g, t) => { box(g, 1.9, 0.85, 0.7, t.wood); box(g, 1.95, 0.06, 0.75, '#f8f9fa', 0, 0.85); box(g, 0.5, 0.05, 0.4, '#adb5bd', 0.4, 0.9); }) },
  { id: 'bathtub', name: 'Bathtub', cat: 'Home', size: [2, 1], wall: true, build: G((g, t) => { box(g, 1.8, 0.6, 0.85, '#ffffff'); box(g, 1.6, 0.05, 0.65, '#8ecae6', 0, 0.5); ball(g, 0.1, '#ffd23f', 0.3, 0.6, 0); }) },
  { id: 'piano', name: 'Piano', cat: 'Home', size: [2, 1], wall: true, build: G((g, t) => { box(g, 1.5, 1.1, 0.5, '#1b1b1b'); box(g, 1.4, 0.05, 0.25, '#ffffff', 0, 0.75, 0.3); for (let i = 0; i < 8; i++) box(g, 0.05, 0.03, 0.15, '#111', -0.55 + i * 0.16, 0.79, 0.27); }) },
  { id: 'tree', name: 'Indoor tree', cat: 'Home', size: [1, 1], build: G((g, t) => { cyl(g, 0.25, 0.3, '#8d6e63'); cyl(g, 0.08, 1.0, '#6d4c41', 0, 0.3); ball(g, 0.5, '#3a7d44', 0, 1.6); ball(g, 0.35, '#4caf50', 0.25, 1.9, 0.1); }) },
];

// every item = its model + cluster / description / style from catalogInfo.js
export const CATALOG = [...BASE, ...MORE, ...TEAM].map((c) => ({ ...c, cluster: INFO[c.id]?.[0] || 'decor', desc: INFO[c.id]?.[1] || '', style: INFO[c.id]?.[2] || [] }));
export const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((c) => [c.id, c]));
export const CATEGORIES = [...new Set(CATALOG.map((c) => c.cat))];
