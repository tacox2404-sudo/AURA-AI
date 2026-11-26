// WORLD AREA - entry point. Owner: World.
// The 3D scene: the whole house as one multi-floor building, camera, my avatar, other players,
// tapping and walking. Furniture meshes come from the Building area through ctx.use('build.itemMesh').
//
// The house is a cosy penthouse (building.js): two rooms per floor joined by a doorway, a balcony on
// every floor and a spiral staircase outside. The Entrance is on the ground floor, the top floor is the
// Penthouse. store.roomId is still "the room I'm in": walk through a doorway and it changes by itself.
//
// How you move (phone first):
//   tap the floor = walk there (also into the next room)   double-tap = run   press and hold = follow your finger
//   tap furniture = walk up and use it    tap a seat = sit    tap a friend = go say hi (you wave)
//   tap a doorway sign = go to that room    ▲ / ▼ buttons or the stairs = go up / down a floor
//   tap the pet = pet it    pinch / mouse wheel = zoom (zoom out to see the whole building)
//   keyboard: WASD / arrows walk (Shift runs, walk into a doorway to go through), Q / E turn the camera, 1-7 emotes
// Other files: building.js (layout, balconies, stairs), roomMesh.js (one room), daylight.js (time of day +
// windows), pet.js, emotes.js, seats.js, walkGrid.js, avatar.js, wardrobe.js.

import * as THREE from 'three';
import { buildAvatar, animateAvatar, setSitting, nameTag, randomAppearance } from './avatar.js';
import { isSeat, seatSlots } from './seats.js';
import { initWardrobe } from './wardrobe.js';
import { makeWalkGrid } from './walkGrid.js';
import { layoutBuilding, findRoute, linkPath, buildOutside, FLOOR_H } from './building.js';
import { buildRoomMesh, setWallCut } from './roomMesh.js';
import { buildWindows, lightAt, GLOWING } from './daylight.js';
import { createPet } from './pet.js';
import { initEmotes, floatEmoji } from './emotes.js';
import { initTogether } from './together.js';
import { initParty } from './party.js';
import { initGhosts } from './ghosts.js';
import { currentRoom } from '../core/store.js';

