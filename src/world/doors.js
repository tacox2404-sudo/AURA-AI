// DOORS (owned by World): every room gets a real door to each of the other rooms in the house.
// Tap a door (or its doormat) and your avatar walks to it, the door swings open, and you
// arrive in the other room standing next to the door that leads back. Nothing is saved:
// doors are worked out from the list of rooms every time a room is drawn, so they always match.
//
// Where a door goes: on a wall cell that has no furniture in front of it. We try the left wall
// first (you can see it from the starting camera), then the back wall, the right wall and the
// front wall, and keep one free cell between two doors.

import * as THREE from 'three';

const MAX_DOORS = 6;

/** Which wall cells could hold a door, per wall, in order of preference. Each slot: { cell, out } */
function wallSlots(w, d) {
  const mid = (n, prefer) => { // indexes 1..n-2, starting near `prefer` and going outward
    const out = []; const start = Math.max(1, Math.min(n - 2, prefer));
    for (let k = 0; k < n; k++) for (const s of k ? [start - k, start + k] : [start]) if (s >= 1 && s <= n - 2 && !out.includes(s)) out.push(s);
    return out;
  };
  return {
    left: mid(d, Math.round(d * 0.6)).map((z) => ({ cell: { x: 0, z }, out: [-1, 0] })),
    back: mid(w, Math.round(w * 0.25)).map((x) => ({ cell: { x, z: 0 }, out: [0, -1] })),
    right: mid(d, Math.round(d * 0.6)).map((z) => ({ cell: { x: w - 1, z }, out: [1, 0] })),
    front: mid(w, Math.round(w * 0.5)).map((x) => ({ cell: { x, z: d - 1 }, out: [0, 1] })),
  };
}
// Spread the doors over the walls, starting with the two you see from the starting camera.
const WALL_ORDER = ['left', 'back', 'right', 'left', 'back', 'front', 'right', 'front'];

/** A floating sign with the room name. */
function signSprite(text) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
  const g = cv.getContext('2d');
  const label = text.length > 14 ? text.slice(0, 13) + '…' : text;
  g.font = 'bold 28px system-ui, sans-serif';
  const w = Math.min(250, g.measureText('🚪 ' + label).width + 28);
  g.fillStyle = 'rgba(255,250,243,.95)'; g.beginPath(); g.roundRect((256 - w) / 2, 8, w, 46, 14); g.fill();
  g.strokeStyle = 'rgba(80,60,40,.35)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#3b2f2a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🚪 ' + label, 128, 32);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(2.0, 0.5, 1); sp.renderOrder = 9;
  return sp;
}

/**
 * Work out and draw the doors of one room.
 * walk: the walk grid of the room (to skip cells with furniture). house: the whole house (for the other rooms).
 * Returns { group, doors, tapTargets }. Each door: { toRoomId, name, out, cell, spot, ry, pivot, wallPart, open, openTarget }
 */
