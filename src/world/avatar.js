// BLOCKY AVATARS (owned by World). Built from boxes so outfits are just colours,
// patterns and accessory meshes. Add new options to OPTIONS and to buildAvatar().

import * as THREE from 'three';

export const OPTIONS = {
  skin: ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e', '#ffd1dc', '#b5e48c'],
  hair: ['none', 'short', 'long', 'bun', 'spiky', 'curly'],
  hairColor: ['#2b1b10', '#5a3825', '#a0522d', '#e6c27a', '#f5f5f5', '#ff6fb5', '#6c63ff', '#2ec4b6'],
  top: ['tee', 'hoodie', 'dress', 'jacket', 'stripes', 'heart'],
  topColor: ['#ff6b6b', '#f4a261', '#ffd166', '#06d6a0', '#118ab2', '#6c63ff', '#ef476f', '#ffffff', '#222222', '#a8dadc'],
  bottom: ['jeans', 'shorts', 'skirt', 'joggers'],
  bottomColor: ['#264653', '#3d5a80', '#6d6875', '#2a2a2a', '#e9c46a', '#f28482', '#84a59d'],
  hat: ['none', 'cap', 'beanie', 'crown', 'bow', 'headphones', 'flower'],
  hatColor: ['#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#6c63ff', '#222222', '#ffffff'],
  glasses: ['none', 'round', 'shades', 'hearts'],
};

export function randomAppearance() {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  return Object.fromEntries(Object.entries(OPTIONS).map(([k, v]) => [k, pick(v)]));
}

const mats = new Map();
const m = (c, o = {}) => { const k = c + JSON.stringify(o); if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, flatShading: true, ...o })); return mats.get(k); };
const B = (parent, w, h, d, c, x, y, z, o) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m(c, o)); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh; };

function patternTexture(kind, base) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 64, 64);
  if (kind === 'stripes') { g.fillStyle = 'rgba(255,255,255,.55)'; for (let y = 0; y < 64; y += 16) g.fillRect(0, y, 64, 7); }
  if (kind === 'heart') { g.fillStyle = '#fff'; g.font = '34px serif'; g.textAlign = 'center'; g.fillText('♥', 32, 44); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildAvatar(a = randomAppearance()) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const legsG = new THREE.Group(); root.add(legsG);
  const S = 0.5; // overall scale
  // legs
  const legH = a.bottom === 'shorts' || a.bottom === 'skirt' ? 0.25 : 0.55;
  const legL = B(legsG, 0.22, 0.6, 0.24, a.skin, -0.13, 0.3, 0); const legR = B(legsG, 0.22, 0.6, 0.24, a.skin, 0.13, 0.3, 0);
  B(legL, 0.24, legH, 0.26, a.bottomColor, 0, 0.3 - legH / 2, 0); B(legR, 0.24, legH, 0.26, a.bottomColor, 0, 0.3 - legH / 2, 0);
  B(legL, 0.24, 0.1, 0.3, '#333', 0, -0.25, 0.03); B(legR, 0.24, 0.1, 0.3, '#333', 0, -0.25, 0.03);
  if (a.bottom === 'skirt') B(body, 0.6, 0.3, 0.38, a.bottomColor, 0, 0.6, 0);
  // torso
  const torsoMat = (a.top === 'stripes' || a.top === 'heart') ? new THREE.MeshStandardMaterial({ map: patternTexture(a.top, a.topColor), roughness: 0.8 }) : m(a.topColor);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.32), torsoMat); torso.position.set(0, 0.9, 0); torso.castShadow = true; body.add(torso);
  if (a.top === 'dress') B(body, 0.65, 0.45, 0.4, a.topColor, 0, 0.55, 0);
  if (a.top === 'hoodie') B(body, 0.45, 0.2, 0.18, a.topColor, 0, 1.17, -0.14);
  if (a.top === 'jacket') { B(body, 0.06, 0.58, 0.02, '#ddd', 0, 0.9, 0.17); B(body, 0.3, 0.6, 0.34, '#333', -0.15, 0.9, 0).material = m('#3a3a3a'); }
  // arms
  const armL = new THREE.Group(); armL.position.set(-0.36, 1.15, 0); body.add(armL);
  const armR = new THREE.Group(); armR.position.set(0.36, 1.15, 0); body.add(armR);
  for (const arm of [armL, armR]) { B(arm, 0.18, 0.3, 0.2, a.topColor, 0, -0.15, 0); B(arm, 0.16, 0.28, 0.18, a.skin, 0, -0.43, 0); }
  // head
  const head = new THREE.Group(); head.position.set(0, 1.45, 0); body.add(head);
  B(head, 0.46, 0.46, 0.44, a.skin, 0, 0, 0);
  B(head, 0.07, 0.09, 0.02, '#222', -0.1, 0.03, 0.23); B(head, 0.07, 0.09, 0.02, '#222', 0.1, 0.03, 0.23);
  B(head, 0.16, 0.04, 0.02, '#a0443a', 0, -0.11, 0.23);
  B(head, 0.08, 0.05, 0.02, '#ff9aa2', -0.17, -0.06, 0.225, { transparent: true, opacity: 0.6 }); B(head, 0.08, 0.05, 0.02, '#ff9aa2', 0.17, -0.06, 0.225, { transparent: true, opacity: 0.6 });
  // hair
  const hc = a.hairColor;
  if (a.hair !== 'none') B(head, 0.5, 0.14, 0.48, hc, 0, 0.26, 0);
  if (a.hair === 'short') B(head, 0.5, 0.2, 0.1, hc, 0, 0.12, -0.2);
  if (a.hair === 'long') { B(head, 0.52, 0.6, 0.12, hc, 0, -0.1, -0.22); B(head, 0.08, 0.45, 0.4, hc, -0.25, -0.02, -0.02); B(head, 0.08, 0.45, 0.4, hc, 0.25, -0.02, -0.02); }
  if (a.hair === 'bun') B(head, 0.22, 0.2, 0.22, hc, 0, 0.42, -0.08);
  if (a.hair === 'spiky') for (let i = -2; i <= 2; i++) B(head, 0.1, 0.18, 0.1, hc, i * 0.1, 0.38, 0).rotation.z = i * 0.25;
  if (a.hair === 'curly') for (let i = 0; i < 7; i++) B(head, 0.16, 0.16, 0.16, hc, Math.cos(i) * 0.2, 0.28 + (i % 2) * 0.05, Math.sin(i) * 0.2);
  // hats
  const tc = a.hatColor;
  if (a.hat === 'cap') { B(head, 0.5, 0.14, 0.48, tc, 0, 0.3, 0); B(head, 0.4, 0.04, 0.2, tc, 0, 0.25, 0.3); }
  if (a.hat === 'beanie') { B(head, 0.52, 0.22, 0.5, tc, 0, 0.3, 0); B(head, 0.1, 0.1, 0.1, '#fff', 0, 0.46, 0); }
  if (a.hat === 'crown') for (let i = -2; i <= 2; i++) B(head, 0.08, 0.16 + (i % 2 ? 0 : 0.06), 0.4, '#ffd23f', i * 0.1, 0.36, 0, { emissive: '#7a5b00' });
  if (a.hat === 'bow') { B(head, 0.14, 0.14, 0.06, tc, -0.1, 0.32, 0.1); B(head, 0.14, 0.14, 0.06, tc, 0.1, 0.32, 0.1); B(head, 0.06, 0.08, 0.08, tc, 0, 0.32, 0.1); }
  if (a.hat === 'headphones') { B(head, 0.56, 0.05, 0.08, tc, 0, 0.3, 0); B(head, 0.08, 0.18, 0.16, tc, -0.27, 0, 0); B(head, 0.08, 0.18, 0.16, tc, 0.27, 0, 0); }
  if (a.hat === 'flower') { for (let i = 0; i < 5; i++) B(head, 0.08, 0.08, 0.04, tc, -0.15 + Math.cos(i * 1.25) * 0.06, 0.25 + Math.sin(i * 1.25) * 0.06, 0.2); B(head, 0.05, 0.05, 0.05, '#ffd23f', -0.15, 0.25, 0.22); }
  // glasses
  if (a.glasses === 'round' || a.glasses === 'shades') { const gc = a.glasses === 'shades' ? '#111' : '#444'; B(head, 0.14, 0.1, 0.03, gc, -0.1, 0.03, 0.235, a.glasses === 'round' ? { transparent: true, opacity: 0.5 } : {}); B(head, 0.14, 0.1, 0.03, gc, 0.1, 0.03, 0.235, a.glasses === 'round' ? { transparent: true, opacity: 0.5 } : {}); B(head, 0.08, 0.02, 0.02, gc, 0, 0.05, 0.24); }
  if (a.glasses === 'hearts') { B(head, 0.13, 0.11, 0.03, '#ff3b6b', -0.1, 0.03, 0.235); B(head, 0.13, 0.11, 0.03, '#ff3b6b', 0.1, 0.03, 0.235); }

  root.scale.setScalar(S * 1.45);
  root.userData = { body, legL, legR, armL, armR, head, phase: 0 };
  return root;
}

