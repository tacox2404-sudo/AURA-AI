// Claude Code hook: runs when a session starts. Whatever it prints is shown to Claude,
// so every teammate's Claude is reminded of the team workflow before doing anything.
import { execSync } from 'node:child_process';
import { areaFromBranch } from '../../scripts/scope.mjs';

const sh = (c) => { try { return execSync(c, { stdio: 'pipe' }).toString().trim(); } catch { return ''; } };
const branch = sh('git rev-parse --abbrev-ref HEAD');
const origin = sh('git remote get-url origin');
const area = areaFromBranch(branch);

const lines = ['AURA TEAM WORKFLOW (mandatory, details in CLAUDE.md and docs/WORKFLOW.md):'];
lines.push(`- Current branch: ${branch || '(unknown)'}${area ? ` -> area "${area}"` : ''}.`);
if (!area) lines.push('- NOT on an area branch. Before editing anything run: npm run start -- <area>/<short-task>  (areas: world, build, social, activities, core).');
if (origin && !origin.toLowerCase().includes('tacox2404-sudo/aura-ai')) lines.push('- origin is a personal fork. `npm run start` will point it at the team repo.');
lines.push('- Start work: npm run start -- <area>/<short-task>.  Finish work: npm run ship.  Never push to main.');
lines.push('- Stay in your area folder; for anything else write an Issue text (CLAUDE.md rule 1). Explain changes in plain words.');
console.log(lines.join('\n'));
