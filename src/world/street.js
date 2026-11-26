// FRIENDS' STREET (owned by World): your building stands on a little street, and the houses of your
// friends (the ones they've opened for visits, see "Friends can visit") stand across the road.
//
//   - A road with a pavement, street lamps that glow at night, and trees.
//   - Up to 4 friends' houses across the street, coloured by their vibe, with lit windows at night
//     and a sign: "🏠 Mia's Love Nest". Empty plots have a "Your friend could live here" sign.
//   - Tap a friend's house: your avatar walks out of your front door, down the path, along the street
//     and up to their door, then you go in as a guest.
// Going in is Social's job: World calls the service 'social.visit(houseId)' if Social offers it, or
// else opens the Friends panel (where the Visit button is).
// Friends' houses come from ctx.backend.listFriendHouses() (checked when you enter a house and every 2 minutes).

import * as THREE from 'three';

const VIBE = { cozy: '#f1d6b8', pastel: '#f7c8d8', modern: '#e3e6ea', retro: '#f5c26b', nature: '#b8d8a8', night: '#7b7fb0' };
const ROOFS = { cozy: '#9c5a3c', pastel: '#c97b9b', modern: '#5b6270', retro: '#c0583a', nature: '#5e8c4f', night: '#3b3f66' };
const TYPE = { love: 'Love Nest', friends: 'Friends Crib', family: 'Family Home', solo: 'Studio' };
const SLOTS = 4;

const mats = new Map();
const mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...o })); return mats.get(k); };
const box = (g, w, h, d, c, x, y, z, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };

function sign(text, scale = 1) {
  const cv = document.createElement('canvas'); cv.width = 384; cv.height = 72;
  const g = cv.getContext('2d'); g.font = 'bold 28px system-ui, sans-serif';
  const label = text.length > 26 ? text.slice(0, 25) + '…' : text;
  const w = Math.min(376, g.measureText(label).width + 30);
  g.fillStyle = 'rgba(255,250,243,.95)'; g.beginPath(); g.roundRect((384 - w) / 2, 8, w, 52, 16); g.fill();
  g.fillStyle = '#3b2f2a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 192, 35);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sp.scale.set(2.8 * scale, 0.52 * scale, 1); return sp;
}

