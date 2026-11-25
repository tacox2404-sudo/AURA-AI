// `npm run ship`  (owned by the lead)
// One command to finish: runs the 3 checks, makes sure docs/LOG.md was updated,
// pushes your branch to the team repo and opens the pull request.
import { execSync } from 'node:child_process';
import { areaFromBranch } from './scope.mjs';

const TEAM = 'tacox2404-sudo/AURA-AI';
const out = (c) => execSync(c, { stdio: 'pipe' }).toString().trim();
const show = (c) => execSync(c, { stdio: 'inherit' });
const fail = (m) => { console.error('\n❌ ' + m + '\n'); process.exit(1); };

const branch = out('git rev-parse --abbrev-ref HEAD');
if (!areaFromBranch(branch)) fail(`You are on "${branch}". Start work with: npm run start -- <area>/<short-task>`);
if (out('git status --porcelain')) fail('You have uncommitted changes. Commit them first (ask Claude to), then run this again.');

console.log('1/4 build'); show('npm run build');
console.log('2/4 scope'); show('npm run scope');
console.log('3/4 smoke test'); show('npm run smoke');

console.log('4/4 log + push');
let base = 'origin/main';
try { out('git fetch origin main'); } catch {}
if (!out(`git diff --name-only ${base}...HEAD`).split('\n').includes('docs/LOG.md')) {
  fail('Add 2-4 lines to docs/LOG.md (date, area, what changed, what is next), commit, and run this again.');
}
show(`git push -u origin ${branch}`);

let hasGh = true;
try { out('gh --version'); } catch { hasGh = false; }
if (hasGh) {
  try { show(`gh pr view ${branch} --json url --jq .url`); console.log('(a pull request already exists; your push updated it)'); }
  catch {
    show(`gh pr create --repo ${TEAM} --base main --head ${branch} --title "${out('git log -1 --pretty=%s').replace(/"/g, "'")}" --body-file .github/pull_request_template.md`);
  }
} else {
  console.log(`\nOpen your pull request here:\nhttps://github.com/${TEAM}/compare/main...${branch}?expand=1`);
}
// Merge by itself when the checks are green, so nobody has to wait for the Game Director.
if (hasGh) {
  try { show(`gh pr merge ${branch} --auto --squash --repo ${TEAM}`); console.log('Auto-merge is ON: it merges by itself when the checks pass.'); }
  catch { console.log('(Could not turn on auto-merge. Ask the Game Director, or click "Enable auto-merge" on the pull request.)'); }
}
console.log('\n✅ Shipped. Next: run `npm run status` in a minute or two. It tells you if the checks passed and whether it merged.\nIf a check FAILS, fix it on your branch and run `npm run ship` again. You do not need to wait for anyone.');