export function initWorld(ctx) {
  const { bus, store, ui } = ctx;

  // ---------- renderer + scene ----------
  const host = document.getElementById('world');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#cfe8ff');
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
  const hemi = new THREE.HemisphereLight('#ffffff', '#b9a48a', 1.4);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3df', 1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, far: 60 });
  scene.add(sun, sun.target);
  // a few warm lights for lamps, candles and the fireplace on my floor (lights are expensive on phones)
  const lightPool = Array.from({ length: 4 }, () => { const l = new THREE.PointLight('#ffb35c', 0, 5.5, 1.6); scene.add(l); return l; });

  function resize() {
    const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  // ---------- the building ----------
  let layout = null;          // where every room is (building.js)
  const rooms = new Map();    // roomId -> { info, mesh, walk, win }
  let outside = null;         // balconies, stairs, garden, signs
  let houseGroup = null;
  let roomRef = null;         // the room I'm in
  let walk = null;            // its walk grid
  let bounds = { w: 8, d: 8 };
  let itemMeshes = [];        // furniture on my floor (for tapping)
  let floorMeshes = [];       // floors of the rooms on my floor
  const curFloor = () => (roomRef && layout?.rooms.get(roomRef.id)?.floor) || 0;
  const floorY = () => curFloor() * FLOOR_H;
  // the floor the camera shows: on the stairs it switches halfway up (or down)
  const viewFloor = () => (me.transit?.stairs ? Math.max(0, Math.min(layout.floors.length - 1, Math.round((me.holder.position.y - 0.2) / FLOOR_H))) : curFloor());
  const roomCenter = (id) => layout.toGlobal(id, 0, 0);
  const toLocal = (id, g) => { const c = roomCenter(id); return new THREE.Vector3(g.x - c.x, 0, g.z - c.z); };
  const cellToLocal = (x, z, sw = 1, sd = 1) => new THREE.Vector3(x + sw / 2 - bounds.w / 2, 0, z + sd / 2 - bounds.d / 2);
  const localToCell = (p, b = bounds) => ({ x: Math.floor(p.x + b.w / 2), z: Math.floor(p.z + b.d / 2) });

  function buildHouse(house) {
    if (houseGroup) scene.remove(houseGroup);
    houseGroup = new THREE.Group(); rooms.clear();
    const footprint = ctx.use('build.footprint'), itemDef = ctx.use('build.itemDef'), itemMesh = ctx.use('build.itemMesh');
    const walks = new Map(house.rooms.map((r) => [r.id, makeWalkGrid(r, footprint, itemDef)]));
    layout = layoutBuilding(house, walks);
    for (const room of house.rooms) {
      const info = layout.rooms.get(room.id);
      const mesh = buildRoomMesh(room, info, layout, itemMesh, footprint);
      // windows only on outside walls, never next to a door
      const sides = [[0, -1], [0, 1]]; if (!info.left) sides.push([-1, 0]); if (!info.right) sides.push([1, 0]);
      const avoid = [];
      for (const l of layout.links) { if (l.a === room.id) avoid.push(l.cellA); if (l.b === room.id) avoid.push(l.cellB); }
      if (info.floor === 0 && info.index === 0) avoid.push({ x: Math.floor(room.size[0] / 2), z: room.size[1] - 1 });
      const win = buildWindows(room, walks.get(room.id), sides, avoid);
      mesh.group.add(win.group);
      houseGroup.add(mesh.group);
      rooms.set(room.id, { info, mesh, walk: walks.get(room.id), win });
    }
    outside = buildOutside(layout, house);
    houseGroup.add(outside.group);
    scene.add(houseGroup);
  }

  /** I'm now in this room: remember it, show the right floor, move the lights. */
  function enterRoom(room) {
    roomRef = room;
    const r = rooms.get(room.id);
    walk = r?.walk || null;
    bounds = { w: room.size[0], d: room.size[1] };
    itemMeshes = []; floorMeshes = [];
    const f = curFloor();
    for (const x of rooms.values()) if (x.info.floor === f) { itemMeshes.push(...x.mesh.items); floorMeshes.push(x.mesh.floorMesh); }
    updateVisibility(true);
    placeLights();
    applyDaylight();
    floorUi.render();
    party.check(room.id);
    setTimeout(() => ghosts.lookForGhost(), 700); // after the room has appeared
  }

  // Which walls to cut down: on my floor, the ones between the camera and me.
  const facesCamera = (out) => out[0] * camDir.x + out[1] * camDir.z >= 0.05;
  let shownFloor = -1;
  function updateVisibility(force) {
    if (!layout || !roomRef) return;
    const f = viewFloor(); const mine = layout.rooms.get(roomRef.id);
    const mode = store.get().mode;
    for (const [id, r] of rooms) {
      const fl = r.info.floor;
      if (force || f !== shownFloor) {
        r.mesh.group.visible = fl <= f;
        r.mesh.roof.visible = fl < f;
        for (const m of r.mesh.items) m.visible = fl === f;
      }
      r.mesh.grid.visible = mode === 'build' && id === roomRef.id;
      for (const wl of r.mesh.walls) {
        if (fl < f) { setWallCut(wl, wl.interior); continue; } // floors below: outside walls up, like a building
        if (fl > f) continue;
        // a shared wall belongs to the left room; seen from the right room it faces the other way
        let out = wl.out;
        if (wl.interior && mine && mine.left === id) out = [-out[0], -out[1]];
        setWallCut(wl, facesCamera(out) || (wl.interior && mine?.floor === fl && mine.room.id !== id && mine.left !== id));
      }
      for (const wn of r.win.windows) wn.group.visible = fl < f || (fl === f && !facesCamera(wn.out));
    }
    if (force || f !== shownFloor) {
      outside.perFloor.forEach((g, i) => { g.visible = i <= f; });
      outside.stairs.forEach((g, i) => { g.visible = i <= f; });
      for (const s of outside.signs) s.sprite.visible = s.floor === f && (!s.room || s.room === roomRef.id); // doorway signs: only on my side
      shownFloor = f;
      syncRemotes();
    }
  }

  // ---------- time of day ----------
  // ?hour=21 in the address bar shows the house at 9 pm (handy for testing).
  const params = new URLSearchParams(location.search);
  const forcedHour = params.has('hour') ? Number(params.get('hour')) : NaN;
  let lastLight = null; let lightCheck = 0;
  function applyDaylight() {
    const d = new Date();
    const hour = Number.isFinite(forcedHour) ? forcedHour : d.getHours() + d.getMinutes() / 60;
    const light = lightAt(hour);
    lastLight = light;
    hemi.intensity = light.hemi; sun.intensity = light.sunI; sun.color.copy(light.sun);
    scene.background = new THREE.Color('#dfeaf5').lerp(light.sky, 0.75);
    for (const r of rooms.values()) r.win.update(light);
    for (const l of lightPool) l.intensity = l.userData.on ? 2.2 * light.night : 0;
  }
  function placeLights() {
    const f = curFloor(); const spots = [];
    const footprint = ctx.use('build.footprint');
    // lights in my room first, then the rest of my floor
    const order = [...rooms.values()].filter((r) => r.info.floor === f).sort((a) => (a.info.room.id === roomRef?.id ? -1 : 1));
    for (const r of order) for (const item of r.info.room.items) {
      const y = GLOWING[item.kind]; if (y == null) continue;
      const [sw, sd] = footprint(item) || [1, 1];
      spots.push({ p: layout.cellGlobal(r.info.room.id, { x: item.x + sw / 2 - 0.5, z: item.z + sd / 2 - 0.5 }), y, tv: item.kind === 'tv' });
    }
    lightPool.forEach((l, i) => {
      const s = spots[i]; l.userData.on = !!s;
      if (s) { l.position.set(s.p.x, s.p.y + s.y, s.p.z); l.color.set(s.tv ? '#9ecbff' : '#ffb35c'); }
    });
  }

  // ---------- my avatar ----------
  // pos is in my room's local coordinates (like presence). path = points still to walk through.
  // route = rooms to walk through to reach a far room (doorways + stairs), goal = what to do when I get there.
  const me = { holder: new THREE.Group(), av: null, path: [], pos: new THREE.Vector3(0, 0, 2), keys: new Set(), sit: null, pendingSit: null,
    run: false, faceAt: null, pendingFriend: null, transit: null, route: [], goal: null, wasMoving: false };
  scene.add(me.holder);
  const clearPlans = () => { me.pendingSit = null; me.pendingFriend = null; me.faceAt = null; me.route = []; me.goal = null; };
  let movingSelf = false; // true while I change room by walking (so the room change doesn't teleport me)

  function rebuildMyAvatar() {
    const s = store.get();
    if (me.av) me.holder.clear();
    me.av = buildAvatar(s.me?.avatar || randomAppearance());
    me.holder.add(me.av, nameTag(s.me?.username || 'me', '#ffe08a'));
    if (me.sit) setSitting(me.av, true); // a new outfit while sitting: stay seated
  }
  /** Put me in the current room (after a jump from the room tabs, or entering the house). */
  function spawn() {
    if (me.sit) { me.sit = null; if (me.av) setSitting(me.av, false); }
    clearPlans(); me.transit = null; me.path = [];
    const info = layout.rooms.get(roomRef.id);
    let p = null;
    if (info.floor === 0 && info.index === 0) p = cellToLocal(Math.floor(bounds.w / 2), bounds.d - 1); // just inside the front door
    else {
      const l = layout.links.find((x) => x.a === roomRef.id || x.b === roomRef.id); // next to a doorway or the balcony door
      if (l) { const c = l.a === roomRef.id ? l.cellA : l.cellB; p = cellToLocal(c.x, c.z); }
    }
    if (!p) p = new THREE.Vector3((Math.random() - 0.5) * Math.min(4, bounds.w - 2), 0, bounds.d / 2 - 1 - Math.random());
    const free = walk ? walk.nearestFree(p.x, p.z) : p; // never inside furniture
    me.pos.set(free.x, 0, free.z);
    placeHolder();
    pet.place(walk, me.pos, roomCenter(roomRef.id));
    sendPresence(true);
  }
  function placeHolder() {
    if (!layout || !roomRef) return;
    const g = layout.toGlobal(roomRef.id, me.pos.x, me.pos.z, me.sit ? me.sit.y : 0);
    me.holder.position.copy(g);
  }

  // ---------- other players ----------
  const remotes = new Map(); // userId -> { holder, av, key, target (building coords), roomId, local }
  function syncRemotes() {
    const s = store.get();
    const f = curFloor();
    const here = layout ? s.players.filter((p) => layout.rooms.get(p.roomId)?.floor === f) : []; // everyone on my floor
    const ids = new Set(here.map((p) => p.userId));
    for (const [id, r] of remotes) if (!ids.has(id)) { scene.remove(r.holder); remotes.delete(id); }
    for (const p of here) {
      let r = remotes.get(p.userId);
      const key = JSON.stringify(p.avatar || {}) + p.name;
      const g = layout.toGlobal(p.roomId, p.x ?? 0, p.z ?? 0, p.sit ? (p.sy || 0) : 0);
      if (!r || r.key !== key) {
        if (r) scene.remove(r.holder);
        const holder = new THREE.Group();
        const av = buildAvatar(p.avatar || randomAppearance());
        holder.add(av, nameTag(p.name || 'friend'));
        holder.position.copy(g);
        scene.add(holder);
        r = { holder, av, key, target: g.clone(), sit: false, ry: 0 };
        remotes.set(p.userId, r);
      }
      if (r.roomId && r.roomId !== p.roomId && layout.rooms.get(r.roomId)?.floor !== f) r.holder.position.copy(g); // came up the stairs: appear
      r.roomId = p.roomId; r.local = { x: p.x ?? 0, z: p.z ?? 0 }; r.name = p.name || 'friend';
      r.sit = !!p.sit; r.ry = p.ry || 0;
      r.target.copy(g);
    }
  }

  // speech bubbles from chat
  function bubble(holder, text) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    const g = cv.getContext('2d'); g.font = '34px system-ui, sans-serif';
    const msg = text.length > 32 ? text.slice(0, 30) + '…' : text;
    const w = Math.min(500, g.measureText(msg).width + 44);
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect((512 - w) / 2, 10, w, 80, 30); g.fill();
    g.beginPath(); g.moveTo(246, 88); g.lineTo(266, 88); g.lineTo(256, 112); g.fill();
    g.fillStyle = '#222'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(msg, 256, 50);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sp.scale.set(2.6, 0.65, 1); sp.position.y = 2.4; sp.renderOrder = 11;
    holder.add(sp); setTimeout(() => holder.remove(sp), 4500);
  }
  bus.on('chat:message', (m) => {
    if (m.kind === 'system') return;
    const s = store.get();
    if (m.userId === s.me?.id) bubble(me.holder, m.text);
    else { const r = remotes.get(m.userId); if (r) bubble(r.holder, m.text); }
  });

  // ---------- presence ----------
  let lastSent = 0;
  function sendPresence(force) {
    const now = performance.now();
    if (!force && now - lastSent < 120) return;
    lastSent = now;
    const s = store.get();
    if (!s.me || !s.house) return;
    ctx.use('live.presence')({ roomId: s.roomId, x: +me.pos.x.toFixed(2), z: +me.pos.z.toFixed(2), name: s.me.username, avatar: s.me.avatar,
      sit: me.sit ? 1 : 0, sy: me.sit ? +me.sit.y.toFixed(3) : 0, ry: me.sit ? +me.sit.ry.toFixed(3) : 0 }); // sit/sy/ry: sitting, how high, which way I face
  }

  // ---------- going somewhere: in my room, or through doorways and up/down the stairs ----------
  /** Walk to another room (any floor) and then do `goal` there. */
  function goTo(roomId, goal = null) {
    if (!layout || !roomRef) return false;
    standUp(); clearPlans(); me.run = false; me.transit = null;
    const route = findRoute(layout, roomRef.id, roomId);
    if (!route) { ui.toast("Can't find the way there"); return false; }
    me.route = route; me.goal = goal;
    if (route.length) startLeg(); else doGoal();
    return true;
  }
  /** Walk up to the doorway (or balcony door) of the next step of the route. */
  function startLeg() {
    const leg = me.route[0];
    const cell = leg.link.a === leg.from ? leg.link.cellA : leg.link.cellB;
    me.path = walk ? walk.pathToCell(me.pos, cell) || [] : [];
  }
  /** At the doorway: follow the exact points through it (round the spiral staircase for stairs). */
  function startTransit(leg) {
    const pts = linkPath(layout, leg.link, leg.from);
    pts.unshift(me.holder.position.clone());
    me.transit = { pts, i: 1, leg, stairs: leg.link.type === 'stairs' };
  }
  function finishTransit() {
    const leg = me.transit.leg; const end = me.transit.pts[me.transit.pts.length - 1];
    me.transit = null; me.route.shift();
    const room = store.get().house.rooms.find((r) => r.id === leg.to);
    movingSelf = true;
    store.set({ roomId: leg.to });      // my store listener calls enterRoom() for me
    movingSelf = false;
    if (roomRef?.id !== leg.to && room) enterRoom(room);
    const p = toLocal(leg.to, end); me.pos.set(p.x, 0, p.z);
    pet.place(walk, me.pos, roomCenter(leg.to)); // the pet follows me in
    sendPresence(true);
    if (me.route.length) startLeg(); else doGoal();
  }
  /** Arrived in the right room: do what I came for. */
  function doGoal() {
    const goal = me.goal; me.goal = null;
    if (!goal || !walk) return;
    if (goal.type === 'point') { me.path = walk.pathToPoint(me.pos, clampToRoom(goal.p.clone())) || []; me.run = !!goal.run; if (me.path.length) showMarker(me.path[me.path.length - 1], goal.run); }
    if (goal.type === 'item') useItem(goal.item);
    if (goal.type === 'seat') trySit(goal.item, goal.p);
  }
  /** Walk up to a piece of furniture in my room, face it, and open it. */
  function useItem(item) {
    standUp(); me.run = false;
    if (walk) me.path = walk.pathToItem(me.pos, item) || [];
    const [fw, fd] = ctx.use('build.footprint')(item) || [1, 1];
    me.faceAt = cellToLocal(item.x, item.z, fw, fd);
    bounceItem(item.id);
    bus.emit('item:activate', { item, room: roomRef });
  }
  /** Go one floor up (+1) or down (-1), through the stairs. */
  function goFloor(dir) {
    if (!layout) return false;
    const target = layout.floors[curFloor() + dir];
    if (!target) return false;
    return goTo(target.balcony.roomId, null);
  }

  // ---------- input: tap / click / pinch / hold ----------
  // Pointer events cover mouse, pen and fingers. A "tap" is a quick press that didn't
  // move much AND never had a second finger: so pinching to zoom never makes you walk.
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  const pointers = new Map(); // finger id -> {x, y}
  let down = null;            // where the first finger went down
  let gesture = false;        // true once a second finger joined (pinch), until all fingers lift
  let pinch0 = null;          // { d: finger distance, z: zoom } when the pinch started
  let zoom = 1;               // 1 = my room fits; smaller = closer; bigger = see the whole building
  const ZOOM_MIN = 0.45, ZOOM_MAX = 2.0;
  const clampZoom = (z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
  const fingerGap = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
  const cv = renderer.domElement;

  // Press and hold (one finger, in play mode) = "walk after my finger" (inside my room) until you let go.
  let holdTimer = null; let holding = false; let holdPoint = null; let holdRepath = 0;
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function setRay(clientX, clientY) {
    const rect = cv.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  }
  function floorPointAt(clientX, clientY) {
    setRay(clientX, clientY);
    floorPlane.constant = -floorY();
    const p = new THREE.Vector3();
    return ray.ray.intersectPlane(floorPlane, p) ? clampToRoom(toLocal(roomRef.id, p)) : null;
  }
  const stopHold = () => { clearTimeout(holdTimer); holdTimer = null; holding = false; };

  cv.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      down = { x: e.clientX, y: e.clientY }; gesture = false;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (pointers.size !== 1 || gesture || store.get().mode !== 'play' || ui.isPanelOpen() || me.transit || !roomRef) return;
        const pt = [...pointers.values()][0];
        holding = true; holdPoint = floorPointAt(pt.x, pt.y); holdRepath = 0;
        clearPlans(); standUp(); me.run = false;
      }, 320);
    }
    if (pointers.size === 2) { gesture = true; pinch0 = { d: fingerGap(), z: zoom }; stopHold(); }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch0 && pointers.size >= 2) zoom = clampZoom(pinch0.z * pinch0.d / fingerGap());
    if (holding) holdPoint = floorPointAt(e.clientX, e.clientY) || holdPoint;
    else if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) { clearTimeout(holdTimer); holdTimer = null; } // a drag, not a hold
  });
  const lift = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch0 = null;
    const wasHold = holding;
    if (pointers.size === 0) stopHold();
    const wasTap = !wasHold && e.type === 'pointerup' && down && !gesture && pointers.size === 0 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 12;
    if (pointers.size === 0) down = null;
    if (wasTap) handleTap(e);
  };
  cv.addEventListener('pointerup', lift);
  cv.addEventListener('pointercancel', lift);
  cv.addEventListener('wheel', (e) => { zoom = clampZoom(zoom + e.deltaY * 0.001); e.preventDefault(); }, { passive: false });

  const isShown = (obj) => { for (let o = obj; o; o = o.parent) if (!o.visible) return false; return true; };
  const isInside = (obj, root) => { for (let o = obj; o; o = o.parent) if (o === root) return true; return false; };
  let lastFloorTap = { t: 0, x: 0, y: 0 }; // for double-tap = run

  function handleTap(e) {
    if (!layout || !roomRef || me.transit) return;
    setRay(e.clientX, e.clientY);
    const s = store.get(); const mode = s.mode; const playing = mode === 'play';
    const firstShown = (hits) => hits.find((h) => isShown(h.object));

    if (playing) {
      // signs are drawn on top of everything, so they win
      const sign = firstShown(ray.intersectObjects(outside.signs.map((x) => x.sprite), false));
      if (sign) return useSign(sign.object.userData);
      const petHit = pet.mesh && ray.intersectObject(pet.mesh, true)[0];
      const friendHit = firstShown(ray.intersectObjects([...remotes.values()].map((r) => r.av), true));
      const stairHit = firstShown(ray.intersectObjects(outside.tapTargets.filter((o) => !o.isSprite), true));
      const near = [petHit && { k: 'pet', d: petHit.distance }, friendHit && { k: 'friend', d: friendHit.distance, h: friendHit },
        stairHit && { k: 'stairs', d: stairHit.distance, h: stairHit }].filter(Boolean).sort((a, b) => a.d - b.d)[0];
      const solid = firstShown(ray.intersectObjects([...itemMeshes, ...floorMeshes], true));
      if (near && (!solid || near.d <= solid.distance + 0.3)) {
        if (near.k === 'pet') return tapPet();
        if (near.k === 'stairs') return useSign(near.h.object.userData);
        if (near.k === 'friend') { const id = [...remotes.entries()].find(([, r]) => isInside(near.h.object, r.av))?.[0]; if (id) return goToFriend(id); }
      }
    }

    // furniture and floors: in play mode anywhere on my floor; when building or with Pip, only my room
    const pool = playing ? [...itemMeshes, ...floorMeshes] : [...(rooms.get(roomRef.id)?.mesh.items || []), rooms.get(roomRef.id)?.mesh.floorMesh].filter(Boolean);
    const hit = firstShown(ray.intersectObjects(pool, true));
    if (!hit) return;
    const ud = hit.object.userData;
    const roomId = ud.roomId || ud.floorOf || hitRoom(hit.object);
    const room = s.house.rooms.find((r) => r.id === roomId);
    if (!room) return;
    const local = toLocal(roomId, hit.point);
    const b = { w: room.size[0], d: room.size[1] };
    if (ud.itemId) {
      const item = room.items.find((i) => i.id === ud.itemId);
      if (roomId === roomRef.id || !playing) bus.emit('world:tap', { target: 'item', item, cell: localToCell(local, b), room });
      if (!playing || !item) return;
      const def = ctx.use('build.itemDef')(item.kind);
      if (roomId !== roomRef.id) { goTo(roomId, isSeat(def) ? { type: 'seat', item, p: local } : { type: 'item', item }); return; }
      if (isSeat(def)) return trySit(item, local); // sofas, chairs...: walk over and sit
      clearPlans(); useItem(item);
      return;
    }
    // the floor
    if (roomId === roomRef.id) bus.emit('world:tap', { target: 'floor', cell: localToCell(local, b), room });
    if (!playing || !walk) return;
    const now = performance.now();
    const dbl = now - lastFloorTap.t < 350 && Math.hypot(e.clientX - lastFloorTap.x, e.clientY - lastFloorTap.y) < 40;
    lastFloorTap = { t: dbl ? 0 : now, x: e.clientX, y: e.clientY };
    if (roomId !== roomRef.id) { goTo(roomId, { type: 'point', p: local, run: dbl }); me.run = dbl; return; }
    standUp(); clearPlans();
    me.run = dbl; // double-tap = run
    me.path = walk.pathToPoint(me.pos, clampToRoom(local)) || [];
    if (me.path.length) showMarker(me.path[me.path.length - 1], dbl);
  }
  const hitRoom = (obj) => { for (const [id, r] of rooms) if (isInside(obj, r.mesh.group)) return id; return null; };
  function useSign(ud) {
    if (ud.go) return goTo(ud.go, null);
    if (ud.stairs === 'up') return goFloor(1);
    if (ud.stairs === 'down') return goFloor(-1);
    if (ud.stairs === 'gap') return goFloor(ud.floor === curFloor() ? 1 : -1); // tapped the spiral itself
  }
  const clampToRoom = (p) => { p.x = Math.max(-bounds.w / 2 + 0.3, Math.min(bounds.w / 2 - 0.3, p.x)); p.z = Math.max(-bounds.d / 2 + 0.3, Math.min(bounds.d / 2 - 0.3, p.z)); return p; };

  // A ring on the floor where you're walking to (orange when running).
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.28, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  marker.rotation.x = -Math.PI / 2; marker.renderOrder = 2; scene.add(marker);
  let markerT = 1;
  function showMarker(p, run) { const g = layout.toGlobal(roomRef.id, p.x, p.z, 0.03); marker.position.copy(g); marker.material.color.set(run ? '#ffb35c' : '#ffffff'); markerT = 0; }

  // A tapped piece of furniture does a little bounce, so you see what you tapped.
  const bounces = new Map(); // itemId -> seconds left
  const bounceItem = (id) => bounces.set(id, 0.35);

  // keyboard (desktop): WASD / arrows to walk, Q / E to turn the camera
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input,textarea,select')) return;
    const k = e.key.toLowerCase();
    me.keys.add(k);
    if (!e.repeat && !ui.isPanelOpen() && (k === 'q' || k === 'e')) rotateCamera(k === 'e' ? 1 : -1);
  });
  addEventListener('keyup', (e) => me.keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => me.keys.clear()); // don't keep walking if the window loses focus

  // ---------- camera rotation ----------
  const BASE_YAW = Math.atan2(0.62, 0.78); // the original Sims-style angle
  let camYaw = BASE_YAW, camYawTarget = BASE_YAW;
  const camDir = new THREE.Vector3(0.62, 0.85, 0.78).normalize(); // from the room toward the camera
  function rotateCamera(steps = 1) { camYawTarget += steps * Math.PI / 2; }
  const roundBtn = (label, title, bottom, text, onclick) => ui.h('button', {
    'aria-label': label, title,
    style: {
      position: 'absolute', right: '12px', bottom: `calc(env(safe-area-inset-bottom) + ${bottom}px)`,
      width: '52px', height: '52px', borderRadius: '50%', border: 'none', fontSize: '24px',
      background: 'rgba(255,250,243,.95)', boxShadow: 'var(--shadow, 0 4px 16px rgba(0,0,0,.15))',
      cursor: 'pointer', display: 'none', touchAction: 'manipulation',
    },
    onclick,
  }, text);
  const rotateBtn = roundBtn('Rotate camera', 'Rotate camera (Q / E)', 96, '⟳', () => rotateCamera(1));
  host.append(rotateBtn);

  // ---------- floor buttons (left side): ▲ up a floor, the floor's name, ▼ down a floor ----------
  const floorUi = (() => {
    const { h } = ui;
    const btn = (txt, label, dir) => h('button', { 'aria-label': label, 'data-floor': dir > 0 ? 'up' : 'down',
      style: { width: '48px', height: '44px', border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', touchAction: 'manipulation', borderRadius: '14px' },
      onclick: () => goFloor(dir) }, txt);
    const up = btn('▲', 'Go upstairs', 1), dn = btn('▼', 'Go downstairs', -1);
    const name = h('div', { style: { fontSize: '.68rem', fontWeight: '700', textAlign: 'center', padding: '0 4px', lineHeight: '1.1', maxWidth: '64px', color: 'var(--ink, #2a2240)' } });
    const box = h('div', { style: {
      position: 'absolute', left: '12px', bottom: 'calc(env(safe-area-inset-bottom) + 96px)', display: 'none', flexDirection: 'column', alignItems: 'center',
      padding: '4px', borderRadius: '22px', background: 'rgba(255,250,243,.95)', boxShadow: 'var(--shadow, 0 4px 16px rgba(0,0,0,.15))',
    } }, up, name, dn);
    host.append(box);
    function render() {
      const s = store.get(); const n = layout?.floors.length || 0; const f = curFloor();
      box.style.display = s.house && n > 1 && s.mode !== 'build' ? 'flex' : 'none';
      name.textContent = layout?.floors[f]?.name || '';
      up.disabled = f >= n - 1; dn.disabled = f <= 0;
      up.style.opacity = up.disabled ? '.3' : '1'; dn.style.opacity = dn.disabled ? '.3' : '1';
    }
    return { render };
  })();

  // ---------- emotes ----------
  let ghosts = null; // memory ghosts (set up below; the emote hook tells them about my emotes)
  const emotes = initEmotes(ctx, host, scene,
    (userId) => (userId === store.get().me?.id ? { holder: me.holder, av: me.av } : remotes.get(userId)),
    (id) => { if (!me.transit) { me.path = []; clearPlans(); } ghosts?.noteEmote(id); }); // stop walking to act it out (sitting is fine)
  ctx.provide('world.emote', (id) => emotes.play(id));

  // ---------- together (hugs, hands), dance party, memory ghosts ----------
  // They get a small "world" object instead of poking at everything in this file.
  const world = {
    scene,
    me: () => ({ pos: me.pos, roomId: roomRef?.id, holder: me.holder, av: me.av, sit: me.sit, moving: me.wasMoving, busy: !!me.transit || me.route.length > 0 }),
    remotes: () => remotes,
    toGlobal: (roomId, x, z, y = 0) => (layout?.rooms.has(roomId) ? layout.toGlobal(roomId, x, z, y) : null),
    roomCenter: (roomId) => roomCenter(roomId),
    roomInfo: (roomId) => layout?.rooms.get(roomId),
    bubble: (holder, text) => bubble(holder, text),
    faceRemote: (id) => { const r = remotes.get(id); if (r?.local && !me.sit) me.faceAt = new THREE.Vector3(r.local.x, 0, r.local.z); },
    /** walk to a spot in a room (any room); run = hurry */
    walkTo: (roomId, p, run) => {
      if (!walk || !roomRef) return;
      if (roomId === roomRef.id) { me.path = walk.pathToPoint(me.pos, clampToRoom(new THREE.Vector3(p.x, 0, p.z))) || []; me.run = !!run; }
      else goTo(roomId, { type: 'point', p: new THREE.Vector3(p.x, 0, p.z), run });
    },
  };
  const together = initTogether(ctx, host, world);
  const party = initParty(ctx, world);
  ghosts = initGhosts(ctx, host, world);
  emotes.addAction({ id: 'party', icon: '🪩', label: 'Dance party', short: 'Party', onClick: () => party.toggle() });
  emotes.addAction({ id: 'ghost', icon: '👻', label: 'Memory ghosts', short: 'Ghost', onClick: () => ghosts.openMenu() });
  ctx.provide('world.party', () => party.toggle());

  // Fit the camera so my whole room (floor + wall height) is on screen, for any screen shape and rotation.
  const tmpR = new THREE.Vector3(), tmpU = new THREE.Vector3(), tmpP = new THREE.Vector3();
  function fitDistance() {
    const fwd = camDir.clone().negate();
    tmpR.crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    tmpU.crossVectors(tmpR, fwd);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.8; // leave room for top bar + dock
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect * 0.94;
    let need = 1;
    for (const x of [-1, 1]) for (const z of [-1, 1]) for (const y of [-0.5, 1.6]) {
      tmpP.set(x * bounds.w / 2, y, z * bounds.d / 2);
      const along = tmpP.dot(camDir);
      need = Math.max(need, along + Math.abs(tmpP.dot(tmpR)) / tanH, along + Math.abs(tmpP.dot(tmpU)) / tanV);
    }
    return need;
  }

  // ---------- friends ----------
  // Tap a friend: walk up to them, turn to face them and wave. (In another room: walk there first.)
  function goToFriend(userId) {
    const r = remotes.get(userId); if (!r || !walk) return;
    if (r.roomId !== roomRef.id) { goTo(r.roomId, { type: 'point', p: new THREE.Vector3(r.local.x, 0, r.local.z) }); me.pendingFriend = userId; return; }
    standUp(); clearPlans(); me.run = false;
    const dx = me.pos.x - r.local.x, dz = me.pos.z - r.local.z, len = Math.hypot(dx, dz) || 1;
    const spot = walk.nearestFree(r.local.x + dx / len * 0.9, r.local.z + dz / len * 0.9);
    me.path = walk.pathToPoint(me.pos, spot) || [];
    me.pendingFriend = userId;
  }

  // ---------- pet ----------
  const pet = createPet(scene);
  let lastPetPoints = 0;
  function tapPet() {
    const info = pet.pet(); if (!info) return;
    ui.toast(info.kind === 'cat' ? `${info.name} purrs 💕` : `${info.name} wags happily 🐾`);
    const now = Date.now();
    if (now - lastPetPoints > 10 * 60 * 1000) { lastPetPoints = now; bus.emit('points:award', { amount: 1, reason: `petting ${info.name}` }); }
  }

  // ---------- sitting ----------
  // Tap a seat: walk up to it, then sit on the free spot nearest to where you tapped (point is room-local).
  function trySit(item, point) {
    const def = ctx.use('build.itemDef')(item.kind);
    const slots = seatSlots(item, ctx.use('build.footprint')(item) || [1, 1], bounds);
    const taken = (sl) => [...remotes.values()].some((r) => r.sit && r.roomId === roomRef.id && Math.hypot(r.local.x - sl.x, r.local.z - sl.z) < 0.45);
    const free = slots.filter((sl) => !taken(sl));
    if (!free.length) return ui.toast(`${def?.name || 'That seat'} is taken 😄`);
    free.sort((a, b) => Math.hypot(a.x - point.x, a.z - point.z) - Math.hypot(b.x - point.x, b.z - point.z));
    standUp(); me.pendingSit = null; me.pendingFriend = null; me.faceAt = null; me.run = false;
    me.pendingSit = { item, slot: free[0] };
    me.path = walk ? walk.pathToItem(me.pos, item) || [] : [];
  }
  // Services (also used by the robot test): sit on a seat by its item id (in my room), stand up, ask if I'm sitting.
  ctx.provide('world.sitOn', (itemId) => {
    const item = roomRef?.items.find((i) => i.id === itemId);
    const def = item && ctx.use('build.itemDef')(item.kind);
    if (!isSeat(def)) return false;
    const [fw, fd] = ctx.use('build.footprint')(item) || [1, 1];
    trySit(item, cellToLocal(item.x, item.z, fw, fd));
    return true;
  });
  ctx.provide('world.standUp', () => { clearPlans(); standUp(); });
  ctx.provide('world.isSitting', () => !!me.sit);
  /** Walk to any room of the house (through doorways and up/down the stairs). False if it doesn't exist. */
  ctx.provide('world.goToRoom', (roomId) => (layout?.rooms.has(roomId) ? goTo(roomId, null) : false));
  /** Which floor I'm on (0 = ground floor) and how many floors there are. */
  ctx.provide('world.floor', () => ({ floor: curFloor(), floors: layout?.floors.length || 0, name: layout?.floors[curFloor()]?.name || '' }));

  function startSit() {
    const { slot, item } = me.pendingSit; me.pendingSit = null;
    if (Math.hypot(me.pos.x - slot.x, me.pos.z - slot.z) > 2.6) return ui.toast("Can't reach that seat"); // blocked in
    me.sit = { x: slot.x, z: slot.z, y: slot.y, ry: slot.ry, item: item.id };
    me.pos.set(slot.x, 0, slot.z); me.path = [];
    me.holder.rotation.y = slot.ry;
    setSitting(me.av, true);
    sendPresence(true);
  }
  function standUp() {
    if (!me.sit) return;
    const s = me.sit; me.sit = null;
    setSitting(me.av, false);
    const spot = walk ? walk.nearestFree(s.x + Math.sin(s.ry), s.z + Math.cos(s.ry)) : { x: s.x + Math.sin(s.ry), z: s.z + Math.cos(s.ry) }; // in front of the seat
    me.pos.set(spot.x, 0, spot.z); me.path = [];
    sendPresence(true);
  }

  // Move me to (x, z) if no furniture is there. If blocked, try sliding along it (only x, or only z).
  function stepTo(x, z) {
    const lim = (v, half) => Math.max(-half + 0.3, Math.min(half - 0.3, v));
    x = lim(x, bounds.w / 2); z = lim(z, bounds.d / 2);
    const ok = (px, pz) => !walk || walk.isFreeAt(px, pz) || !walk.isFreeAt(me.pos.x, me.pos.z);
    if (ok(x, z)) { me.pos.x = x; me.pos.z = z; return true; }
    if (ok(x, me.pos.z) && x !== me.pos.x) { me.pos.x = x; return true; }
    if (ok(me.pos.x, z) && z !== me.pos.z) { me.pos.z = z; return true; }
    return false;
  }
  // Keyboard: walking into a doorway (or the balcony door) takes you through it.
  function keyThroughDoor(dir) {
    const c = localToCell(me.pos);
    for (const link of layout.links) {
      const mineA = link.a === roomRef.id, mineB = link.b === roomRef.id;
      if (!mineA && !mineB) continue;
      const cell = mineA ? link.cellA : link.cellB;
      if (cell.x !== c.x || cell.z !== c.z) continue;
      // doorways go right from the left room (a); the balcony door always goes right (out to the balcony)
      const outX = link.type === 'stairs' ? 1 : mineA ? 1 : -1;
      if (dir.x * outX < 0.6) continue;
      if (link.type === 'stairs' && mineB && layout.links.some((l) => l.type === 'stairs' && l.a === roomRef.id)) continue; // prefer going up
      me.route = [{ link, from: roomRef.id, to: mineA ? link.b : link.a }]; me.goal = null;
      startTransit(me.route[0]);
      return true;
    }
    return false;
  }
  // Turn smoothly instead of snapping (takes the short way round).
  function turnToward(obj, angle, dt) {
    let diff = angle - obj.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    obj.rotation.y += diff * Math.min(1, dt * 12);
  }

  // ---------- loop ----------
  const clock = new THREE.Clock();
  const camTarget = new THREE.Vector3();
  const focus = new THREE.Vector3();
  const SPEED = 3.2;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!layout || !roomRef) { renderer.render(scene, camera); return; }
    const k = me.keys;
    const fwdKey = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0);
    const sideKey = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
    let moving = false;
    if (me.transit) {
      // walking through a doorway or round the spiral staircase: follow the exact points
      const tr = me.transit; const p = me.holder.position;
      let step = SPEED * (tr.stairs ? 0.75 : 1) * dt;
      while (step > 0 && tr.i < tr.pts.length) {
        const next = tr.pts[tr.i]; const d = next.clone().sub(p); const len = d.length();
        if (len <= step) { p.copy(next); tr.i++; step -= len; }
        else { p.addScaledVector(d, step / len); step = 0; if (Math.hypot(d.x, d.z) > 0.01) turnToward(me.holder, Math.atan2(d.x, d.z), dt); }
      }
      moving = true;
      if (tr.i >= tr.pts.length) finishTransit();
    } else if ((fwdKey || sideKey) && !ui.isPanelOpen()) {
      // keyboard: W walks AWAY from the camera, whatever way the camera is turned. Shift = run.
      const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
      const kv = new THREE.Vector3(fx * fwdKey - fz * sideKey, 0, fz * fwdKey + fx * sideKey).normalize();
      me.path = []; clearPlans(); standUp();
      me.run = k.has('shift');
      const sp = SPEED * (me.run ? 1.8 : 1);
      if (stepTo(me.pos.x + kv.x * sp * dt, me.pos.z + kv.z * sp * dt)) moving = true;
      else keyThroughDoor(kv);
      turnToward(me.holder, Math.atan2(kv.x, kv.z), dt);
    } else {
      // press and hold: keep re-planning toward the finger
      if (holding && holdPoint && walk) {
        holdRepath -= dt;
        if (holdRepath <= 0) { holdRepath = 0.15; me.path = walk.pathToPoint(me.pos, holdPoint) || []; }
      }
      if (me.path.length) {
        const next = me.path[0];
        const dx = next.x - me.pos.x, dz = next.z - me.pos.z, len = Math.hypot(dx, dz);
        const step = SPEED * (me.run ? 1.8 : 1) * dt;
        if (len <= step) { me.pos.x = next.x; me.pos.z = next.z; me.path.shift(); }
        else { me.pos.x += dx / len * step; me.pos.z += dz / len * step; }
        if (len > 0.001) { turnToward(me.holder, Math.atan2(dx, dz), dt); moving = true; }
      }
    }
    if (!me.path.length && !moving && !me.transit) {
      // arrived: do what I came for
      if (me.pendingSit) startSit();
      else if (me.route.length) startTransit(me.route[0]);
      else if (me.pendingFriend) {
        const r = remotes.get(me.pendingFriend); me.pendingFriend = null;
        if (r && r.roomId === roomRef.id) { me.faceAt = new THREE.Vector3(r.local.x, 0, r.local.z); emotes.play('wave'); }
      }
      if (me.faceAt && !me.sit) turnToward(me.holder, Math.atan2(me.faceAt.x - me.pos.x, me.faceAt.z - me.pos.z), dt);
      if (!holding) me.run = false;
    }
    if (!me.transit) placeHolder();
    if (me.av) animateAvatar(me.av, dt, moving, me.run);
    if (moving && !me.transit) sendPresence();
    else if (me.wasMoving && !me.transit) sendPresence(true);
    me.wasMoving = moving;

    for (const r of remotes.values()) {
      setSitting(r.av, r.sit); // sitting or standing, as they told us
      const d = r.target.clone().sub(r.holder.position);
      const dist = d.length();
      const mv = dist > 0.03;
      if (mv) { r.holder.position.lerp(r.target, Math.min(1, dt * 8)); if (!r.sit && Math.hypot(d.x, d.z) > 0.05) turnToward(r.holder, Math.atan2(d.x, d.z), dt); }
      if (r.sit) turnToward(r.holder, r.ry, dt);
      animateAvatar(r.av, dt, mv && !r.sit, dist > 0.6);
    }

    // walls, tap marker, bouncing furniture, pet, light
    updateVisibility(false);
    if (markerT < 1) { markerT = Math.min(1, markerT + dt * 1.4); marker.material.opacity = 0.9 * (1 - markerT); marker.scale.setScalar(1 + markerT * 0.8); }
    for (const [id, left] of bounces) {
      const mesh = itemMeshes.find((x) => x.userData.itemId === id);
      const t = Math.max(0, left - dt); bounces.set(id, t);
      if (mesh) mesh.scale.setScalar(1 + Math.sin((t / 0.35) * Math.PI) * 0.06);
      if (!t) bounces.delete(id);
    }
    pet.update(dt, { me: { x: me.pos.x, z: me.pos.z, sitting: !!me.sit }, walk, night: lastLight?.night || 0 });
    together.update(dt); party.update(dt); ghosts.update(dt);
    lightCheck -= dt;
    if (lightCheck <= 0) { lightCheck = 30; applyDaylight(); } // the light follows the clock

    // camera: smooth turn toward the chosen angle; look at my room (or at me on the stairs).
    camYaw += (camYawTarget - camYaw) * Math.min(1, dt * 7);
    camDir.set(Math.sin(camYaw) * 0.996, 0.85, Math.cos(camYaw) * 0.996).normalize();
    // At normal zoom the camera looks at the room centre (the whole room fits). Zoomed in, it follows me.
    const follow = me.transit ? 1 : 0.15 + 0.85 * Math.min(1, Math.max(0, (1 - zoom) / (1 - ZOOM_MIN)));
    const c = roomCenter(roomRef.id);
    focus.set(c.x + (me.holder.position.x - c.x) * follow, (me.transit ? me.holder.position.y : c.y) + 0.5, c.z + (me.holder.position.z - c.z) * follow);
    camTarget.lerp(focus, Math.min(1, dt * (me.transit ? 6 : 4)));
    const dist = fitDistance() * zoom;
    camera.position.copy(camTarget).addScaledVector(camDir, dist);
    camera.lookAt(camTarget);
    // the sun's shadows follow the camera, so the whole building can have shadows
    sun.position.copy(camTarget).add(new THREE.Vector3(6, 12, 8)); sun.target.position.copy(camTarget);
    renderer.render(scene, camera);
  });

  // ---------- react to state ----------
  const fade = ui.h('div', { style: { position: 'absolute', inset: '0', background: '#fff8ef', opacity: '0', pointerEvents: 'none', transition: 'opacity .25s' } });
  host.append(fade);
  store.subscribe((s, prev) => {
    if (s.me !== prev.me && (s.me?.avatar !== prev.me?.avatar || s.me?.username !== prev.me?.username)) { rebuildMyAvatar(); sendPresence(true); }
    if (s.house !== prev.house) pet.setHouse(s.house); // before the room, so spawn() can place the pet
    if (s.house?.id !== prev.house?.id) { ghosts.stop(); together.letGo(); if (s.house) ghosts.load().then(() => ghosts.lookForGhost()); }
    if (!s.house) {
      if (houseGroup) { scene.remove(houseGroup); houseGroup = null; layout = null; roomRef = null; walk = null; rooms.clear(); }
    } else {
      const room = currentRoom(s);
      const firstTime = !layout;
      if (s.house !== prev.house || !layout) {
        // the house changed (or we just came in): rebuild the building, keep my spot if my room is still there
        const keep = !firstTime && room && roomRef?.id === room.id;
        buildHouse(s.house);
        if (room) {
          enterRoom(room);
          if (keep) {
            if (me.path.length && walk) me.path = walk.pathToPoint(me.pos, me.path[me.path.length - 1]) || []; // furniture moved: re-plan
            if (me.sit && !room.items.some((i) => i.id === me.sit.item)) standUp(); // my seat was removed
            if (walk && !walk.isFreeAt(me.pos.x, me.pos.z)) { const f = walk.nearestFree(me.pos.x, me.pos.z); me.pos.set(f.x, 0, f.z); }
          } else spawn();
        }
      } else if (room && room.id !== roomRef?.id) {
        enterRoom(room);
        if (!movingSelf) { // a jump (room tabs, Pip's tour, the robot): a quick fade, then appear at the door
          fade.style.transition = 'none'; fade.style.opacity = '1';
          requestAnimationFrame(() => { fade.style.transition = 'opacity .35s'; fade.style.opacity = '0'; });
          spawn();
        }
      }
    }
    if (s.players !== prev.players) syncRemotes();
    if (s.mode === 'build' && prev.mode !== 'build') { clearPlans(); standUp(); emotes.close(); me.transit = null; } // building: get off the sofa
    if (s.mode !== prev.mode) updateVisibility(true);
    rotateBtn.style.display = s.house ? 'block' : 'none';
    emotes.button.style.display = s.house && s.mode !== 'build' ? 'block' : 'none';
    floorUi.render();
  });

  bus.on('room:goto', ({ roomId }) => { store.set({ roomId }); });
  rebuildMyAvatar();

  initWardrobe(ctx);
}
