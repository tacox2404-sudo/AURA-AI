// Brings the latest `main` into your branch so your pull request never conflicts. (owned by the lead)
// The usual conflict is docs/LOG.md, because everyone adds a line at the bottom. That one is
// fixed automatically (both lines are kept). Any other conflict is handed back with a clear message.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

export function syncWithMain(cwd = process.cwd(), log = console.log) {
  const run = (c) => execSync(c, { cwd, stdio: 'pipe' }).toString().trim();
  try { run('git fetch origin main'); } catch { log('(could not reach GitHub to update; carrying on)'); return 'offline'; }
  const behind = Number(run('git rev-list --count HEAD..origin/main') || 0);
  if (!behind) return 'up-to-date';
  try { run('git merge --no-edit origin/main'); log(`Brought in ${behind} new change(s) from main.`); return 'merged'; }
  catch {
    const conflicted = run('git diff --name-only --diff-filter=U').split('\n').filter(Boolean);
    if (conflicted.length === 1 && conflicted[0] === 'docs/LOG.md') {
      const file = `${cwd}/docs/LOG.md`;
      const fixed = readFileSync(file, 'utf8').split('\n').filter((l) => !/^(<<<<<<< |=======$|>>>>>>> )/.test(l)).join('\n');
      writeFileSync(file, fixed);
      run('git add docs/LOG.md'); run('git commit --no-edit');
      log('docs/LOG.md had a conflict (two people added a line): kept both lines automatically.');
      return 'merged-log';
    }
    try { run('git merge --abort'); } catch { /* nothing to abort */ }
    throw new Error(`Your branch conflicts with main in: ${conflicted.join(', ') || 'some files'}.\nAsk Claude to merge origin/main into your branch and resolve those files (keep both sides' intent), then run npm run ship again.`);
  }
}
