// MORE FURNITURE (owned by Building): the second wave of the catalogue. Same rules as catalog.js.
// Seats (cat 'Seating') can be sat on; seatTop is the cushion height in world units.
// Items with `wall: true` like to stand against a wall. `floorOnly` things can be walked on.

import { box, cyl, ball, legs, board, G } from './shapes.js';

const GLASS = { transparent: true, opacity: 0.35 };
const glow = (c) => ({ emissive: c });

export const MORE = [
  // ---------------- Living ----------------
  { id: 'side_table', name: 'Side table', cat: 'Tables', size: [1, 1], build: G((g, t) => { cyl(g, 0.04, 0.5, t.wood); cyl(g, 0.25, 0.05, t.wood, 0, 0.5, 0, 14); cyl(g, 0.14, 0.03, t.wood, 0, 0.02, 0, 10); }) },
  { id: 'ottoman', name: 'Ottoman', cat: 'Seating', size: [1, 1], seatTop: 0.46, build: G((g, t) => { box(g, 0.72, 0.38, 0.72, t.accent, 0, 0.06); box(g, 0.68, 0.06, 0.68, '#f4efe6', 0, 0.44); }) },
  { id: 'floor_cushion', name: 'Floor cushion', cat: 'Seating', size: [1, 1], seatTop: 0.18, build: G((g, t) => { box(g, 0.7, 0.16, 0.7, t.accent, 0, 0.02); box(g, 0.5, 0.05, 0.5, '#f4efe6', 0, 0.17); }) },

  // ---------------- Bedroom ----------------
  { id: 'single_bed', name: 'Single bed', cat: 'Home', size: [1, 2], wall: true, build: G((g, t) => {
    box(g, 0.95, 0.3, 1.95, t.wood); box(g, 0.88, 0.16, 1.8, '#ffffff', 0, 0.3); box(g, 0.9, 0.1, 1.05, t.accent, 0, 0.44, 0.35);
    box(g, 0.5, 0.1, 0.3, '#f4efe6', 0, 0.46, -0.7); box(g, 0.98, 0.75, 0.1, t.wood, 0, 0.3, -0.95);
  }) },
  { id: 'nightstand', name: 'Nightstand', cat: 'Home', size: [1, 1], build: G((g, t) => { box(g, 0.5, 0.55, 0.45, t.wood); box(g, 0.4, 0.04, 0.02, '#333', 0, 0.38, 0.23); ball(g, 0.03, '#ffd23f', 0, 0.3, 0.24); }) },
  { id: 'wardrobe', name: 'Wardrobe', cat: 'Home', size: [2, 1], wall: true, build: G((g, t) => {
    box(g, 1.8, 1.9, 0.6, t.wood); box(g, 0.03, 1.6, 0.02, '#333', 0, 0.15, 0.31); ball(g, 0.04, '#ffd23f', -0.1, 1.0, 0.33); ball(g, 0.04, '#ffd23f', 0.1, 1.0, 0.33);
  }) },
  { id: 'dresser', name: 'Dresser', cat: 'Home', size: [2, 1], wall: true, build: G((g, t) => {
    box(g, 1.7, 0.9, 0.55, t.wood); for (const y of [0.25, 0.5, 0.72]) box(g, 1.55, 0.03, 0.02, '#333', 0, y, 0.28); ball(g, 0.04, '#ffd23f', 0, 0.62, 0.29);
  }) },
  { id: 'vanity', name: 'Vanity + mirror', cat: 'Home', size: [1, 1], wall: true, build: G((g, t) => {
    legs(g, 0.9, 0.45, 0.7, t.wood); box(g, 0.95, 0.06, 0.5, t.wood, 0, 0.7); box(g, 0.62, 0.75, 0.04, t.wood, 0, 0.76, -0.2); box(g, 0.54, 0.67, 0.03, '#bde0fe', 0, 0.8, -0.17);
  }) },

  // ---------------- Kitchen & dining ----------------
  { id: 'stove', name: 'Stove', cat: 'Home', size: [1, 1], wall: true, build: G((g, t) => {
    box(g, 0.8, 0.85, 0.7, '#dee2e6'); box(g, 0.8, 0.04, 0.7, '#2b2b2b', 0, 0.85); box(g, 0.6, 0.4, 0.02, '#343a40', 0, 0.2, 0.36);
    for (const [x, z] of [[-0.18, -0.15], [0.18, -0.15], [-0.18, 0.15], [0.18, 0.15]]) cyl(g, 0.1, 0.02, '#555', x, 0.89, z, 12);
  }) },
  { id: 'kitchen_island', name: 'Kitchen island', cat: 'Tables', size: [2, 1], build: G((g, t) => {
    box(g, 1.8, 0.85, 0.8, t.wood); box(g, 1.9, 0.06, 0.9, '#f8f9fa', 0, 0.85); cyl(g, 0.16, 0.08, '#fff', 0.4, 0.91, 0, 12, 0.2); ball(g, 0.06, '#ef476f', 0.38, 1.0, 0); ball(g, 0.06, '#ffd166', 0.44, 1.0, 0.04);
  }) },
  { id: 'sink_counter', name: 'Sink counter', cat: 'Home', size: [2, 1], wall: true, build: G((g, t) => {
    box(g, 1.9, 0.85, 0.7, t.wood); box(g, 1.95, 0.06, 0.75, '#f8f9fa', 0, 0.85); box(g, 0.55, 0.05, 0.4, '#adb5bd', -0.3, 0.9); cyl(g, 0.025, 0.25, '#adb5bd', -0.3, 0.9, -0.25); box(g, 0.2, 0.03, 0.03, '#adb5bd', -0.3, 1.12, -0.17);
  }) },
  { id: 'bar_stool', name: 'Bar stool', cat: 'Seating', size: [1, 1], seatTop: 0.66, build: G((g, t) => { cyl(g, 0.04, 0.62, '#444', 0, 0.02); cyl(g, 0.18, 0.03, '#444'); cyl(g, 0.2, 0.07, t.accent, 0, 0.62, 0, 14); }) },

  // ---------------- Bathroom ----------------
  { id: 'toilet', name: 'Toilet', cat: 'Home', size: [1, 1], wall: true, build: G((g, t) => { box(g, 0.4, 0.36, 0.5, '#ffffff', 0, 0, 0.05); box(g, 0.42, 0.04, 0.45, '#f1f3f5', 0, 0.38, 0.05); box(g, 0.4, 0.5, 0.16, '#ffffff', 0, 0.3, -0.27); box(g, 0.08, 0.04, 0.05, '#adb5bd', 0, 0.8, -0.27); }) },
  { id: 'sink', name: 'Sink', cat: 'Home', size: [1, 1], wall: true, build: G((g, t) => { cyl(g, 0.1, 0.7, '#ffffff', 0, 0, -0.05); box(g, 0.55, 0.14, 0.4, '#ffffff', 0, 0.7, -0.02); cyl(g, 0.025, 0.2, '#adb5bd', 0, 0.84, -0.18); box(g, 0.5, 0.35, 0.03, '#bde0fe', 0, 0.95, -0.27); }) },
  { id: 'shower', name: 'Shower', cat: 'Home', size: [1, 1], wall: true, build: G((g, t) => {
    box(g, 0.92, 0.06, 0.92, '#e9ecef'); box(g, 0.92, 1.9, 0.03, '#a8dadc', 0, 0.06, 0.45, GLASS); box(g, 0.03, 1.9, 0.92, '#a8dadc', 0.45, 0.06, 0, GLASS);
    cyl(g, 0.02, 1.7, '#adb5bd', -0.36, 0.06, -0.36); cyl(g, 0.1, 0.03, '#adb5bd', -0.3, 1.75, -0.3, 12);
  }) },
  { id: 'bathmat', name: 'Bath mat', cat: 'Decor', size: [1, 1], floorOnly: true, build: G((g, t) => { box(g, 0.8, 0.03, 0.55, t.accent); box(g, 0.7, 0.035, 0.45, '#ffffff', 0, 0, 0); }) },
  { id: 'towel_rack', name: 'Towel rack', cat: 'Home', size: [1, 1], wall: true, build: G((g, t) => {
    box(g, 0.05, 1.2, 0.05, '#adb5bd', -0.3); box(g, 0.05, 1.2, 0.05, '#adb5bd', 0.3); box(g, 0.65, 0.04, 0.05, '#adb5bd', 0, 1.1); box(g, 0.25, 0.5, 0.04, '#ffffff', -0.1, 0.62, 0.02); box(g, 0.2, 0.4, 0.04, t.accent, 0.15, 0.72, 0.02);
  }) },
  { id: 'laundry_basket', name: 'Laundry basket', cat: 'Home', size: [1, 1], build: G((g, t) => { cyl(g, 0.22, 0.45, '#d4a373', 0, 0, 0, 12, 0.28); cyl(g, 0.24, 0.03, '#bc8a5f', 0, 0.45, 0, 12); box(g, 0.25, 0.08, 0.2, '#ffffff', 0, 0.5, 0); }) },

  // ---------------- Games & fun ----------------
  { id: 'foosball', name: 'Foosball table', cat: 'Games', size: [2, 1], build: G((g, t) => {
    legs(g, 1.3, 0.6, 0.55, '#333'); box(g, 1.4, 0.25, 0.75, t.wood, 0, 0.55); box(g, 1.2, 0.03, 0.6, '#2d6a4f', 0, 0.8);
    for (const x of [-0.4, 0, 0.4]) { box(g, 0.04, 0.04, 0.95, '#adb5bd', x, 0.95); ball(g, 0.04, t.accent, x, 0.97, 0.45); }
  }) },
  { id: 'dartboard', name: 'Dartboard', cat: 'Games', size: [1, 1], wall: true, build: G((g, t) => {
    box(g, 0.06, 1.3, 0.06, '#555', 0, 0, -0.1); const r1 = cyl(g, 0.34, 0.06, '#222', 0, 1.0, -0.06, 20); r1.rotation.x = Math.PI / 2;
    const r2 = cyl(g, 0.26, 0.07, '#f4efe6', 0, 1.0, -0.06, 20); r2.rotation.x = Math.PI / 2; const r3 = cyl(g, 0.16, 0.08, '#e63946', 0, 1.0, -0.06, 20); r3.rotation.x = Math.PI / 2;
    const r4 = cyl(g, 0.06, 0.09, '#2a9d8f', 0, 1.0, -0.06, 20); r4.rotation.x = Math.PI / 2;
  }) },
  { id: 'pinball', name: 'Pinball machine', cat: 'Games', size: [1, 1], wall: true, activity: 'games', build: G((g, t) => {
    legs(g, 0.7, 0.9, 0.7, '#333'); box(g, 0.78, 0.2, 1.0, t.accent, 0, 0.7); box(g, 0.7, 0.04, 0.9, '#1d1d3a', 0, 0.9); box(g, 0.78, 0.5, 0.12, '#ffd23f', 0, 0.9, -0.45, glow('#664400'));
    ball(g, 0.05, '#ffffff', 0.1, 0.96, 0.2); ball(g, 0.08, '#ff4d6d', -0.15, 0.97, -0.1, glow('#400010'));
  }) },
  { id: 'board_games', name: 'Board game shelf', cat: 'Games', size: [1, 1], wall: true, activity: 'games', build: G((g, t) => {
    box(g, 0.9, 1.15, 0.38, t.wood); for (const [y, cols] of [[0.1, ['#ef476f', '#ffd166', '#06d6a0']], [0.5, ['#118ab2', '#8338ec', '#ff9f1c']], [0.9, ['#2ec4b6', '#e63946']]]) cols.forEach((c, i) => box(g, 0.24, 0.3, 0.3, c, -0.28 + i * 0.28, y, 0.04));
  }) },
  { id: 'karaoke', name: 'Karaoke corner', cat: 'Fun', size: [1, 1], wall: true, activity: 'portal', build: G((g, t) => {
    box(g, 0.35, 1.0, 0.35, '#222', -0.3); box(g, 0.35, 1.0, 0.35, '#222', 0.3); cyl(g, 0.12, 0.05, '#555', -0.3, 0.7, 0.18, 12); cyl(g, 0.12, 0.05, '#555', 0.3, 0.7, 0.18, 12);
    box(g, 0.4, 0.25, 0.05, '#1d1d3a', 0, 0.8, -0.1, glow('#6c63ff')); cyl(g, 0.02, 0.35, '#adb5bd', 0, 0.05, 0.2); ball(g, 0.06, '#ff4d6d', 0, 0.42, 0.2);
  }) },

  // ---------------- Memories & boards ----------------
  { id: 'trip_board', name: 'Trip board', cat: 'Boards', size: [1, 1], wall: true, activity: 'trip', build: G((g, t) => {
    board(g, 1.0, 0.9, t.wood, '#bde0fe', 1.1); box(g, 0.5, 0.3, 0.02, '#8ecae6', -0.1, 0.85, 0.07); box(g, 0.3, 0.25, 0.02, '#a7c957', 0.2, 0.7, 0.07);
    for (const [x, y, c] of [[-0.25, 0.95, '#ef476f'], [0.2, 0.85, '#ffd166'], [0.05, 0.7, '#06d6a0']]) ball(g, 0.05, c, x, y + 0.1, 0.1); box(g, 0.34, 0.03, 0.02, '#fff', 0.05, 1.12, 0.07);
  }) },
  { id: 'sticker_wall', name: 'Sticker wall', cat: 'Boards', size: [1, 1], wall: true, activity: 'notes', build: G((g, t) => {
    board(g, 1.0, 0.9, t.wood, '#fff8e7', 1.1); for (const [x, y, c] of [[-0.25, 1.0, '#ff4d6d'], [0.05, 1.1, '#ffd166'], [0.25, 0.95, '#06d6a0'], [-0.1, 0.85, '#118ab2'], [0.22, 0.75, '#8338ec'], [-0.3, 0.75, '#ff9f1c']]) box(g, 0.18, 0.18, 0.02, c, x, y, 0.08);
  }) },
  { id: 'polaroid_wall', name: 'Polaroid wall', cat: 'Boards', size: [1, 1], wall: true, activity: 'gallery', build: G((g, t) => {
    board(g, 1.0, 0.9, t.wood, '#f1e4d3', 1.1); for (const [x, y, c] of [[-0.25, 1.05, '#a8dadc'], [0.1, 1.1, '#f4a261'], [0.28, 0.9, '#e9c46a'], [-0.12, 0.82, '#90be6d']]) { box(g, 0.24, 0.28, 0.02, '#ffffff', x, y, 0.08); box(g, 0.18, 0.18, 0.025, c, x, y + 0.07, 0.085); }
  }) },

  // ---------------- Lighting ----------------
  { id: 'table_lamp', name: 'Table lamp', cat: 'Decor', size: [1, 1], light: true, build: G((g, t) => { cyl(g, 0.12, 0.04, '#444'); cyl(g, 0.025, 0.3, '#444', 0, 0.04); cyl(g, 0.2, 0.22, '#fff1c1', 0, 0.3, 0, 12, 0.12, glow('#7a5b00')); }) },
  { id: 'wall_sconce', name: 'Wall sconce', cat: 'Decor', size: [1, 1], wall: true, light: true, build: G((g, t) => { box(g, 0.12, 0.3, 0.06, '#444', 0, 1.3, -0.4); cyl(g, 0.12, 0.22, '#fff1c1', 0, 1.5, -0.33, 10, 0.07, glow('#7a5b00')); }) },
  { id: 'string_lights', name: 'String lights', cat: 'Decor', size: [2, 1], wall: true, light: true, build: G((g, t) => {
    box(g, 0.04, 1.9, 0.04, '#555', -0.9, 0, -0.35); box(g, 0.04, 1.9, 0.04, '#555', 0.9, 0, -0.35);
    for (let i = 0; i <= 8; i++) { const x = -0.9 + i * 0.225; ball(g, 0.05, i % 2 ? '#ffd166' : '#ff9aa2', x, 1.9 - Math.sin((i / 8) * Math.PI) * 0.3, -0.35, glow('#996600')); }
  }) },
  { id: 'lava_lamp', name: 'Lava lamp', cat: 'Decor', size: [1, 1], light: true, build: G((g, t) => { cyl(g, 0.12, 0.08, '#333'); cyl(g, 0.08, 0.5, '#ff4d6d', 0, 0.08, 0, 10, 0.05, { emissive: '#7a0020', ...GLASS, opacity: 0.8 }); ball(g, 0.06, '#ffb703', 0, 0.3, 0, glow('#885500')); cyl(g, 0.05, 0.05, '#333', 0, 0.58); }) },
  { id: 'neon_sign', name: 'Neon sign', cat: 'Decor', size: [1, 1], wall: true, light: true, build: G((g, t) => {
    box(g, 0.9, 0.5, 0.04, '#17172b', 0, 1.2, -0.4); box(g, 0.6, 0.06, 0.03, '#ff4fd8', 0, 1.45, -0.37, glow('#ff00aa')); box(g, 0.06, 0.3, 0.03, '#4cc9f0', -0.25, 1.3, -0.37, glow('#0088cc')); box(g, 0.4, 0.06, 0.03, '#4cc9f0', 0.05, 1.3, -0.37, glow('#0088cc'));
  }) },

  // ---------------- Plants & decor ----------------
  { id: 'cactus', name: 'Cactus', cat: 'Decor', size: [1, 1], build: G((g, t) => { cyl(g, 0.17, 0.25, '#c96f4a', 0, 0, 0, 8, 0.2); cyl(g, 0.11, 0.55, '#4f9d69', 0, 0.25, 0, 10, 0.1); cyl(g, 0.05, 0.25, '#4f9d69', 0.17, 0.45); ball(g, 0.04, '#ff8fab', 0, 0.82); }) },
  { id: 'flower_vase', name: 'Flower vase', cat: 'Decor', size: [1, 1], build: G((g, t) => { cyl(g, 0.1, 0.3, '#bde0fe', 0, 0, 0, 10, 0.06); for (const [x, y, c] of [[-0.08, 0.5, '#ff4d6d'], [0.08, 0.55, '#ffd166'], [0, 0.62, '#ff8fab']]) { cyl(g, 0.01, y - 0.25, '#4f9d69', x, 0.28); ball(g, 0.07, c, x, y + 0.05, 0); } }) },
  { id: 'fern', name: 'Fern', cat: 'Decor', size: [1, 1], build: G((g, t) => { cyl(g, 0.2, 0.3, '#f1f1f1', 0, 0, 0, 10, 0.24); for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const l = cyl(g, 0.02, 0.7, '#3a7d44', Math.cos(a) * 0.12, 0.3, Math.sin(a) * 0.12, 5, 0.06); l.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); } }) },

  // ---------------- Walls & windows ----------------
  { id: 'painting', name: 'Painting', cat: 'Decor', size: [1, 1], wall: true, build: G((g, t) => { board(g, 0.95, 0.8, t.wood, '#f4e8d0', 1.0); ball(g, 0.12, '#f4a261', 0.1, 1.05, 0.06); box(g, 0.7, 0.2, 0.02, '#2a9d8f', 0, 0.8, 0.06); box(g, 0.7, 0.2, 0.02, '#264653', 0, 0.65, 0.06); }) },
  { id: 'mirror', name: 'Standing mirror', cat: 'Decor', size: [1, 1], wall: true, build: G((g, t) => { box(g, 0.7, 1.6, 0.06, t.wood, 0, 0.1); box(g, 0.58, 1.46, 0.03, '#bde0fe', 0, 0.17, 0.04, { metalness: 0.4 }); box(g, 0.06, 0.15, 0.3, t.wood, -0.25, 0, -0.1); box(g, 0.06, 0.15, 0.3, t.wood, 0.25, 0, -0.1); }) },
  { id: 'window_frame', name: 'Window', cat: 'Decor', size: [1, 1], wall: true, build: G((g, t) => { box(g, 0.9, 1.1, 0.08, '#ffffff', 0, 0.8, -0.4); box(g, 0.74, 0.94, 0.09, '#a8dadc', 0, 0.88, -0.39, glow('#2a5a6a')); box(g, 0.04, 0.94, 0.1, '#ffffff', 0, 0.88, -0.38); box(g, 0.74, 0.04, 0.1, '#ffffff', 0, 1.35, -0.38); }) },
  { id: 'curtains', name: 'Curtains', cat: 'Decor', size: [1, 1], wall: true, build: G((g, t) => { box(g, 1.0, 0.04, 0.04, '#6d4c41', 0, 1.85, -0.38); box(g, 0.32, 1.7, 0.08, t.accent, -0.3, 0.15, -0.38); box(g, 0.32, 1.7, 0.08, t.accent, 0.3, 0.15, -0.38); }) },
  { id: 'wall_shelf', name: 'Wall shelf', cat: 'Decor', size: [1, 1], wall: true, build: G((g, t) => { box(g, 0.9, 0.06, 0.3, t.wood, 0, 1.3, -0.3); box(g, 0.05, 0.15, 0.2, t.wood, -0.35, 1.15, -0.32); box(g, 0.05, 0.15, 0.2, t.wood, 0.35, 1.15, -0.32); box(g, 0.1, 0.28, 0.18, '#ef476f', -0.25, 1.36, -0.3); box(g, 0.1, 0.22, 0.18, '#118ab2', -0.13, 1.36, -0.3); cyl(g, 0.1, 0.18, '#c96f4a', 0.2, 1.36, -0.3, 8, 0.12); ball(g, 0.12, '#4f9d69', 0.2, 1.7, -0.3); }) },

  // ---------------- Kids & pets ----------------
  { id: 'toy_chest', name: 'Toy chest', cat: 'Home', size: [1, 1], build: G((g, t) => { box(g, 0.75, 0.42, 0.45, '#e76f51'); box(g, 0.8, 0.06, 0.5, '#f4a261', 0, 0.42); ball(g, 0.07, '#ffd166', -0.15, 0.55, 0); box(g, 0.1, 0.1, 0.1, '#06d6a0', 0.15, 0.48, 0.05); }) },
  { id: 'play_tent', name: 'Play tent', cat: 'Home', size: [1, 1], build: G((g, t) => { cyl(g, 0.55, 1.0, '#ff9aa2', 0, 0, 0, 4, 0.03).rotation.y = Math.PI / 4; box(g, 0.3, 0.55, 0.02, '#2b2350', 0, 0, 0.4); ball(g, 0.06, '#ffd166', 0, 1.05); }) },
  { id: 'pet_bed', name: 'Pet bed', cat: 'Home', size: [1, 1], build: G((g, t) => { cyl(g, 0.38, 0.14, '#a8dadc', 0, 0, 0, 16); cyl(g, 0.3, 0.12, '#f4efe6', 0, 0.04, 0, 16); }) },
  { id: 'cat_tree', name: 'Cat tree', cat: 'Home', size: [1, 1], build: G((g, t) => { box(g, 0.6, 0.06, 0.6, '#a68a64'); cyl(g, 0.07, 1.3, '#d4a373', 0, 0.06); box(g, 0.5, 0.06, 0.5, '#a68a64', 0, 0.7); box(g, 0.45, 0.4, 0.4, '#e9c46a', 0, 1.0); box(g, 0.55, 0.06, 0.5, '#a68a64', 0, 1.4); }) },
  { id: 'fish_tank', name: 'Fish tank', cat: 'Home', size: [1, 1], wall: true, build: G((g, t) => { box(g, 0.9, 0.5, 0.45, t.wood); box(g, 0.84, 0.55, 0.38, '#8ecae6', 0, 0.5, 0, GLASS); box(g, 0.84, 0.05, 0.38, '#a98467', 0, 0.5); for (const [x, y] of [[-0.2, 0.85], [0.15, 0.95], [0.05, 0.75]]) { const f = ball(g, 0.06, '#ff9f1c', x, y, 0); f.scale.set(1.5, 1, 0.8); } ball(g, 0.1, '#2d6a4f', 0.3, 0.62, 0); }) },

  // ---------------- Outdoor & balcony ----------------
  { id: 'bbq', name: 'Barbecue', cat: 'Home', size: [1, 1], build: G((g, t) => { legs(g, 0.6, 0.5, 0.6, '#333'); cyl(g, 0.3, 0.25, '#222', 0, 0.6, 0, 14, 0.34); const lid = ball(g, 0.3, '#2b2b2b', 0, 0.9, 0); lid.scale.set(1, 0.6, 1); ball(g, 0.04, '#ff8800', 0.1, 0.85, 0.2, glow('#ff5500')); }) },
  { id: 'hammock', name: 'Hammock', cat: 'Home', size: [2, 1], build: G((g, t) => { cyl(g, 0.05, 1.3, '#6d4c41', -0.9); cyl(g, 0.05, 1.3, '#6d4c41', 0.9); const b = box(g, 1.7, 0.06, 0.55, t.accent, 0, 0.62); b.rotation.z = 0.0; box(g, 0.35, 0.12, 0.45, '#f4efe6', -0.55, 0.7); box(g, 1.2, 0.04, 0.5, t.accent, 0, 0.55); }) },
  { id: 'patio_chair', name: 'Patio chair', cat: 'Seating', size: [1, 1], seatTop: 0.5, build: G((g, t) => { legs(g, 0.5, 0.5, 0.42, '#6d4c41'); box(g, 0.55, 0.08, 0.55, '#c49a6c', 0, 0.42); box(g, 0.55, 0.55, 0.08, '#c49a6c', 0, 0.5, -0.24); box(g, 0.45, 0.08, 0.1, t.accent, 0, 0.52, 0.05); }) },
  { id: 'patio_table', name: 'Patio table', cat: 'Tables', size: [1, 1], build: G((g, t) => { cyl(g, 0.04, 0.65, '#6d4c41'); cyl(g, 0.36, 0.05, '#c49a6c', 0, 0.65, 0, 16); cyl(g, 0.22, 0.03, '#6d4c41', 0, 0.02, 0, 10); }) },
  { id: 'fire_pit', name: 'Fire pit', cat: 'Decor', size: [1, 1], light: true, build: G((g, t) => { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ball(g, 0.1, '#6c757d', Math.cos(a) * 0.3, 0.08, Math.sin(a) * 0.3); } cyl(g, 0.01, 0.34, '#ff8800', 0, 0.08, 0, 6, 0.12, glow('#ff5500')); cyl(g, 0.01, 0.22, '#ffd166', 0.05, 0.08, 0.03, 6, 0.08, glow('#ffaa00')); }) },
];
