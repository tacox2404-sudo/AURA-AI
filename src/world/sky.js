// SKY, WEATHER + SEASONS (owned by World).
//
//   - Every window shows a live little sky: the sun moving across, the moon and stars at night,
//     clouds, rain or snow, from the REAL weather in your city (house.cities).
//   - Window to your partner: in each room the first window shows the sky in the OTHER city
//     (their time of day and their weather), with a small sign: "💞 Lisbon · 21:14 · 🌧 12°".
//     house.cities[0] is the city of the person who made the house, [1] the partner's.
//   - Seasons outside: snow and a white garden in winter, blossom petals in spring, fireflies on
//     summer nights, falling leaves in autumn. Real rain or snow where you are wins over the season.
//
// Weather comes from open-meteo.com (free, no key; the Activities weather window uses it too),
// checked every 15 minutes. If it can't be reached, the sky just shows the time of day.
// Testing: ?weather=rain|snow|storm|cloudy|clear and ?season=winter|spring|summer|autumn in the address bar.

import * as THREE from 'three';
import { lightAt } from './daylight.js';

const params = new URLSearchParams(location.search);
const FORCE_WEATHER = params.get('weather');
const FORCE_SEASON = params.get('season');

// open-meteo weather codes -> our few kinds
function kindOf(code) {
  if (code == null) return 'clear';
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 2) return 'cloudy';
  return 'clear';
}
const ICON = { clear: '☀️', cloudy: '⛅', rain: '🌧', snow: '❄️', storm: '⛈', fog: '🌫' };

const cache = new Map(); // city -> { at, data }
const asking = new Map(); // city -> the question already on its way (so we never ask twice at once)
function weatherFor(city) {
  if (!city) return Promise.resolve(null);
  const hit = cache.get(city);
  if (hit && Date.now() - hit.at < 15 * 60 * 1000) return Promise.resolve(hit.data);
  if (!asking.has(city)) asking.set(city, fetchWeather(city).finally(() => asking.delete(city)));
  return asking.get(city);
}
async function fetchWeather(city) {
  try {
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`).then((r) => r.json());
    const p = geo.results?.[0]; if (!p) throw new Error('no city');
    const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=temperature_2m,weather_code&timezone=auto`).then((r) => r.json());
    const data = { city: p.name || city, lat: p.latitude, kind: kindOf(w.current?.weather_code), temp: Math.round(w.current?.temperature_2m ?? 0), offset: w.utc_offset_seconds ?? null };
    cache.set(city, { at: Date.now(), data });
    return data;
  } catch (e) { cache.set(city, { at: Date.now() - 10 * 60 * 1000, data: null }); return null; } // try again in 5 minutes
}

export function seasonOf(date = new Date(), lat = 45) {
  if (FORCE_SEASON) return FORCE_SEASON;
  let m = date.getMonth(); if (lat < 0) m = (m + 6) % 12; // the southern half of the world has it the other way round
  return m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn';
}

