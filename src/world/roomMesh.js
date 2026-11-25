// ONE ROOM OF THE BUILDING (owned by World): floor, walls with real openings for doorways,
// a roof slab (only shown when you are on a higher floor), and the furniture.
//
// Walls are kept in a list so the camera can "cut them down" (like a doll's house):
//   - on your floor, walls between you and the camera drop to a low skirting board;
//   - on the floors below you, all outside walls stay up, so the house looks like a building.
// Each wall record: { group, out: [x, z], interior, cutParts, fullParts }.

import * as THREE from 'three';

const WALL_H = 2.6, OPEN_H = 2.15, OPEN_W = 0.96;

/**
 * room: the Room. info: its place in the building (see building.js). layout: the building layout.
 * itemMesh(item, theme) / footprint(item): from the Building area.
 * Returns { group, floorMesh, items: [mesh], walls: [record], roof, grid }.
 */
export function buildRoomMesh(room, info, layout, itemMesh, footprint) {
  const [w, d] = room.size; const t = room.theme;
  const group = new THREE.Group();
  group.position.set(info.ox + w / 2, info.y, info.oz + d / 2);

  // floor: checker tiles
  const cv = document.createElement('canvas'); cv.width = w * 32; cv.height = d * 32;
  const g = cv.getContext('2d');
  const c1 = new THREE.Color(t.floor), c2 = c1.clone().offsetHSL(0, 0, -0.04);
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { g.fillStyle = '#' + ((i + j) % 2 ? c1 : c2).getHexString(); g.fillRect(i * 32, j * 32, 32, 32); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
  const side = new THREE.MeshStandardMaterial({ color: new THREE.Color(t.wall).offsetHSL(0, 0, -0.3) });
  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), [side, side, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), side, side, side]);
  floorMesh.position.y = -0.1; floorMesh.receiveShadow = true; floorMesh.userData.floorOf = room.id;
  group.add(floorMesh);

  // roof slab (a light concrete top), shown when this floor is below you
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.22, d + 0.4), new THREE.MeshStandardMaterial({ color: '#e8e2d8', roughness: 0.95 }));
  roof.position.y = WALL_H + 0.11; roof.receiveShadow = true; roof.visible = false; group.add(roof);

  // ----- walls -----
  const wallMat = new THREE.MeshStandardMaterial({ color: t.wall, roughness: 0.95 });
  const outMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(t.wall).lerp(new THREE.Color('#f3ece2'), 0.55), roughness: 0.95 });
  const trim = new THREE.MeshStandardMaterial({ color: new THREE.Color(t.wall).offsetHSL(0, 0, -0.18) });
  const frameMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(t.wood || '#a47148').offsetHSL(0, 0, -0.05), roughness: 0.7 });
  const walls = [];

  /**
   * A straight wall on one side of the room, from cell `from` to cell `to` along that side,
   * with door openings at the given cell numbers. interior = shared with the neighbour room.
   */
  function addWall(out, from, to, openings, interior, door = null) {
    if (to <= from) return;
    const rec = { group: new THREE.Group(), out, interior, cutParts: [], fullParts: [] };
    const alongX = out[1] !== 0; // back/front walls run along x
    const half = alongX ? w / 2 : d / 2;
    // where the wall stands: outside walls sit just outside the floor, shared walls right on the line
    const offset = interior ? 0 : 0.1;
    const pos = alongX ? new THREE.Vector3(0, 0, out[1] * (d / 2 + offset)) : new THREE.Vector3(out[0] * (w / 2 + offset), 0, 0);
    rec.group.position.copy(pos);
    const piece = (a, b, y0, y1, material, extraThick = 0) => { // a..b along the wall (local units), y0..y1 high
      if (b - a < 0.01) return null;
      const len = b - a, th = 0.2 + extraThick;
      const m = new THREE.Mesh(alongX ? new THREE.BoxGeometry(len, y1 - y0, th) : new THREE.BoxGeometry(th, y1 - y0, len), material);
      const mid = (a + b) / 2;
      m.position.set(alongX ? mid : 0, (y0 + y1) / 2, alongX ? 0 : mid);
      m.castShadow = true; m.receiveShadow = true; rec.group.add(m); return m;
    };
    // the wall pieces between openings (outside walls get a lighter facade colour on the outside face)
    const start = from - half - (alongX && !interior ? 0.2 : 0), end = to - half + (alongX && !interior ? 0.2 : 0);
    const holes = openings.map((c) => c + 0.5 - half).sort((p, q) => p - q);
    let a = start;
    for (const hc of [...holes, null]) {
      const b = hc == null ? end : hc - OPEN_W / 2;
      const m = piece(a, b, 0, WALL_H, wallMat); if (m) rec.fullParts.push(m);
      if (hc != null) {
        const lintel = piece(hc - OPEN_W / 2, hc + OPEN_W / 2, OPEN_H, WALL_H, wallMat); rec.fullParts.push(lintel);
        // a wooden door frame around the opening
        for (const s of [-1, 1]) { const f = piece(hc + s * (OPEN_W / 2 + 0.04) - 0.04, hc + s * (OPEN_W / 2 + 0.04) + 0.04, 0, OPEN_H + 0.06, frameMat, 0.06); rec.fullParts.push(f); }
        const top = piece(hc - OPEN_W / 2 - 0.08, hc + OPEN_W / 2 + 0.08, OPEN_H, OPEN_H + 0.08, frameMat, 0.06); rec.fullParts.push(top);
        a = hc + OPEN_W / 2;
      }
    }
    // skirting board: stays visible when the wall is cut down
    for (const [p, q] of segmentsBetween(start, end, holes)) { const s = piece(p, q, 0, 0.18, trim, 0.04); if (s) rec.cutParts.push(s); }
    // outside walls get a lighter outer skin, so the building looks like a building
    if (!interior) {
      for (const [p, q] of segmentsBetween(start, end, holes)) {
        const skin = new THREE.Mesh(alongX ? new THREE.BoxGeometry(q - p, WALL_H, 0.02) : new THREE.BoxGeometry(0.02, WALL_H, q - p), outMat);
        skin.position.set(alongX ? (p + q) / 2 : out[0] * 0.105, WALL_H / 2, alongX ? out[1] * 0.105 : (p + q) / 2);
        rec.fullParts.push(skin); rec.group.add(skin);
      }
    }
    // a real door in outside openings (the balcony door, the front door)
    if (door && holes.length) {
      const hc = holes[0];
      const panel = new THREE.Mesh(alongX ? new THREE.BoxGeometry(OPEN_W - 0.04, OPEN_H - 0.02, 0.06) : new THREE.BoxGeometry(0.06, OPEN_H - 0.02, OPEN_W - 0.04),
        door === 'glass' ? new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.45, roughness: 0.1 }) : frameMat);
      panel.position.set(alongX ? hc : out[0] * 0.13, OPEN_H / 2, alongX ? out[1] * 0.13 : hc);
      rec.group.add(panel); rec.fullParts.push(panel);
      if (door === 'glass') for (const yy of [0.7, 1.4]) { const bar = piece(hc - OPEN_W / 2, hc + OPEN_W / 2, yy, yy + 0.04, frameMat, 0.1); rec.fullParts.push(bar); }
      else { const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: '#e9c46a', metalness: 0.6, roughness: 0.3 }));
        knob.position.set(alongX ? hc + 0.3 : out[0] * 0.18, 1.0, alongX ? out[1] * 0.18 : hc + 0.3); rec.group.add(knob); rec.fullParts.push(knob); }
    }
    rec.fullParts = rec.fullParts.filter(Boolean);
    group.add(rec.group); walls.push(rec);
    return rec;
  }

  // which openings are on which side
  const left = info.left && layout.rooms.get(info.left), right = info.right && layout.rooms.get(info.right);
  const doorZ = (a, b) => layout.links.filter((l) => l.type === 'door' && l.a === a && l.b === b).map((l) => l.cellA.z);
  const balcony = layout.floors[info.floor].balcony;
  const isBalconyRoom = balcony?.roomId === room.id && layout.floors.length > 1;
  const isEntrance = info.floor === 0 && info.index === 0;

  addWall([0, -1], 0, w, [], false); // back
  addWall([0, 1], 0, w, isEntrance ? [Math.floor(w / 2)] : [], false, isEntrance ? 'wood' : null); // front (front door in the entrance)
  // left: shared with the left neighbour where they overlap (that room draws the shared part)
  if (left) addWall([-1, 0], Math.min(d, left.d), d, [], false);
  else addWall([-1, 0], 0, d, [], false);
  // right: shared wall with a doorway, or the outside wall with the balcony door
  if (right) {
    const n = Math.min(d, right.d);
    addWall([1, 0], 0, n, doorZ(room.id, right.room.id), true);
    addWall([1, 0], n, d, [], false);
  } else {
    addWall([1, 0], 0, d, isBalconyRoom ? [balcony.cell.z] : [], false, isBalconyRoom ? 'glass' : null);
  }

  // ----- furniture -----
  const items = [];
  for (const item of room.items) {
    const mesh = itemMesh(item, t);
    if (!mesh) continue;
    const [sw, sd] = footprint(item) || [1, 1];
    mesh.position.set(item.x + sw / 2 - w / 2, 0, item.z + sd / 2 - d / 2);
    mesh.rotation.y = -item.rot * Math.PI / 2;
    mesh.traverse((o) => { o.userData.itemId = item.id; o.userData.roomId = room.id; });
    group.add(mesh); items.push(mesh);
  }

  // build-mode grid
  const grid = new THREE.GridHelper(Math.max(w, d), Math.max(w, d), '#ffffff', '#ffffff');
  grid.material.opacity = 0.35; grid.material.transparent = true; grid.position.y = 0.01;
  grid.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); grid.visible = false;
  group.add(grid);

  return { group, floorMesh, items, walls, roof, grid };
}

/** Pieces of [a, b] that are not inside an opening. */
function segmentsBetween(a, b, holes) {
  const out = []; let s = a;
  for (const h of holes) { out.push([s, h - OPEN_W / 2]); s = h + OPEN_W / 2; }
  out.push([s, b]);
  return out.filter(([p, q]) => q - p > 0.01);
}

/**
 * Show a wall full height, or cut down to the skirting board.
 */
export function setWallCut(rec, cut) {
  if (rec.cut === cut) return;
  rec.cut = cut;
  for (const p of rec.fullParts) p.visible = !cut;
}