/** Sit down / stand up. Sitting: legs point forward from the hips, arms rest a little forward.
 *  The caller lowers the whole avatar onto the seat (see seats.js). */
export function setSitting(av, on) {
  const u = av.userData;
  if (!!u.sitting === !!on) return;
  u.sitting = !!on;
  if (on) {
    u.legL.position.set(-0.13, 0.6, 0.3); u.legR.position.set(0.13, 0.6, 0.3);
    u.legL.rotation.x = -Math.PI / 2; u.legR.rotation.x = -Math.PI / 2;
    u.armL.rotation.x = -0.4; u.armR.rotation.x = -0.4;
  } else {
    u.legL.position.set(-0.13, 0.3, 0); u.legR.position.set(0.13, 0.3, 0);
    u.legL.rotation.x = 0; u.legR.rotation.x = 0; u.armL.rotation.x = 0; u.armR.rotation.x = 0;
  }
}

/** Walk cycle: call every frame with moving=true/false. */
export function animateAvatar(av, dt, moving) {
  const u = av.userData;
  if (u.sitting) { u.phase += dt * 2; u.body.position.y = Math.sin(u.phase) * 0.008; return; } // just a gentle breathing
  u.phase += dt * (moving ? 10 : 2);
  const swing = moving ? Math.sin(u.phase) * 0.6 : 0;
  u.legL.rotation.x = swing; u.legR.rotation.x = -swing;
  u.armL.rotation.x = -swing; u.armR.rotation.x = swing;
  u.body.position.y = moving ? Math.abs(Math.sin(u.phase)) * 0.06 : Math.sin(u.phase) * 0.01;
}

/** Floating name tag. */
export function nameTag(text, color = '#ffffff') {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
  const g = cv.getContext('2d');
  g.font = 'bold 30px system-ui, sans-serif'; const w = Math.min(250, g.measureText(text).width + 30);
  g.fillStyle = 'rgba(20,16,40,.72)'; g.beginPath(); g.roundRect((256 - w) / 2, 8, w, 46, 23); g.fill();
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(1.6, 0.4, 1); sp.position.y = 1.8; sp.renderOrder = 10;
  return sp;
}