/** A small canvas that paints an animated sky; used as the picture in the window glass. */
function skyCanvas() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 96;
  const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const stars = Array.from({ length: 22 }, () => [Math.random() * 96, Math.random() * 60, Math.random()]);
  const drops = Array.from({ length: 40 }, () => [Math.random() * 96, Math.random() * 96, 0.6 + Math.random() * 0.8]);
  function draw(hour, kind, t) {
    const L = lightAt(hour);
    const top = L.sky.clone().offsetHSL(0, 0, -0.12), bottom = L.sky.clone().lerp(new THREE.Color('#ffffff'), 0.25 * (1 - L.night));
    const grey = kind === 'rain' || kind === 'storm' || kind === 'snow' || kind === 'fog';
    if (grey) { top.lerp(new THREE.Color('#7d8796'), 0.55); bottom.lerp(new THREE.Color('#a9b1bd'), 0.55); }
    const grd = g.createLinearGradient(0, 0, 0, 96); grd.addColorStop(0, top.getStyle()); grd.addColorStop(1, bottom.getStyle());
    g.fillStyle = grd; g.fillRect(0, 0, 96, 96);
    // stars + moon at night
    if (L.night > 0.4 && !grey) {
      for (const [x, y, k] of stars) { g.fillStyle = `rgba(255,255,240,${(0.4 + 0.6 * Math.abs(Math.sin(t * (0.5 + k) + k * 9))) * L.night})`; g.fillRect(x, y, 1.5, 1.5); }
      g.fillStyle = '#fdf6d8'; g.beginPath(); g.arc(70, 24, 9, 0, Math.PI * 2); g.fill();
      g.fillStyle = top.getStyle(); g.beginPath(); g.arc(75, 21, 8, 0, Math.PI * 2); g.fill();
    }
    // the sun travels from left (morning) to right (evening)
    if (hour > 6 && hour < 20 && !grey) {
      const k = (hour - 6) / 14; const x = 10 + k * 76, y = 70 - Math.sin(k * Math.PI) * 52;
      g.fillStyle = hour < 8 || hour > 17.5 ? '#ffb070' : '#fff3b0'; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill();
    }
    // clouds drift by
    if (kind !== 'clear' || Math.sin(t * 0.05) > 0.3) {
      g.fillStyle = grey ? 'rgba(200,205,215,.85)' : 'rgba(255,255,255,.85)';
      for (let i = 0; i < (grey ? 4 : 2); i++) {
        const x = ((t * 4 + i * 37) % 130) - 20, y = 18 + i * 13;
        g.beginPath(); g.arc(x, y, 9, 0, 7); g.arc(x + 10, y - 4, 11, 0, 7); g.arc(x + 21, y, 8, 0, 7); g.fill();
      }
    }
    // rain / snow
    if (kind === 'rain' || kind === 'storm') {
      g.strokeStyle = 'rgba(210,225,255,.8)'; g.lineWidth = 1;
      for (const d of drops) { const y = (d[1] + t * 90 * d[2]) % 100; g.beginPath(); g.moveTo(d[0], y); g.lineTo(d[0] - 2, y + 7); g.stroke(); }
      if (kind === 'storm' && Math.sin(t * 1.7) > 0.985) { g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(0, 0, 96, 96); }
    }
    if (kind === 'snow') {
      g.fillStyle = '#fff';
      for (const d of drops) { const y = (d[1] + t * 14 * d[2]) % 100; g.fillRect((d[0] + Math.sin(t + d[1]) * 4 + 96) % 96, y, 2, 2); }
    }
    if (kind === 'fog') { g.fillStyle = 'rgba(235,238,242,.55)'; g.fillRect(0, 0, 96, 96); }
    tex.needsUpdate = true;
  }
  return { tex, draw };
}

/** A sign under the partner window. Redrawn when the text changes. */
function labelSprite() {
  const cv = document.createElement('canvas'); cv.width = 320; cv.height = 64;
  const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sp.scale.set(2.1, 0.42, 1);
  let last = '';
  sp.userData.set = (text) => {
    if (text === last) return; last = text;
    g.clearRect(0, 0, 320, 64);
    g.font = 'bold 26px system-ui, sans-serif'; const w = Math.min(316, g.measureText(text).width + 24);
    g.fillStyle = 'rgba(42,34,64,.85)'; g.beginPath(); g.roundRect((320 - w) / 2, 6, w, 48, 16); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 160, 31);
    tex.needsUpdate = true;
  };
  return sp;
}

