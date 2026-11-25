// LIVE CHECK (owned by the lead): two simulated players join the same live channel on the REAL Supabase
// project and we check they see each other, see each other walk, see room changes, and late joiners
// learn where everyone stands. Needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (from .env.local).
// Run: npm run live-check   (it only uses a throwaway channel; no accounts or data are created)
import { readFileSync } from 'node:fs';
import { createSupabaseBackend } from '../src/core/backend/supabase.js';

let url = process.env.VITE_SUPABASE_URL, key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  try {
    const env = Object.fromEntries(readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
    url = url || env.VITE_SUPABASE_URL; key = key || env.VITE_SUPABASE_ANON_KEY;
  } catch { /* no .env.local */ }
}
if (!url || !key) { console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or create .env.local).'); process.exit(1); }

const house = 'live-check-' + Date.now();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const mk = (id) => { const seen = []; const c = createSupabaseBackend(url, key).connect(house, { id }, { onPresence: (l) => seen.push(l), onEvent: () => {} }); return { c, seen }; };
const look = (P) => (P.seen.at(-1) || []).map((p) => `${p.name}@${p.x},${p.z}/${p.roomId}`).sort().join(' ');
const move = (P, name, x, z, roomId = 'r1') => P.c.updatePresence({ roomId, x, z, name, avatar: { skin: 1 } });
let failed = 0;
const expect = (label, got, want) => { const ok = got === want; if (!ok) failed++; console.log(ok ? '✅' : '❌', label, ok ? '' : `got "${got}", wanted "${want}"`); };

const A = mk('A'); await wait(1500); move(A, 'Alice', 1, 1); await wait(500);
const B = mk('B'); await wait(1500); move(B, 'Bob', 5, 5); await wait(1500);
expect('both see each other after joining', `${look(A)} | ${look(B)}`, 'Bob@5,5/r1 | Alice@1,1/r1');
for (let i = 1; i <= 8; i++) { move(B, 'Bob', 5 + i, 5); await wait(130); } await wait(800);
expect('A sees Bob walk', look(A), 'Bob@13,5/r1');
for (let i = 1; i <= 8; i++) { move(A, 'Alice', 1 + i, 1); await wait(130); } await wait(800);
expect('B sees Alice walk', look(B), 'Alice@9,1/r1');
move(A, 'Alice', 0, 0, 'r2'); await wait(1000);
expect('B sees Alice change room', look(B), 'Alice@0,0/r2');
const C = mk('C'); await wait(1200); move(C, 'Cara', 3, 3); await wait(4500);
expect('late joiner sees where Bob stands', look(C).includes('Bob@13,5/r1'), true);
A.c.leave(); await wait(1500);
expect('B stops seeing Alice after she leaves', look(B).includes('Alice'), false);
console.log(failed ? `\n❌ ${failed} live check(s) failed` : '\n✅ Live connection works: players see each other and each other\'s movement.');
process.exit(failed ? 1 : 0);
