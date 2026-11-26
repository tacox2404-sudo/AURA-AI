// CATALOGUE PICTURES (owned by Building): a small picture of any furniture item, drawn from its real
// 3D model in the colours of the room you are decorating. One tiny hidden renderer draws them one at a
// time and every picture is remembered, so browsing the catalogue stays smooth.

import * as THREE from 'three';

const SIZE = 192;
let renderer = null; let scene = null; let camera = null;
const cache = new Map(); // "itemId|floor,wall,accent,wood" -> data URL

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(SIZE, SIZE, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffffff', '#b9a48a', 1.5));
  const sun = new THREE.DirectionalLight('#fff3df', 1.8); sun.position.set(3, 6, 4); scene.add(sun);
  camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
}

const themeKey = (t) => [t.floor, t.wall, t.accent, t.wood].join(',');

/** A data-URL picture of `def` (a catalog item) in `theme` colours. */
export function thumbFor(def, theme) {
  const key = `${def.id}|${themeKey(theme)}`;
  if (cache.has(key)) return cache.get(key);
  try {
    if (!renderer) init();
    const group = def.build(theme);
    // a soft round shadow disc so the item looks like it stands on something
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3()); const center = box.getCenter(new THREE.Vector3());
    const disc = new THREE.Mesh(new THREE.CircleGeometry(Math.max(size.x, size.z) * 0.75 + 0.15, 28), new THREE.MeshBasicMaterial({ color: theme.floor, transparent: true, opacity: 0.55 }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = -0.005;
    scene.add(group, disc);
    // look at it from the front-right, slightly above (like the game camera), and fit it in the frame
    const sphere = new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere());
    const dist = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.05;
    const dir = new THREE.Vector3(0.75, 0.7, 1.0).normalize();
    camera.position.copy(sphere.center).addScaledVector(dir, dist); camera.lookAt(sphere.center);
    renderer.setClearColor(0x000000, 0); renderer.render(scene, camera);
    const url = renderer.domElement.toDataURL('image/png');
    scene.remove(group, disc);
    group.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); // materials are shared, keep them
    disc.geometry.dispose(); disc.material.dispose();
    cache.set(key, url);
    return url;
  } catch (e) {
    console.warn('[thumbs]', def.id, e.message);
    return '';
  }
}

// Pictures are drawn only for cards you can SEE, one per frame, so opening the catalogue never freezes the phone.
const queue = []; let pumping = false; let io = null;
function pump() {
  if (pumping) return; pumping = true;
  const tick = () => {
    const job = queue.shift();
    if (job && job.img.isConnected) job.img.src = thumbFor(job.def, job.theme);
    if (queue.length) requestAnimationFrame(tick); else pumping = false;
  };
  requestAnimationFrame(tick);
}
function watcher() {
  if (!io) io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); const job = e.target.__thumbJob; if (job) { queue.push(job); pump(); } }
  }, { rootMargin: '160px' });
  return io;
}

/** Fill an <img> with the picture of `def`: now if we already have it, otherwise when it scrolls into view. */
export function thumbInto(img, def, theme) {
  const key = `${def.id}|${themeKey(theme)}`;
  if (cache.has(key)) { img.src = cache.get(key); return; }
  img.__thumbJob = { img, def, theme };
  if (typeof IntersectionObserver === 'undefined') { setTimeout(() => { if (img.isConnected) img.src = thumbFor(def, theme); }, 0); return; }
  watcher().observe(img);
}