export function createSky(ctx) {
  const { store } = ctx;
  const home = skyCanvas(), partner = skyCanvas();
  let homeW = null, partnerW = null;  // weather data
  let cities = { home: null, partner: null };
  const labels = [];                   // partner window signs
  let outside = null; let particles = null; let season = seasonOf(); let drawT = 0; let checkT = 0;

  /** Which city is mine and which is my partner's. */
  function pickCities() {
    const s = store.get(); const list = s.house?.cities || [];
    const iMadeIt = s.house?.ownerId === s.me?.id;
    cities = { home: (iMadeIt ? list[0] : list[1]) || list[0] || null, partner: (iMadeIt ? list[1] : list[0]) || null };
    if (cities.partner && cities.partner === cities.home) cities.partner = null;
  }
  let lastKey = '';
  /** Work out the cities (right away) and ask for their weather (only if they changed, or every 15 minutes). */
  async function refresh(force) {
    pickCities();
    const key = `${cities.home}|${cities.partner}`;
    if (!force && key === lastKey) return;
    lastKey = key;
    [homeW, partnerW] = await Promise.all([weatherFor(cities.home), weatherFor(cities.partner)]);
    season = seasonOf(new Date(), homeW?.lat ?? 45);
    applySeason();
  }
  const homeKind = () => FORCE_WEATHER || homeW?.kind || 'clear';
  const partnerKind = () => FORCE_WEATHER || partnerW?.kind || 'clear';
  /** the time in my partner's city (hours), from their UTC offset */
  function partnerHour() {
    if (partnerW?.offset == null) return null;
    const d = new Date(Date.now() + partnerW.offset * 1000);
    return d.getUTCHours() + d.getUTCMinutes() / 60;
  }
  const hasPartner = () => !!cities.partner;
  function partnerText() {
    const s = store.get(); const icon = s.house?.type === 'love' ? '💞' : '🌍';
    const ph = partnerHour();
    const time = ph == null ? '' : ` · ${String(Math.floor(ph)).padStart(2, '0')}:${String(Math.floor((ph % 1) * 60)).padStart(2, '0')}`;
    const w = partnerW ? ` · ${ICON[partnerKind()] || ''} ${partnerW.temp}°` : '';
    return `${icon} ${partnerW?.city || cities.partner}${time}${w}`;
  }
  /** A new sign for a partner window (index.js puts it under the first window of each room). */
  function makeLabel() { const sp = labelSprite(); labels.push(sp); sp.userData.set(partnerText()); return sp; }

  // ---------- seasons outside ----------
  const SEASON = {
    winter: { grass: '#e6edf1', bush: '#dfe9ee', fall: 'snow' },
    spring: { grass: '#9ad17f', bush: '#f4a6c6', fall: 'petals' },
    summer: { grass: '#8fc47a', bush: '#5e9c5a', fall: 'fireflies' },
    autumn: { grass: '#b9b36a', bush: '#d98c3a', fall: 'leaves' },
  };
  function setOutside(o) { outside = o; if (particles) particles.parent?.remove(particles); particles = null; applySeason(); }
  function applySeason() {
    if (!outside) return;
    const S = SEASON[season] || SEASON.summer;
    outside.garden.grass.material.color.set(S.grass);
    outside.garden.bushes.forEach((b, i) => b.material.color.set(i % 2 ? new THREE.Color(S.bush).offsetHSL(0, 0, -0.08) : S.bush));
    const kind = ['rain', 'storm'].includes(homeKind()) ? 'rain' : homeKind() === 'snow' ? 'snow' : S.fall;
    if (particles?.userData.kind === kind) return;
    if (particles) particles.parent?.remove(particles);
    particles = makeParticles(kind, outside.bounds);
    outside.group.add(particles);
  }

  function update(dt, myHour, night) {
    drawT += dt; checkT -= dt;
    if (checkT <= 0) { checkT = 15 * 60; refresh(true); }
    if (drawT > 0.12) { // repaint the window skies ~8 times a second
      const t = performance.now() / 1000;
      home.draw(myHour, homeKind(), t);
      if (hasPartner()) partner.draw(partnerHour() ?? myHour, partnerKind(), t + 3);
      drawT = 0;
      for (const l of labels) l.userData.set(partnerText());
    }
    if (particles) { particles.userData.tick(dt); if (particles.userData.kind === 'fireflies') particles.visible = (night ?? 1) > 0.4; } // fireflies only at night
  }
  return { update, refresh, setOutside, makeLabel, hasPartner, textures: { home: home.tex, partner: partner.tex }, clearLabels: () => { labels.length = 0; }, get season() { return season; } };
}

/** Falling snow / rain / petals / leaves, or floating fireflies, around the whole building. */
function makeParticles(kind, b) {
  const N = kind === 'rain' ? 700 : kind === 'fireflies' ? 60 : 380;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const palette = { snow: ['#ffffff'], rain: ['#a9c7ff'], petals: ['#ffc1d9', '#ffd9e8', '#ffffff'], leaves: ['#e07a2f', '#c9471f', '#e8b23a', '#a85a24'], fireflies: ['#fff6a0'] }[kind];
  const rnd = (a, c) => a + Math.random() * (c - a);
  for (let i = 0; i < N; i++) {
    pos.set([rnd(b.x0 - 6, b.x1 + 6), rnd(0, b.top + 3), rnd(b.z0 - 6, b.z1 + 4)], i * 3);
    const c = new THREE.Color(palette[i % palette.length]); col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const size = { snow: 0.09, rain: 0.05, petals: 0.1, leaves: 0.13, fireflies: 0.12 }[kind];
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, vertexColors: true, transparent: true, opacity: kind === 'rain' ? 0.7 : 0.95, depthWrite: false }));
  const speed = { snow: 0.7, rain: 9, petals: 0.6, leaves: 0.9, fireflies: 0 }[kind];
  let t = 0;
  pts.userData = {
    kind,
    tick(dt) {
      t += dt; const p = geo.attributes.position;
      for (let i = 0; i < N; i++) {
        let y = p.getY(i) - speed * dt;
        if (kind === 'fireflies') { y = 0.4 + Math.abs(Math.sin(t * 0.3 + i)) * 2.2; p.setX(i, p.getX(i) + Math.sin(t + i) * dt * 0.3); }
        else if (kind !== 'rain') p.setX(i, p.getX(i) + Math.sin(t * 1.3 + i) * dt * (kind === 'leaves' ? 0.8 : 0.35));
        if (y < -0.2) y = b.top + 3;
        p.setY(i, y);
      }
      p.needsUpdate = true;
      if (kind === 'fireflies') pts.material.opacity = 0.6 + Math.sin(t * 3) * 0.35;
    },
  };
  return pts;
}