export function createStreet(ctx, world) {
  const { backend, store, ui } = ctx;
  let group = null; let layoutRef = null; let friends = []; let checkT = 0;
  const targets = [];      // things you can tap: { object -> userData.street = { houseId | 'empty' } }
  const windowMats = [];   // lit at night
  const lampMats = [];
  let geo = null;          // where things are: { zStreet, door: Vector3, doorOutside, pathEnd, houses: [{ id, door }] }

  async function refresh() {
    const s = store.get(); if (!s.house) return;
    let list = [];
    try { list = await backend.listFriendHouses(); } catch (e) { list = []; }
    list = (list || []).filter((h) => h.id !== s.house.id).slice(0, SLOTS);
    const key = JSON.stringify(list.map((h) => [h.id, h.name, h.vibe, h.type, h.ownerName]));
    if (key !== JSON.stringify(friends.map((h) => [h.id, h.name, h.vibe, h.type, h.ownerName]))) { friends = list; if (layoutRef) build(layoutRef); }
  }

  /** Draw the street in front of the building (call again when the building changes). */
  function build(layout) {
    layoutRef = layout;
    if (group) world.scene.remove(group);
    group = new THREE.Group(); targets.length = 0; windowMats.length = 0; lampMats.length = 0;
    const entrance = layout.rooms.get(layout.floors[0]?.rooms[0]); if (!entrance) return;
    const depth = Math.max(...layout.floors.map((f) => f.depth));
    const cx = entrance.ox + entrance.w / 2;
    const zStreet = depth + 7.5;            // the middle of the road
    const x0 = -30, x1 = layout.xMax + 34;
    // pavement, road, a dashed line, kerbs
    box(group, x1 - x0, 0.06, 2.0, '#d9d2c5', (x0 + x1) / 2, -0.18, zStreet - 3.2);
    box(group, x1 - x0, 0.05, 4.4, '#5f6470', (x0 + x1) / 2, -0.19, zStreet);
    for (let x = x0; x < x1; x += 2.4) box(group, 1.2, 0.01, 0.14, '#f4efe6', x, -0.16, zStreet).castShadow = false;
    box(group, x1 - x0, 0.06, 2.0, '#d9d2c5', (x0 + x1) / 2, -0.18, zStreet + 3.2);
    // the path from my front door joins the pavement
    for (let z = depth + 5.2; z < zStreet - 4; z += 0.85) box(group, 0.9, 0.06, 0.6, '#cfc6b6', cx, -0.2, z);
    // street lamps + trees along both pavements
    for (let x = x0 + 4; x < x1 - 2; x += 9) {
      for (const side of [-1, 1]) {
        const z = zStreet + side * 3.8;
        box(group, 0.1, 2.8, 0.1, '#3a3a48', x, 1.2, z);
        const bulb = new THREE.MeshStandardMaterial({ color: '#fff1c1', emissive: '#ffcc66', emissiveIntensity: 0.2 }); lampMats.push(bulb);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.35), bulb); head.position.set(x, 2.7, z); group.add(head);
        const tx = x + 4.5;
        if (tx < x1 - 2) {
          box(group, 0.25, 1.2, 0.25, '#7a5233', tx, 0.4, z);
          const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), mat('#5e9c5a')); crown.position.set(tx, 1.7, z); crown.castShadow = true; group.add(crown);
        }
      }
    }
    // friends' houses across the street (empty plots for the rest)
    const houses = [];
    for (let i = 0; i < SLOTS; i++) {
      const x = cx + (i - (SLOTS - 1) / 2) * 11;
      const z = zStreet + 9;                // the house centre; its door faces the street
      const fh = friends[i];
      if (fh) houses.push({ id: fh.id, door: new THREE.Vector3(x, 0, z - 3.6) });
      group.add(fh ? friendHouse(fh, x, z) : emptyPlot(x, z));
    }
    const door = world.cellGlobal(entrance.room.id, { x: Math.floor(entrance.w / 2), z: entrance.d - 1 });
    geo = { zStreet, door, doorOutside: new THREE.Vector3(cx, 0, entrance.d + 0.8), pathEnd: new THREE.Vector3(cx, 0, zStreet - 3.2), houses };
    world.scene.add(group);
    applyNight(world.night());
  }

  function friendHouse(fh, x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const wall = VIBE[fh.vibe] || VIBE.cozy, roof = ROOFS[fh.vibe] || ROOFS.cozy;
    box(g, 8, 4.6, 6, wall, 0, 2.1, 0);
    // a pitched roof made of two tilted slabs
    for (const s of [-1, 1]) { const r = box(g, 8.6, 0.25, 3.7, roof, 0, 5.0, s * 1.55); r.rotation.x = s * 0.55; }
    // windows (they light up at night) + the front door
    const glass = new THREE.MeshStandardMaterial({ color: '#cfe8ff', emissive: '#ffcf7a', emissiveIntensity: 0 }); windowMats.push(glass);
    for (const [wx, wy] of [[-2.6, 1.6], [2.6, 1.6], [-2.6, 3.4], [2.6, 3.4], [0, 3.4]]) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.08), glass); w.position.set(wx, wy, -3.02); g.add(w);
      box(g, 1.25, 0.08, 0.16, '#ffffff', wx, wy - 0.5, -3.06);
    }
    box(g, 1.1, 2.0, 0.12, '#8a5a35', 0, 1.0, -3.04); // the front door
    box(g, 1.4, 0.1, 0.8, '#cfc6b6', 0, -0.15, -3.5);
    // a little garden path to the pavement + a mailbox
    for (let k = 0; k < 2; k++) box(g, 0.9, 0.06, 0.6, '#cfc6b6', 0, -0.2, -4.3 - k * 0.85);
    box(g, 0.12, 1.0, 0.12, '#5b6270', 1.4, 0.4, -4.4); box(g, 0.45, 0.32, 0.3, '#e76f51', 1.4, 1.0, -4.4);
    const who = fh.ownerName ? `${fh.ownerName}'s` : 'A friend\'s';
    const sp = sign(`🏠 ${who} ${TYPE[fh.type] || 'house'}`); sp.position.set(0, 6.4, -2.6); g.add(sp);
    const sub = sign(`“${fh.name}” · tap to visit`, 0.7); sub.position.set(0, 5.8, -2.6); g.add(sub);
    g.traverse((o) => { o.userData.street = { houseId: fh.id, name: fh.name }; });
    targets.push(g);
    return g;
  }
  function emptyPlot(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    box(g, 8, 0.05, 6, '#9fc98a', 0, -0.18, 0);
    // a little fence and a sign on a post
    for (let i = -4; i <= 4; i += 1) box(g, 0.08, 0.6, 0.08, '#f4efe6', i, 0.15, -3);
    box(g, 8, 0.06, 0.06, '#f4efe6', 0, 0.38, -3);
    box(g, 0.1, 1.4, 0.1, '#8a5a35', 0, 0.55, -2.4); box(g, 1.6, 0.8, 0.08, '#fffaf0', 0, 1.4, -2.4);
    const sp = sign('🪧 Your friend could live here', 0.8); sp.position.set(0, 2.4, -2.4); g.add(sp);
    g.traverse((o) => { o.userData.street = { empty: true }; });
    targets.push(g);
    return g;
  }

  function applyNight(night) {
    for (const m of windowMats) m.emissiveIntensity = night * 0.9;
    for (const m of lampMats) m.emissiveIntensity = 0.2 + night * 1.6;
  }

  /** The points to walk from just outside my front door to a friend's door. */
  function walkPoints(houseId) {
    const h = geo?.houses.find((x) => x.id === houseId); if (!h) return null;
    return [geo.door.clone(), geo.doorOutside.clone(), geo.pathEnd.clone(), new THREE.Vector3(h.door.x, 0, geo.pathEnd.z), new THREE.Vector3(h.door.x, 0, geo.zStreet + 3.2), h.door.clone()];
  }
  /** At their door: go in (Social does that). */
  function enter(houseId, name) {
    name = name || friends.find((f) => f.id === houseId)?.name;
    if (ctx.has('social.visit')) ctx.use('social.visit')(houseId);
    else { ui.toast(`Knock knock 🚪 Tap Visit next to "${name || 'their house'}"`); ctx.use('social.openFriends')(); }
  }

  function update(dt) {
    checkT -= dt;
    if (checkT <= 0) { checkT = 120; refresh(); }
    applyNight(world.night());
  }
  return { build, update, refresh, targets, walkPoints, enter, frontDoorCell: () => geo && geo.door, get group() { return group; } };
}
