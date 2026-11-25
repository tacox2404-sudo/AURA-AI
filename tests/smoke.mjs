// SMOKE TEST (owned by the lead): plays the game like a real person, in demo mode,
// and fails if anything crashes. Runs on every pull request, and locally with:
//   npm run build && npm run smoke
//
// It checks: sign up, create each house type, wardrobe, every room renders,
// build mode, AI room creation, every activity opens, two players see each other,
// chat, a Connect Four move syncs between players, and invite links give the right role
// (housemate link -> housemate, guest link -> guest), the owner can promote a guest, and a member can leave.

import { chromium } from 'playwright';
import { spawn, execSync } from 'node:child_process';

const PORT = 4179;
const URL = `http://localhost:${PORT}/`;
const errors = [];
let step = '';
const log = (s) => { step = s; console.log('•', s); };

// Always test a DEMO copy of the game (Supabase keys blanked), so the robot can never
// create accounts in the real database, even when .env.local exists.
const demoEnv = { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' };
execSync('npx vite build --outDir dist-smoke --emptyOutDir', { stdio: 'ignore', env: demoEnv, shell: process.platform === 'win32' });
const server = spawn('npx', ['vite', 'preview', '--outDir', 'dist-smoke', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', env: demoEnv, shell: process.platform === 'win32' });
for (let i = 0; i < 40; i++) { // wait up to ~20s for the server
  try { await fetch(URL); break; } catch { await new Promise((r) => setTimeout(r, 500)); }
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

function watch(page, who) {
  page.on('pageerror', (e) => errors.push(`[${who}] ${step}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push(`[${who}] ${step}: console: ${m.text()}`); });
}

async function signUp(page, name) {
  await page.fill('input[placeholder=Username]', name);
  await page.fill('input[type=password]', 'secret123');
  await page.click('text=Create account');
  await page.waitForTimeout(500);
}

try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const a = await ctx.newPage(); watch(a, 'A');
  await a.goto(URL); await a.waitForTimeout(600);

  log('sign up');
  await signUp(a, 'tester_a');

  const types = [['Love Nest', 'Pastel dream'], ['Friends Crib', 'Neon night'], ['Family Home', 'Cozy cabin'], ['Solo Studio', 'Modern loft']];
  for (const [i, [type, vibe]] of types.entries()) {
    log(`create house: ${type}`);
    if (i > 0) { await a.evaluate(() => window.__ourplace.use('social.switchHouse')()); await a.waitForTimeout(500); }
    await a.click('text=Create a new house');
    await a.click(`text=${type}`);
    await a.click('text=Next');
    await a.click(`text=${vibe}`);
    await a.click('.card.form .primary');
    await a.waitForTimeout(1200);
    if (await a.locator('text=Save look').count()) await a.click('text=Save look');
    await a.waitForTimeout(300);
    const rooms = await a.evaluate(() => window.__ourplace.store.get().house.rooms.map((r) => r.id));
    if (rooms.length < 3) throw new Error(`${type} has only ${rooms.length} rooms`);
    log(`visit every room (${type})`);
    for (const id of rooms) { await a.evaluate((rid) => window.__ourplace.bus.emit('room:goto', { roomId: rid }), id); await a.waitForTimeout(250); }
  }

  log('build mode');
  await a.click('.dock-btn[data-id=build]'); await a.waitForTimeout(300);
  await a.click('text=✓ Done');

  log('AI room (keyword mode)');
  await a.click('.dock-btn[data-id=rooms]');
  await a.fill('input[placeholder^="e.g. cozy"]', 'spa room');
  await a.click('text=✨ Create room');
  await a.waitForTimeout(1000);

  log('every activity opens');
  const ids = await a.evaluate(() => window.__ourplace.use('activities.list')().map((x) => x.id));
  for (const id of ids) {
    step = `activity ${id}`;
    await a.evaluate((aid) => window.__ourplace.use('activities.open')(aid, { room: window.__ourplace.store.get().house.rooms[0] }), id);
    await a.waitForTimeout(250);
    await a.keyboard.press('Escape');
  }

  log('second player joins with a code');
  const code = await a.evaluate(() => window.__ourplace.store.get().house.inviteCode);
  const b = await ctx.newPage(); watch(b, 'B');
  await b.goto(URL); await b.waitForTimeout(400);
  await b.evaluate(() => { localStorage.setItem('op:session', 'null'); localStorage.removeItem('op:lastHouse'); });
  await b.goto(`${URL}?join=${code}`); await b.waitForTimeout(500);
  await signUp(b, 'tester_b');
  await b.waitForTimeout(1200);
  if (await b.locator('text=Save look').count()) await b.click('text=Save look');
  await b.waitForTimeout(2500);
  const seen = await a.evaluate(() => window.__ourplace.store.get().players.length);
  if (seen < 1) throw new Error('Player A does not see player B');

  log('chat');
  await b.evaluate(() => window.__ourplace.use('chat.send')('hello from B'));
  await a.waitForTimeout(800);

  log('Connect Four move syncs');
  const key = 'smoke:c4';
  await a.evaluate((k) => window.__ourplace.use('activities.open')('connect4', { key: k }), key);
  await a.click('text=Start game'); await a.waitForTimeout(300);
  await a.locator('.c4-cell').nth(38).click(); await a.waitForTimeout(500);
  await b.evaluate((k) => window.__ourplace.use('activities.open')('connect4', { key: k }), key);
  await b.waitForTimeout(500);
  const redOnB = await b.locator('.c4-cell i.red').count();
  if (redOnB !== 1) throw new Error(`B sees ${redOnB} red discs, expected 1`);

  log('invite links give the right role');
  const roleB = await b.evaluate(() => window.__ourplace.store.get().role);
  if (roleB !== 'housemate') throw new Error(`Housemate link gave role "${roleB}"`);
  const guestCode = await a.evaluate(() => window.__ourplace.store.get().house.guestCode);
  await b.close(); // fewer 3D pages open at once keeps the robot fast
  const c = await ctx.newPage(); watch(c, 'C');
  await c.goto(URL); await c.waitForTimeout(400);
  await c.evaluate(() => { localStorage.setItem('op:session', 'null'); localStorage.removeItem('op:lastHouse'); });
  await c.goto(`${URL}?join=${guestCode}`); await c.waitForTimeout(500);
  await signUp(c, 'tester_c');
  await c.waitForTimeout(1500);
  if (await c.locator('text=Save look').count()) await c.click('text=Save look');
  await c.waitForTimeout(500);
  const roleC = await c.evaluate(() => window.__ourplace.store.get().role);
  if (roleC !== 'guest') throw new Error(`Guest link gave role "${roleC}"`);

  log('owner promotes the guest (People panel)');
  const cId = await c.evaluate(() => window.__ourplace.store.get().me.id);
  await a.evaluate(() => window.__ourplace.use('social.openPeople')());
  await a.waitForTimeout(300);
  await a.locator('.row', { hasText: 'tester_c' }).locator('button[title="Make housemate"]').click();
  await a.locator('button', { hasText: /^Yes$/ }).click();
  await a.waitForTimeout(800);
  const promoted = await a.evaluate((id) => window.__ourplace.store.get().house.members[id]?.role, cId);
  if (promoted !== 'housemate') throw new Error(`Promote left the role as "${promoted}"`);
  await a.keyboard.press('Escape');

  log('a member leaves the house');
  await c.waitForTimeout(800); // C reloads after the promotion
  await c.evaluate(() => window.__ourplace.use('social.openMenu')());
  await c.waitForTimeout(300);
  await c.click('text=Leave this house');
  await c.locator('button', { hasText: /^Leave$/ }).click();
  await a.waitForTimeout(1500);
  const stillThere = await a.evaluate((id) => !!window.__ourplace.store.get().house.members[id], cId);
  if (stillThere) throw new Error('Player C left but the owner still sees them as a member');

  await a.screenshot({ path: 'tests/last-smoke.png' });
} catch (e) {
  errors.push(`FAILED at "${step}": ${e.message}`);
}

await browser.close();
server.kill();

if (errors.length) {
  console.error('\n❌ Smoke test found problems:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('\n✅ Smoke test passed: the game works end to end.');
process.exit(0);
