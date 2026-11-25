// WORLD AREA - entry point. Owner: World.
// The 3D scene: room rendering, camera, my avatar, other players, tapping and walking.
// Furniture meshes come from the Building area through ctx.use('build.itemMesh').
//
// How you move (phone first):
//   tap the floor = walk there        double-tap = run there      press and hold = walk after your finger
//   tap furniture = walk up and use it    tap a seat = sit    tap a friend = go say hi (you wave)
//   tap a door = walk into that room      tap the pet = pet it    pinch / mouse wheel = zoom
//   keyboard: WASD / arrows walk (Shift runs), Q / E turn the camera, 1-7 emotes
// Extra pieces live in their own files: doors.js, daylight.js (windows + time of day), pet.js, emotes.js.

import * as THREE from 'three';
import { buildAvatar, animateAvatar, setSitting, nameTag, randomAppearance, playEmote } from './avatar.js';
import { isSeat, seatSlots } from './seats.js';
import { initWardrobe } from './wardrobe.js';
import { makeWalkGrid } from './walkGrid.js';
import { buildDoors, updateDoors } from './doors.js';
import { buildDaylight, updateWindows, lightAt } from './daylight.js';
import { createPet } from './pet.js';
import { initEmotes } from './emotes.js';
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
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  const hemi = new THREE.HemisphereLight('#ffffff', '#b9a48a', 1.4);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3df', 1.6);
  sun.position.set(6, 12, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 });
  scene.add(sun);

  function resize() {
    const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  // ---------- room ----------
  let roomGroup = null; let roomRef = null; let floorMesh = null; let grid = null;
  const itemMeshes = []; // for tapping
  let bounds = { w: 8, d: 8 };
  let walk = null; // walk grid: where furniture is, and paths around it (walkGrid.js)
  let walls = [];  // { group, out: [x, z] } - the side of the room each wall is on
  let doors = [];  // doors to the other rooms (doors.js)
  let doorTargets = []; // meshes you can tap to use a door
  let daylight = null;  // windows + night lights (daylight.js)
  let windows = [];

  const cellToWorld = (x, z, sw = 1, sd = 1) => new THREE.Vector3(x + sw / 2 - bounds.w / 2, 0, z + sd / 2 - bounds.d / 2);
  const worldToCell = (p) => ({ x: Math.floor(p.x + bounds.w / 2), z: Math.floor(p.z + bounds.d / 2) });

  function buildRoom(room) {
    if (roomGroup) scene.remove(roomGroup);
    itemMeshes.length = 0;
    roomGroup = new THREE.Group(); roomRef = room;
    const [w, d] = room.size; bounds = { w, d };
    const t = room.theme;
    // floor: checker tiles
    const cv = document.createElement('canvas'); cv.width = w * 32; cv.height = d * 32;
    const g = cv.getContext('2d');
    const c1 = new THREE.Color(t.floor), c2 = c1.clone().offsetHSL(0, 0, -0.04);
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { g.fillStyle = '#' + ((i + j) % 2 ? c1 : c2).getHexString(); g.fillRect(i * 32, j * 32, 32, 32); }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
    floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), [null, null, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), null, null, null].map((x) => x || new THREE.MeshStandardMaterial({ color: c2 })));
    floorMesh.position.y = -0.1; floorMesh.receiveShadow = true; roomGroup.add(floorMesh);
    // Four walls, but only the two FAR from the camera are shown (cut-away, like The Sims).
    // When you rotate the camera, updateWalls() swaps which ones are visible.
    const wallMat = new THREE.MeshStandardMaterial({ color: t.wall, roughness: 0.95 });
    const trim = new THREE.MeshStandardMaterial({ color: new THREE.Color(t.wall).offsetHSL(0, 0, -0.18) });
    walls = [];
    const addWall = (out, len, x, z, alongX) => {
      const g = new THREE.Group(); g.position.set(x, 0, z);
      const wall = new THREE.Mesh(alongX ? new THREE.BoxGeometry(len, 2.6, 0.2) : new THREE.BoxGeometry(0.2, 2.6, len), wallMat);
      wall.position.y = 1.3; wall.receiveShadow = true;
      const base = new THREE.Mesh(alongX ? new THREE.BoxGeometry(len + 0.02, 0.18, 0.24) : new THREE.BoxGeometry(0.24, 0.18, len + 0.02), trim);
      base.position.y = 0.09;
      g.add(wall, base); roomGroup.add(g); walls.push({ group: g, out });
    };
    addWall([0, -1], w + 0.4, 0, -d / 2 - 0.1, true);  // back
    addWall([0, 1], w + 0.4, 0, d / 2 + 0.1, true);    // front
    addWall([-1, 0], d, -w / 2 - 0.1, 0, false);       // left
    addWall([1, 0], d, w / 2 + 0.1, 0, false);         // right
    walk = makeWalkGrid(room, ctx.use('build.footprint'), ctx.use('build.itemDef'));
    // doors to the other rooms, then windows + lamps that glow at night
    const dr = buildDoors(room, store.get().house, walk);
    doors = dr.doors; doorTargets = dr.tapTargets; roomGroup.add(dr.group);
    daylight = buildDaylight(room, walk, doors.map((x) => x.cell), cellToWorld, ctx.use('build.footprint'));
    windows = daylight.windows; roomGroup.add(daylight.group);
    applyDaylight(true);
    // items
    for (const item of room.items) {
      const mesh = ctx.use('build.itemMesh')(item, t);
      if (!mesh) continue;
      const [sw, sd] = ctx.use('build.footprint')(item) || [1, 1];
      mesh.position.copy(cellToWorld(item.x, item.z, sw, sd));
      mesh.rotation.y = -item.rot * Math.PI / 2;
      mesh.traverse((o) => { o.userData.itemId = item.id; });
      roomGroup.add(mesh); itemMeshes.push(mesh);
    }
    grid = new THREE.GridHelper(Math.max(w, d), Math.max(w, d), '#ffffff', '#ffffff');
    grid.material.opacity = 0.35; grid.material.transparent = true; grid.position.y = 0.01;
    grid.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    grid.visible = store.get().mode === 'build';
    roomGroup.add(grid);
    scene.add(roomGroup);
    updateWalls();
    // furniture may have moved: re-plan my walk around the new layout
    if (me.path.length) me.path = walk.pathToPoint(me.pos, me.path[me.path.length - 1]) || [];
    if (me.sit && !room.items.some((i) => i.id === me.sit.item)) standUp(); // my seat was removed
    syncRemotes();
  }

  // ---------- time of day ----------
  // ?hour=21 in the address bar shows the room at 9 pm (handy for testing).
  const forcedHour = Number(new URLSearchParams(location.search).get('hour'));
  let lastLight = null; let lightCheck = 0;
  function applyDaylight(force) {
    const d = new Date();
    const hour = Number.isFinite(forcedHour) && new URLSearchParams(location.search).has('hour') ? forcedHour : d.getHours() + d.getMinutes() / 60;
    const light = lightAt(hour);
    lastLight = light;
    hemi.intensity = light.hemi; sun.intensity = light.sunI; sun.color.copy(light.sun);
    const wallCol = new THREE.Color(roomRef?.theme?.wall || '#f4efe6');
    scene.background = wallCol.lerp(light.sky, 0.6);
    daylight?.update(light);
    if (force) lightCheck = 0;
  }

  // ---------- my avatar ----------
  // path = list of {x, z} points still to walk through (from the walk grid)
  // run: this walk is a run (double-tap / Shift). faceAt: turn to look at this spot when I stop.
  // pendingDoor / pendingFriend: what to do when I arrive. transit: walking through a door right now.
  const me = { holder: new THREE.Group(), av: null, path: [], pos: new THREE.Vector3(0, 0, 2), moving: false, keys: new Set(), sit: null, pendingSit: null,
    run: false, faceAt: null, pendingDoor: null, pendingFriend: null, transit: null };
  let arrivingFrom = null; // the room I just came from through a door: spawn at its door
  const clearPlans = () => { me.pendingSit = null; me.pendingDoor = null; me.pendingFriend = null; me.faceAt = null; };
  scene.add(me.holder);
  function rebuildMyAvatar() {
    const s = store.get();
    if (me.av) me.holder.clear();
    me.av = buildAvatar(s.me?.avatar || randomAppearance());
    me.holder.add(me.av, nameTag(s.me?.username || 'me', '#ffe08a'));
    if (me.sit) setSitting(me.av, true); // a new outfit while sitting: stay seated
  }
  function spawn() {
    if (me.sit) { me.sit = null; if (me.av) setSitting(me.av, false); me.holder.position.y = 0; }
    clearPlans(); me.transit = null;
    const back = arrivingFrom && doors.find((x) => x.toRoomId === arrivingFrom);
    arrivingFrom = null;
    if (back) {
      // came through a door: stand just inside the door that leads back, which swings shut behind me
      me.pos.set(back.spot.x, 0, back.spot.z);
      me.holder.rotation.y = back.ry;
      back.open = 1; back.openTarget = 0;
    } else {
      me.pos.set((Math.random() - 0.5) * Math.min(4, bounds.w - 2), 0, bounds.d / 2 - 1 - Math.random());
      const free = walk ? walk.nearestFree(me.pos.x, me.pos.z) : me.pos; // never spawn inside furniture
      me.pos.set(free.x, 0, free.z);
    }
    me.path = [];
    me.holder.position.copy(me.pos);
    pet.place(walk, me.pos);
    sendPresence(true);
  }

  // ---------- other players ----------
  const remotes = new Map(); // userId -> { holder, av, pos, target, avatarKey }
  function syncRemotes() {
    const s = store.get();
    const here = s.players.filter((p) => p.roomId === s.roomId);
    const ids = new Set(here.map((p) => p.userId));
    for (const [id, r] of remotes) if (!ids.has(id)) { scene.remove(r.holder); remotes.delete(id); }
    for (const p of here) {
      let r = remotes.get(p.userId);
      const key = JSON.stringify(p.avatar || {}) + p.name;
      if (!r || r.key !== key) {
        if (r) scene.remove(r.holder);
        const holder = new THREE.Group();
        const av = buildAvatar(p.avatar || randomAppearance());
        holder.add(av, nameTag(p.name || 'friend'));
        holder.position.set(p.x ?? 0, 0, p.z ?? 0);
        scene.add(holder);
        r = { holder, av, key, target: new THREE.Vector3(p.x ?? 0, 0, p.z ?? 0), bubble: null, sit: false, ry: 0 };
        remotes.set(p.userId, r);
      }
      r.sit = !!p.sit; r.ry = p.ry || 0;
      r.target.set(p.x ?? 0, r.sit ? (p.sy || 0) : 0, p.z ?? 0);
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

  // ---------- input: tap / click / pinch ----------
  // Pointer events cover mouse, pen and fingers. A "tap" is a quick press that didn't
  // move much AND never had a second finger: so pinching to zoom never makes you walk.
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  const pointers = new Map(); // finger id -> {x, y}
  let down = null;            // where the first finger went down
  let gesture = false;        // true once a second finger joined (pinch), until all fingers lift
  let pinch0 = null;          // { d: finger distance, z: zoom } when the pinch started
  let zoom = 1;               // 1 = whole room fits; smaller = closer
  const ZOOM_MIN = 0.45, ZOOM_MAX = 1.3;
  const clampZoom = (z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
  const fingerGap = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
  const cv = renderer.domElement;

  // Press and hold (one finger, in play mode) = "walk after my finger" until you let go.
  let holdTimer = null; let holding = false; let holdPoint = null; let holdRepath = 0;
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function floorPointAt(clientX, clientY) {
    const rect = cv.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const p = new THREE.Vector3();
    return ray.ray.intersectPlane(floorPlane, p) ? clampToRoom(p) : null;
  }
  const stopHold = () => { clearTimeout(holdTimer); holdTimer = null; holding = false; };

  cv.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      down = { x: e.clientX, y: e.clientY }; gesture = false;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (pointers.size !== 1 || gesture || store.get().mode !== 'play' || ui.isPanelOpen() || me.transit) return;
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
    // moved a lot before the hold started: it's a drag, not a hold
    else if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) { clearTimeout(holdTimer); holdTimer = null; }
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

  let lastFloorTap = { t: 0, x: 0, y: 0 }; // for double-tap = run
  function handleTap(e) {
    const rect = cv.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const room = currentRoom(store.get());
    if (!room) return;
    const playing = store.get().mode === 'play';
    if (me.transit) return; // already walking through a door

    if (playing) {
      // 1. the pet
      const petHit = pet.mesh && ray.intersectObject(pet.mesh, true)[0];
      // 2. a friend's avatar
      const friendHits = ray.intersectObjects([...remotes.values()].map((r) => r.av), true);
      // 3. a door, its mat or its sign
      const doorHit = ray.intersectObjects(doorTargets, true).find((hit) => hit.object.visible && hit.object.userData.doorTo && isShown(hit.object));
      const nearest = [petHit && { kind: 'pet', d: petHit.distance }, friendHits[0] && { kind: 'friend', d: friendHits[0].distance, hit: friendHits[0] },
        doorHit && { kind: 'door', d: doorHit.distance - 0.5, hit: doorHit }].filter(Boolean).sort((a, b) => a.d - b.d)[0];
      if (nearest?.kind === 'pet') { tapPet(); return; }
      if (nearest?.kind === 'door') { goToDoor(doors.find((x) => x.toRoomId === nearest.hit.object.userData.doorTo)); return; }
      if (nearest?.kind === 'friend') {
        const id = [...remotes.entries()].find(([, r]) => isInside(nearest.hit.object, r.av))?.[0];
        if (id) { goToFriend(id); return; }
      }
    }

    const hitItem = ray.intersectObjects(itemMeshes, true)[0];
    if (hitItem) {
      const item = room.items.find((i) => i.id === hitItem.object.userData.itemId);
      const cell = worldToCell(hitItem.point);
      bus.emit('world:tap', { target: 'item', item, cell, room });
      if (playing && item) {
        const def = ctx.use('build.itemDef')(item.kind);
        if (isSeat(def)) { trySit(item, hitItem.point); return; } // sofas, chairs...: walk over and sit
        standUp(); clearPlans(); me.run = false;
        if (walk) me.path = walk.pathToItem(me.pos, item) || []; // walk up next to it
        const [fw, fd] = ctx.use('build.footprint')(item) || [1, 1];
        me.faceAt = cellToWorld(item.x, item.z, fw, fd); // and turn to look at it
        bounceItem(item.id);
        bus.emit('item:activate', { item, room });
      }
      return;
    }
    const hitFloor = floorMesh && ray.intersectObject(floorMesh)[0];
    if (hitFloor) {
      const cell = worldToCell(hitFloor.point);
      bus.emit('world:tap', { target: 'floor', cell, room });
      if (playing && walk) {
        const now = performance.now();
        const dbl = now - lastFloorTap.t < 350 && Math.hypot(e.clientX - lastFloorTap.x, e.clientY - lastFloorTap.y) < 40;
        lastFloorTap = { t: dbl ? 0 : now, x: e.clientX, y: e.clientY };
        standUp(); clearPlans();
        me.run = dbl; // double-tap = run
        me.path = walk.pathToPoint(me.pos, clampToRoom(hitFloor.point.clone().setY(0))) || [];
        if (me.path.length) showMarker(me.path[me.path.length - 1], dbl);
      }
    }
  }
  const isInside = (obj, root) => { for (let o = obj; o; o = o.parent) if (o === root) return true; return false; };
  const isShown = (obj) => { for (let o = obj; o; o = o.parent) if (!o.visible) return false; return true; };

  // A ring on the floor where you're walking to (orange when running).
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.28, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  marker.rotation.x = -Math.PI / 2; marker.position.y = 0.03; marker.renderOrder = 2; scene.add(marker);
  let markerT = 1;
  function showMarker(p, run) { marker.position.set(p.x, 0.03, p.z); marker.material.color.set(run ? '#ffb35c' : '#ffffff'); markerT = 0; }

  // A tapped piece of furniture does a little bounce, so you see what you tapped.
  const bounces = new Map(); // itemId -> seconds left
  const bounceItem = (id) => bounces.set(id, 0.35);

  // ---------- doors ----------
  function goToDoor(door) {
    if (!door) return;
    standUp(); clearPlans(); me.run = false;
    me.pendingDoor = door;
    me.path = walk ? walk.pathToCell(me.pos, door.cell) || [] : [];
    if (me.path.length) showMarker(me.path[me.path.length - 1], false);
  }
  // At the door: it swings open, I step through, the screen fades and the next room appears.
  function startTransit(door) {
    me.pendingDoor = null; me.path = [];
    door.openTarget = 1;
    me.transit = { door, t: 0, switched: false };
  }
  const fade = ui.h('div', { style: { position: 'absolute', inset: '0', background: '#fff8ef', opacity: '0', pointerEvents: 'none', transition: 'opacity .25s' } });
  host.append(fade);
  /** Service + robot test: walk to the door of a room and go through it. Returns false if there is no such door. */
  ctx.provide('world.goToRoom', (roomId) => { const d = doors.find((x) => x.toRoomId === roomId); if (!d) return false; goToDoor(d); return true; });

  // ---------- friends ----------
  // Tap a friend: walk up to them, turn to face them and wave.
  function goToFriend(userId) {
    const r = remotes.get(userId); if (!r || !walk) return;
    standUp(); clearPlans(); me.run = false;
    const p = r.holder.position;
    const dx = me.pos.x - p.x, dz = me.pos.z - p.z, len = Math.hypot(dx, dz) || 1;
    const spot = walk.nearestFree(p.x + dx / len * 0.9, p.z + dz / len * 0.9);
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

  const clampToRoom = (p) => { p.x = Math.max(-bounds.w / 2 + 0.3, Math.min(bounds.w / 2 - 0.3, p.x)); p.z = Math.max(-bounds.d / 2 + 0.3, Math.min(bounds.d / 2 - 0.3, p.z)); return p; };

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
  // The camera looks at the room from one corner. Each tap on the button turns it 90°.
  const BASE_YAW = Math.atan2(0.62, 0.78); // the original Sims-style angle
  let camYaw = BASE_YAW, camYawTarget = BASE_YAW;
  const camDir = new THREE.Vector3(0.62, 0.85, 0.78).normalize(); // from the room toward the camera
  function rotateCamera(steps = 1) { camYawTarget += steps * Math.PI / 2; }
  function updateWalls() {
    // show a wall only if it's on the far side (the camera is on the other side)
    for (const wl of walls) wl.group.visible = wl.out[0] * camDir.x + wl.out[1] * camDir.z < 0.05;
  }
  const rotateBtn = ui.h('button', {
    'aria-label': 'Rotate camera', title: 'Rotate camera (Q / E)',
    style: {
      position: 'absolute', right: '12px', bottom: 'calc(env(safe-area-inset-bottom) + 96px)',
      width: '52px', height: '52px', borderRadius: '50%', border: 'none', fontSize: '24px',
      background: 'rgba(255,250,243,.95)', boxShadow: 'var(--shadow, 0 4px 16px rgba(0,0,0,.15))',
      cursor: 'pointer', display: 'none', touchAction: 'manipulation',
    },
    onclick: () => rotateCamera(1),
  }, '⟳');
  host.append(rotateBtn);

  // ---------- emotes ----------
  const emotes = initEmotes(ctx, host, scene,
    (userId) => (userId === store.get().me?.id ? { holder: me.holder, av: me.av } : remotes.get(userId)),
    () => { me.path = []; clearPlans(); }); // stop walking to act it out (sitting is fine)
  ctx.provide('world.emote', (id) => emotes.play(id));

  // Fit the camera so the whole room (floor + wall height) is on screen, for any screen
  // shape and any rotation. For each corner we check how far back the camera must be.
  const tmpR = new THREE.Vector3(), tmpU = new THREE.Vector3(), tmpP = new THREE.Vector3();
  function fitDistance() {
    const fwd = camDir.clone().negate();
    tmpR.crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    tmpU.crossVectors(tmpR, fwd);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.8; // leave room for top bar + dock
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect * 0.94;
    let need = 1;
    for (const x of [-1, 1]) for (const z of [-1, 1]) for (const y of [-0.5, 1.6]) {
      tmpP.set(x * bounds.w / 2, y, z * bounds.d / 2); // corner, relative to the look-at point
      const along = tmpP.dot(camDir);
      need = Math.max(need, along + Math.abs(tmpP.dot(tmpR)) / tanH, along + Math.abs(tmpP.dot(tmpU)) / tanV);
    }
    return need;
  }

  // ---------- sitting ----------
  // Tap a seat: walk up to it, then sit on the free spot nearest to where you tapped.
  // Tap the floor or press a move key to stand up. Others see it through presence (sit / sy / ry).
  function trySit(item, point) {
    const def = ctx.use('build.itemDef')(item.kind);
    const slots = seatSlots(item, ctx.use('build.footprint')(item) || [1, 1], bounds);
    const taken = (sl) => [...remotes.values()].some((r) => r.sit && Math.hypot(r.target.x - sl.x, r.target.z - sl.z) < 0.45);
    const free = slots.filter((sl) => !taken(sl));
    if (!free.length) return ui.toast(`${def?.name || 'That seat'} is taken 😄`);
    free.sort((a, b) => Math.hypot(a.x - point.x, a.z - point.z) - Math.hypot(b.x - point.x, b.z - point.z));
    standUp(); clearPlans(); me.run = false;
    me.pendingSit = { item, slot: free[0] };
    me.path = walk ? walk.pathToItem(me.pos, item) || [] : [];
  }
  // Services (also used by the robot test): sit on a seat by its item id, stand up, ask if I'm sitting.
  ctx.provide('world.sitOn', (itemId) => {
    const room = currentRoom(store.get());
    const item = room?.items.find((i) => i.id === itemId);
    const def = item && ctx.use('build.itemDef')(item.kind);
    if (!isSeat(def)) return false;
    const [fw, fd] = ctx.use('build.footprint')(item) || [1, 1];
    const c = cellToWorld(item.x, item.z, fw, fd);
    trySit(item, c);
    return true;
  });
  ctx.provide('world.standUp', () => { clearPlans(); standUp(); });
  ctx.provide('world.isSitting', () => !!me.sit);
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
    setSitting(me.av, false); me.holder.position.y = 0;
    const spot = walk ? walk.nearestFree(s.x + Math.sin(s.ry), s.z + Math.cos(s.ry)) : { x: s.x + Math.sin(s.ry), z: s.z + Math.cos(s.ry) }; // the spot in front of the seat
    me.pos.set(spot.x, 0, spot.z); me.path = [];
    sendPresence(true);
  }

  // Move me to (x, z) if no furniture is there. If blocked, try sliding along it
  // (only x, or only z), so you glide along a sofa instead of getting stuck.
  // If I'm already standing inside furniture (someone built on me), let me walk out.
  function stepTo(x, z) {
    const lim = (v, half) => Math.max(-half + 0.3, Math.min(half - 0.3, v));
    x = lim(x, bounds.w / 2); z = lim(z, bounds.d / 2);
    const ok = (px, pz) => !walk || walk.isFreeAt(px, pz) || !walk.isFreeAt(me.pos.x, me.pos.z);
    if (ok(x, z)) { me.pos.x = x; me.pos.z = z; return true; }
    if (ok(x, me.pos.z) && x !== me.pos.x) { me.pos.x = x; return true; }
    if (ok(me.pos.x, z) && z !== me.pos.z) { me.pos.z = z; return true; }
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
  const SPEED = 3.2;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    // keyboard: W walks AWAY from the camera, whatever way the camera is turned. Shift = run.
    const k = me.keys;
    const fwdKey = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0);
    const sideKey = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
    let moving = false;
    if (me.transit) {
      // walking through a door: step into the doorway, fade out, switch room
      const tr = me.transit; tr.t += dt;
      if (tr.t > 0.2) { me.pos.x += tr.door.out[0] * dt * 1.6; me.pos.z += tr.door.out[1] * dt * 1.6; moving = true; turnToward(me.holder, Math.atan2(tr.door.out[0], tr.door.out[1]), dt); }
      if (tr.t > 0.25) fade.style.opacity = '1';
      if (tr.t > 0.55 && !tr.switched) {
        tr.switched = true;
        arrivingFrom = roomRef?.id;
        bus.emit('room:goto', { roomId: tr.door.toRoomId }); // spawn() puts me at the door back
        setTimeout(() => { fade.style.opacity = '0'; }, 60);
        me.transit = null;
      }
    } else if ((fwdKey || sideKey) && !ui.isPanelOpen()) {
      const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw); // forward on the floor
      const kv = new THREE.Vector3(fx * fwdKey - fz * sideKey, 0, fz * fwdKey + fx * sideKey).normalize();
      me.path = []; clearPlans(); standUp();
      me.run = k.has('shift');
      const sp = SPEED * (me.run ? 1.8 : 1);
      if (stepTo(me.pos.x + kv.x * sp * dt, me.pos.z + kv.z * sp * dt)) moving = true;
      turnToward(me.holder, Math.atan2(kv.x, kv.z), dt);
    } else {
      // press and hold: keep re-planning toward the finger
      if (holding && holdPoint && walk) {
        holdRepath -= dt;
        if (holdRepath <= 0) { holdRepath = 0.15; me.path = walk.pathToPoint(me.pos, holdPoint) || []; }
      }
      if (me.path.length) {
        // tap-to-walk: follow the path point by point
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
      else if (me.pendingDoor) {
        const dr = me.pendingDoor;
        if (Math.hypot(me.pos.x - dr.spot.x, me.pos.z - dr.spot.z) < 1.2 || !walk?.pathToCell(me.pos, dr.cell)) startTransit(dr);
        else me.pendingDoor = null;
      } else if (me.pendingFriend) {
        const r = remotes.get(me.pendingFriend); me.pendingFriend = null;
        if (r) { me.faceAt = r.holder.position.clone(); emotes.play('wave'); }
      }
      if (me.faceAt && !me.sit) turnToward(me.holder, Math.atan2(me.faceAt.x - me.pos.x, me.faceAt.z - me.pos.z), dt);
      if (!holding) me.run = false;
    }
    me.holder.position.copy(me.pos);
    if (me.sit) me.holder.position.y = me.sit.y;
    if (me.av) animateAvatar(me.av, dt, moving, me.run);
    if (moving) sendPresence();
    else if (me.wasMoving) sendPresence(true);
    me.wasMoving = moving;

    for (const r of remotes.values()) {
      setSitting(r.av, r.sit); // sitting or standing, as they told us
      const d = r.target.clone().sub(r.holder.position);
      const dist = d.length();
      const mv = dist > 0.03;
      if (mv) { r.holder.position.lerp(r.target, Math.min(1, dt * 8)); if (!r.sit && dist > 0.05) turnToward(r.holder, Math.atan2(d.x, d.z), dt); }
      if (r.sit) turnToward(r.holder, r.ry, dt);
      animateAvatar(r.av, dt, mv && !r.sit, dist > 0.6);
    }

    // doors, tap marker, bouncing furniture, pet
    updateDoors(doors, dt, camDir);
    updateWindows(windows, camDir);
    if (markerT < 1) { markerT = Math.min(1, markerT + dt * 1.4); marker.material.opacity = 0.9 * (1 - markerT); marker.scale.setScalar(1 + markerT * 0.8); }
    for (const [id, left] of bounces) {
      const mesh = itemMeshes.find((x) => x.userData.itemId === id);
      const t = Math.max(0, left - dt); bounces.set(id, t);
      if (mesh) mesh.scale.setScalar(1 + Math.sin((t / 0.35) * Math.PI) * 0.06);
      if (!t) bounces.delete(id);
    }
    pet.update(dt, { me: { x: me.pos.x, z: me.pos.z, sitting: !!me.sit }, walk, night: lastLight?.night || 0 });
    lightCheck -= dt;
    if (lightCheck <= 0) { lightCheck = 30; applyDaylight(); } // the light follows the clock

    // camera: smooth turn toward the chosen angle, then fit the room on screen.
    camYaw += (camYawTarget - camYaw) * Math.min(1, dt * 7);
    camDir.set(Math.sin(camYaw) * 0.996, 0.85, Math.cos(camYaw) * 0.996).normalize();
    updateWalls();
    // At normal zoom the camera looks at the room centre (the whole room fits).
    // Zoomed in, it follows me more, so I never walk off screen.
    const follow = 0.15 + 0.85 * Math.min(1, Math.max(0, (1 - zoom) / (1 - ZOOM_MIN)));
    camTarget.lerp(new THREE.Vector3(me.pos.x * follow, 0.5, me.pos.z * follow), Math.min(1, dt * 4));
    const dist = fitDistance() * zoom;
    camera.position.copy(camTarget).addScaledVector(camDir, dist);
    camera.lookAt(camTarget);
    renderer.render(scene, camera);
  });

  // ---------- react to state ----------
  store.subscribe((s, prev) => {
    if (s.me !== prev.me && (s.me?.avatar !== prev.me?.avatar || s.me?.username !== prev.me?.username)) { rebuildMyAvatar(); sendPresence(true); }
    if (s.house !== prev.house) pet.setHouse(s.house); // before the room, so spawn() can place the pet
    const room = currentRoom(s);
    if (room && (room !== roomRef)) {
      const changedRoom = !roomRef || room.id !== roomRef.id;
      buildRoom(room);
      if (changedRoom) spawn();
    }
    if (!room && roomGroup) { scene.remove(roomGroup); roomGroup = null; roomRef = null; }
    if (s.players !== prev.players) syncRemotes();
    if (s.mode === 'build' && prev.mode !== 'build') { clearPlans(); standUp(); emotes.close(); } // building: get off the sofa
    if (grid && s.mode !== prev.mode) grid.visible = s.mode === 'build';
    rotateBtn.style.display = s.house ? 'block' : 'none';
    emotes.button.style.display = s.house && s.mode !== 'build' ? 'block' : 'none';
  });

  bus.on('room:goto', ({ roomId }) => { store.set({ roomId }); });
  rebuildMyAvatar();

  initWardrobe(ctx);
}
