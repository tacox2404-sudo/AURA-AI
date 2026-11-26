// ROOFTOP + ELEVATOR (owned by World): the fun things on top of the building.
//
//   - 🔭 Telescope: walk up to it and look through: at night a sky full of twinkling stars and
//     constellations, with shooting stars (make a wish!); by day, clouds and birds.
//   - 🎆 Fireworks crate: walk up to it and launch a fireworks show above the building. Everyone in
//     the house sees it (live event 'fireworks').
//   - 🛁 Hot tub and loungers: walk up and sit in / lie on them (index.js does the sitting).
//   - String lights round the roof that glow at night.
//   - 🛗 Glass elevator: tap it to pick a floor (or the roof); your avatar walks in and rides.
// The rooftop itself (deck, railing, these things) is drawn in building.js.

import * as THREE from 'three';

const COLORS = ['#ff4fa3', '#4fd1ff', '#ffd23f', '#7cff6b', '#b388ff', '#ff8a3d'];

export function createRooftop(ctx, host, world) {
  const { ui, bus, store } = ctx; const { h } = ui;
  const shows = []; // fireworks rockets and bursts in the sky right now
  // one shared flash light for all bursts (adding/removing lights makes phones stutter)
  const flash = new THREE.PointLight('#ffffff', 0, 30, 1.5); world.scene.add(flash);
  let lastPoints = 0;

  // ---------- telescope ----------
  function openTelescope() {
    const night = world.night() > 0.5;
    const cv = h('canvas', { width: 360, height: 360, style: { width: 'min(86vw, 360px)', height: 'min(86vw, 360px)', borderRadius: '50%', boxShadow: '0 0 0 9999px rgba(10,8,20,.92), 0 0 40px rgba(0,0,0,.6)' } });
    const note = h('div', { style: { color: '#fff', fontWeight: '700', marginTop: '18px', textAlign: 'center', padding: '0 16px' } },
      night ? 'Look for a shooting star ✨' : 'Too bright for stars, come back tonight 🌙');
    const layer = h('div', { style: { position: 'absolute', inset: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: '20', cursor: 'pointer' },
      onclick: () => { stop = true; layer.remove(); } }, cv, note, h('div', { style: { color: '#bbb', fontSize: '13px', marginTop: '8px' } }, 'Tap to stop looking'));
    host.append(layer);
    const g = cv.getContext('2d');
    const stars = Array.from({ length: 160 }, () => [Math.random() * 360, Math.random() * 360, Math.random() * 1.6 + 0.4, Math.random() * 6]);
    // two little constellations: the Plough and a heart (for Love Nest houses)
    const love = store.get().house?.type === 'love';
    const shape = love ? [[150, 120], [125, 95], [100, 115], [150, 180], [200, 115], [175, 95], [150, 120]] : [[80, 100], [120, 110], [160, 125], [195, 150], [200, 200], [255, 205], [260, 160], [195, 150]];
    let stop = false; let shooting = null; let wished = false; const t0 = performance.now();
    const birds = Array.from({ length: 5 }, (_, i) => [Math.random() * 360, 120 + i * 30, 0.5 + Math.random()]);
    const draw = () => {
      if (stop) return;
      const t = (performance.now() - t0) / 1000;
      if (night) {
        g.fillStyle = '#0b1030'; g.fillRect(0, 0, 360, 360);
        for (const [x, y, r, k] of stars) { g.fillStyle = `rgba(255,255,235,${0.45 + 0.55 * Math.abs(Math.sin(t * 1.3 + k))})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
        g.strokeStyle = love ? 'rgba(255,140,190,.55)' : 'rgba(190,210,255,.45)'; g.lineWidth = 1.5; g.beginPath();
        shape.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
        g.fillStyle = '#fff'; for (const [x, y] of shape) { g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill(); }
        if (!shooting && Math.random() < 0.012) shooting = { x: 40 + Math.random() * 200, y: 20 + Math.random() * 120, t: 0 };
        if (shooting) {
          shooting.t += 1 / 60; const k = shooting.t / 0.7;
          const x = shooting.x + k * 180, y = shooting.y + k * 90;
          const grd = g.createLinearGradient(x - 60, y - 30, x, y); grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(1, '#fff');
          g.strokeStyle = grd; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - 60, y - 30); g.lineTo(x, y); g.stroke();
          if (k >= 1) { shooting = null; if (!wished) { wished = true; note.textContent = '🌠 A shooting star! Make a wish…'; bus.emit('points:award', { amount: 1, reason: 'a shooting star' }); } }
        }
      } else {
        const grd = g.createLinearGradient(0, 0, 0, 360); grd.addColorStop(0, '#6fb6ff'); grd.addColorStop(1, '#d6ecff'); g.fillStyle = grd; g.fillRect(0, 0, 360, 360);
        g.fillStyle = 'rgba(255,255,255,.9)';
        for (let i = 0; i < 4; i++) { const x = ((t * 12 + i * 110) % 480) - 60, y = 60 + i * 70; g.beginPath(); g.arc(x, y, 22, 0, 7); g.arc(x + 26, y - 10, 28, 0, 7); g.arc(x + 54, y, 20, 0, 7); g.fill(); }
        g.strokeStyle = '#333'; g.lineWidth = 2;
        for (const b of birds) { const x = (b[0] + t * 40 * b[2]) % 380, y = b[1] + Math.sin(t * 3 + b[0]) * 6, f = Math.sin(t * 10 + b[0]) * 5; g.beginPath(); g.moveTo(x - 8, y - f); g.lineTo(x, y); g.lineTo(x + 8, y - f); g.stroke(); }
      }
      requestAnimationFrame(draw);
    };
    draw();
  }

  // ---------- fireworks ----------
  function launchFireworks(seed = Math.random()) {
    const roof = world.roofCenter(); if (!roof) return;
    let r = seed * 9301; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 7; i++) {
      shows.push({ type: 'rocket', delay: i * 0.55 + rnd() * 0.3, t: 0, from: roof.clone().add(new THREE.Vector3((rnd() - 0.5) * 3, 0.5, (rnd() - 0.5) * 3)),
        top: 4.5 + rnd() * 3.5, dx: (rnd() - 0.5) * 6, dz: (rnd() - 0.5) * 6, color: COLORS[Math.floor(rnd() * COLORS.length)], mesh: null });
    }
  }
  function fireworks() {
    const seed = Math.random();
    launchFireworks(seed);
    ctx.use('live.send')?.({ type: 'fireworks', seed });
    ui.toast('🎆 Fireworks!');
    const now = Date.now();
    if (now - lastPoints > 5 * 60 * 1000) { lastPoints = now; bus.emit('points:award', { amount: 1, reason: 'fireworks' }); }
  }
  bus.on('live:fireworks', (e) => launchFireworks(e.seed));

  function burst(at, color) {
    const N = 150; const pos = new Float32Array(N * 3); const vel = [];
    for (let i = 0; i < N; i++) {
      pos.set([at.x, at.y, at.z], i * 3);
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), sp = 4.5 + Math.random() * 2;
      vel.push(new THREE.Vector3(Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp, Math.sin(ph) * Math.sin(th) * sp));
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.34, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    world.scene.add(pts);
    flash.color.set(color); flash.position.copy(at); flash.intensity = 30;
    shows.push({ type: 'burst', t: 0, pts, vel });
  }

  // ---------- elevator ----------
  function openElevator() {
    const floors = world.floors();
    const body = h('div', {},
      h('p', { class: 'muted' }, 'Where to? Your avatar walks in and rides the glass elevator.'),
      ...floors.map((f) => h('button', { class: f.current ? '' : 'primary', disabled: f.current, 'data-lift': f.level,
        style: { display: 'block', width: '100%', margin: '6px 0' },
        onclick: () => { ui.closePanel(); world.rideTo(f.level); } }, `${f.level === floors.length - 1 && f.roof ? '🌇' : '🏠'} ${f.name}${f.current ? ' (you are here)' : ''}`)).reverse());
    ui.panel({ title: '🛗 Glass elevator', body });
  }

  /** What to do when I reach a roof thing. */
  function use(kind) {
    if (kind === 'telescope') openTelescope();
    if (kind === 'fireworks') fireworks();
    if (kind === 'hottub' || kind === 'lounger') world.sitOnRoof(kind);
    if (kind === 'pot') ui.toast('🌿 A happy rooftop plant');
  }

  function update(dt) {
    flash.intensity = Math.max(0, flash.intensity - dt * 50);
    // string lights glow at night
    const bulbs = world.roofBulbs(); for (const m of bulbs) m.emissiveIntensity = 0.2 + world.night() * 1.6;
    for (let i = shows.length - 1; i >= 0; i--) {
      const s = shows[i];
      if (s.type === 'rocket') {
        if (s.delay > 0) { s.delay -= dt; continue; }
        if (!s.mesh) { s.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff3c4' })); world.scene.add(s.mesh); }
        s.t += dt / 1.1; const k = Math.min(1, s.t);
        s.mesh.position.set(s.from.x + s.dx * k, s.from.y + s.top * (1 - (1 - k) * (1 - k)), s.from.z + s.dz * k);
        if (k >= 1) { burst(s.mesh.position.clone(), s.color); world.scene.remove(s.mesh); shows.splice(i, 1); }
      } else {
        s.t += dt; const p = s.pts.geometry.attributes.position;
        for (let j = 0; j < p.count; j++) {
          s.vel[j].y -= 2.5 * dt; s.vel[j].multiplyScalar(1 - dt * 0.9);
          p.setXYZ(j, p.getX(j) + s.vel[j].x * dt, p.getY(j) + s.vel[j].y * dt, p.getZ(j) + s.vel[j].z * dt);
        }
        p.needsUpdate = true;
        s.pts.material.opacity = Math.max(0, 1 - s.t / 1.8);
        if (s.t > 1.8) { world.scene.remove(s.pts); s.pts.geometry.dispose(); shows.splice(i, 1); }
      }
    }
  }
  return { use, update, openElevator, openTelescope, fireworks };
}
