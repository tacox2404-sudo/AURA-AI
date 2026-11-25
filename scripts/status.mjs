// `npm run status`  (owned by the lead)
// Tells you (and your Claude) what happened to your pull request, with no GitHub login needed:
// are the checks running / passed / failed, and has it been merged? Run it again to refresh.
import { execSync } from 'node:child_process';

const TEAM = 'tacox2404-sudo/AURA-AI';
const out = (c) => { try { return execSync(c, { stdio: 'pipe' }).toString().trim(); } catch { return ''; } };
const api = async (path) => {
  const res = await fetch(`https://api.github.com/${path}`, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'aura-status' } });
  if (!res.ok) throw new Error(`GitHub said ${res.status} for ${path}`);
  return res.json();
};

const arg = process.argv[2] || '';
const prNumber = /^\d+$/.test(arg) ? Number(arg) : null; // npm run status -- 20
const branch = prNumber ? '' : arg || out('git rev-parse --abbrev-ref HEAD');
if (!prNumber && (!branch || branch === 'main' || branch === 'HEAD')) {
  console.log('You are on main. Run this on your task branch, or give a branch name: npm run status -- world/my-task');
  process.exit(0);
}

try {
  // my branch may live on the team repo (normal) or on a personal fork (old way)
  const origin = out('git remote get-url origin');
  const forkOwner = (origin.match(/github\.com[:/]([^/]+)\//) || [])[1];
  let prs = prNumber ? [{ number: prNumber }] : await api(`repos/${TEAM}/pulls?state=all&head=${TEAM.split('/')[0]}:${encodeURIComponent(branch)}`);
  if (!prs.length && forkOwner) prs = await api(`repos/${TEAM}/pulls?state=all&head=${forkOwner}:${encodeURIComponent(branch)}`);
  if (!prs.length) {
    console.log(`No pull request found for "${branch}" yet.\nRun: npm run ship   (it checks, pushes and opens the pull request)`);
    process.exit(0);
  }
  const pr = (await api(`repos/${TEAM}/pulls/${prs[0].number}`));
  console.log(`Pull request #${pr.number}: ${pr.title}\n${pr.html_url}`);

  if (pr.merged) { console.log('\n✅ MERGED into main. It is part of the game now (the live site updates in a few minutes). You are done. Start the next task with: npm run start -- <area>/<task>'); process.exit(0); }
  if (pr.state === 'closed') { console.log('\n⚪ Closed without merging. Ask the Game Director if that was on purpose.'); process.exit(0); }

  const runs = (await api(`repos/${TEAM}/actions/runs?head_sha=${pr.head.sha}&event=pull_request`)).workflow_runs || [];
  const run = runs[0];
  if (!run) console.log('\n⏳ The checks have not started yet. Wait a minute and run this again.');
  else if (run.status !== 'completed') console.log('\n⏳ Checks are running (about 1-2 minutes). Run this again soon.');
  else if (run.conclusion === 'success') console.log(pr.auto_merge ? '\n✅ Checks passed. Auto-merge is on, so it will merge by itself in a moment. Run this again to confirm.' : '\n✅ Checks passed. Waiting to be merged (if auto-merge is off, tell the Game Director).');
  else if (run.conclusion === 'action_required') console.log('\n🔒 GitHub is holding the checks because you are not a collaborator yet.\nFix: accept the invitation at https://github.com/tacox2404-sudo/AURA-AI/invitations , then run `npm run start -- <area>/<task>` and push your branch to the team repo.\nOr ask the Game Director to click "Approve and run workflows" on the pull request.');
  else console.log(`\n❌ Checks FAILED (${run.conclusion}). See what went wrong: ${run.html_url}\nFix it on your branch, commit, and run: npm run ship   (the same pull request updates and the checks run again)`);
  if (pr.mergeable_state === 'dirty') console.log('\n⚠️ This branch conflicts with main. Run: git pull origin main, fix the conflicts (often just docs/LOG.md: keep both lines), commit, then npm run ship.');
} catch (e) {
  console.log(`Could not reach GitHub (${e.message}). Check your internet and try again.`);
}
