// THE TEAM'S EXTRA FURNITURE (written by Activities, merged into Building). Same rules as catalog.js.
// These 30 pieces came in with PR #51 (Kitchen, Bathroom, Bedroom, Garden and Party items). Kept exactly as they were
// built, so houses that already use them do not change. Their catalogue text lives in catalogInfo.js.

import { mat, box, cyl, ball, legs, board, G } from './shapes.js';

export const TEAM = [
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
  { id: 'deck_chair', name: 'Deck chair', cat: 'Seating', size: [1, 1], build: G((g, t) => {
    legs(g, 0.55, 0.8, 0.42, t.wood); box(g, 0.6, 0.06, 0.85, t.accent, 0, 0.42); box(g, 0.6, 0.6, 0.06, t.accent, 0, 0.45, -0.38).rotation.x = -0.35;
  }) },
  { id: 'loveseat', name: 'Loveseat', cat: 'Seating', size: [2, 1], wall: true, build: G((g, t) => {
    box(g, 1.7, 0.35, 0.8, '#ff8fab', 0, 0.1); box(g, 1.7, 0.55, 0.2, '#ff8fab', 0, 0.35, -0.3);
    box(g, 0.18, 0.3, 0.8, '#ff8fab', -0.76, 0.35); box(g, 0.18, 0.3, 0.8, '#ff8fab', 0.76, 0.35);
    const h1 = ball(g, 0.13, '#ff4d6d', -0.12, 0.88, -0.3); h1.scale.set(1, 1, 0.4); const h2 = ball(g, 0.13, '#ff4d6d', 0.12, 0.88, -0.3); h2.scale.set(1, 1, 0.4);
  }) },
];