export function buildDoors(room, house, walk) {
  const [w, d] = room.size;
  const group = new THREE.Group();
  const doors = [];
  const tapTargets = [];
  const others = (house?.rooms || []).filter((r) => r.id !== room.id).slice(0, MAX_DOORS);
  if (!others.length) return { group, doors, tapTargets };

  const used = [];
  const tooClose = (c) => used.some((u) => Math.abs(u.x - c.x) + Math.abs(u.z - c.z) < 2);
  const perWall = wallSlots(w, d);
  for (const k in perWall) perWall[k] = perWall[k].filter((s) => !walk.isBlockedCell(s.cell.x, s.cell.z));
  // the next free slot: try the walls in WALL_ORDER, starting after the last one used
  let turn = 0;
  const nextSlot = () => {
    for (let n = 0; n < WALL_ORDER.length; n++) {
      const wall = WALL_ORDER[(turn + n) % WALL_ORDER.length];
      const slot = perWall[wall].find((s) => !tooClose(s.cell));
      if (slot) { turn = (turn + n + 1) % WALL_ORDER.length; return slot; }
    }
    return null;
  };

  const t = room.theme;
  const wood = new THREE.MeshStandardMaterial({ color: new THREE.Color(t.wood || '#a47148').offsetHSL(0, 0, -0.06), roughness: 0.7, flatShading: true });
  const frameMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(t.wall).offsetHSL(0, 0, -0.25), roughness: 0.8 });
  const knobMat = new THREE.MeshStandardMaterial({ color: '#e9c46a', metalness: 0.6, roughness: 0.3 });
  const matMat = new THREE.MeshStandardMaterial({ color: t.accent || '#e76f51', roughness: 1 });

  for (const other of others) {
    const slot = nextSlot();
    if (!slot) break;
    used.push(slot.cell);
    const [ox, oz] = slot.out;
    const ry = Math.atan2(-ox, -oz); // the door faces into the room
    const c = walk.cellCenter(slot.cell.x, slot.cell.z);
    // the door sits on the inside face of the wall
    const wallX = ox ? ox * w / 2 : c.x, wallZ = oz ? oz * d / 2 : c.z;

    // --- the part that belongs to the wall (hidden with the wall when the camera is on that side)
    const wallPart = new THREE.Group();
    wallPart.position.set(wallX - ox * 0.02, 0, wallZ - oz * 0.02); wallPart.rotation.y = ry;
    const frame = (fw, fh, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.1), frameMat); m.position.set(x, y, 0.03); m.castShadow = true; wallPart.add(m); return m; };
    frame(0.1, 2.1, -0.5, 1.05); frame(0.1, 2.1, 0.5, 1.05); frame(1.1, 0.1, 0, 2.1);
    // the light from the other room, seen when the door opens (its wall colour, glowing)
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.02), new THREE.MeshBasicMaterial({ color: new THREE.Color(other.theme?.wall || '#fff').lerp(new THREE.Color('#fff7e0'), 0.5) }));
    glow.position.set(0, 1.01, 0.005); wallPart.add(glow);
    // the door itself turns around its hinge (pivot) on the left side
    const pivot = new THREE.Group(); pivot.position.set(-0.45, 0, 0.04); wallPart.add(pivot);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.02, 0.06), wood); panel.position.set(0.45, 1.01, 0); panel.castShadow = true; pivot.add(panel);
    for (const [py, ph] of [[1.45, 0.6], [0.6, 0.7]]) { // two raised panels, for a cosy look
      const inset = new THREE.Mesh(new THREE.BoxGeometry(0.6, ph, 0.02), wood); inset.position.set(0.45, py, 0.04); pivot.add(inset);
    }
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), knobMat); knob.position.set(0.8, 1.0, 0.07); pivot.add(knob);
    group.add(wallPart);

    // --- the part that is always visible: a doormat on the floor and a sign with the room name
    const mat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.025, 0.5), matMat);
    mat.position.set(c.x + ox * 0.15, 0.012, c.z + oz * 0.15); mat.rotation.y = ry; mat.receiveShadow = true;
    const sign = signSprite(other.name || 'Room');
    sign.position.set(wallX - ox * 0.35, 2.45, wallZ - oz * 0.35);
    group.add(mat, sign);

    const door = { toRoomId: other.id, name: other.name, out: slot.out, cell: { ...slot.cell }, spot: c, ry, pivot, wallPart, open: 0, openTarget: 0 };
    for (const o of [mat, sign, panel, ...wallPart.children]) o.userData.doorTo = other.id;
    pivot.traverse((o) => { o.userData.doorTo = other.id; });
    tapTargets.push(mat, sign, wallPart);
    doors.push(door);
  }
  return { group, doors, tapTargets };
}

/** Every frame: swing doors open or shut, and hide the ones on hidden walls. camDir points from the room to the camera. */
export function updateDoors(doors, dt, camDir) {
  for (const dr of doors) {
    dr.open += (dr.openTarget - dr.open) * Math.min(1, dt * 8);
    dr.pivot.rotation.y = -dr.open * 1.7;
    dr.wallPart.visible = dr.out[0] * camDir.x + dr.out[1] * camDir.z < 0.05;
  }
}
