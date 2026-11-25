// `npm run start -- <area>/<short-task>`  (owned by the lead)
// One command to begin work safely: fixes your git remote if needed, gets the latest
// main, and creates your branch. Example: npm run start -- world/walk-animation
import { execSync } from 'node:child_process';
import { AREAS, areaFromBranch } from './scope.mjs';

const TEAM = 'tacox2404-sudo/AURA-AI';
const out = (c) => execSync(c, { stdio: 'pipe' }).toString().trim();
const show = (c) => execSync(c, { stdio: 'inherit' });
const fail = (m) => { console.error('\n❌ ' + m + '\n'); process.exit(1); };

const branch = process.argv[2] || '';
if (!/^[a-z]+\/[a-z0-9-]+$/.test(branch) || !areaFromBranch(branch)) {
  fail(`Give a branch name like <area>/<short-task> (areas: ${AREAS.join(', ')}).\n   Example: npm run start -- world/walk-animation`);
}
if (out('git status --porcelain')) fail('You have unsaved changes. Commit them first (or ask Claude to), then run this again.');

// Everyone works in a clone of the TEAM repo. If this clone points at a personal fork, fix it.
const origin = out('git remote get-url origin');
if (!origin.toLowerCase().includes(TEAM.toLowerCase())) {
  console.log('ℹ️  Your "origin" was a personal fork. Pointing origin at the team repo (the fork is kept as "fork").');
  show('git remote rename origin fork');
  show(`git remote add origin https://github.com/${TEAM}.git`);
}

show('git fetch origin');
show('git checkout main');
show('git pull --ff-only origin main');
try { out(`git rev-parse --verify ${branch}`); fail(`Branch "${branch}" already exists. Use: git checkout ${branch}`); } catch (e) { if (e.status === undefined) throw e; }
show(`git checkout -b ${branch}`);
console.log(`\n✅ On branch ${branch} (area: ${areaFromBranch(branch)}). Build your feature, then run: npm run ship`);
