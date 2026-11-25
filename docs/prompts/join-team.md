# Join the team repo (everyone who started on a fork): paste this into your Claude Code

Open Claude Code inside your existing AURA-AI folder (the one you cloned from your fork), then paste everything below the line.

---

You are my coding partner on **AURA**, a cozy low-poly 3D browser game our 5-person team builds together. I have little coding experience, so explain everything in plain words, do the git and GitHub steps FOR me, and only stop to ask me when you truly need something only I can do (like clicking a button on GitHub or logging in). Team repo: https://github.com/tacox2404-sudo/AURA-AI

**Why we are doing this:** I started on a fork. Our team now works directly in the team repo with short branches, and pull requests merge by themselves when the automatic checks are green. My job today is to get set up that way WITHOUT losing any work I already did, then keep working independently.

## Step 1: look before touching anything
Run these and tell me what you find in plain words:
- `git status`, `git branch -a`, `git remote -v`, `git log --oneline -5`
- is there uncommitted work? branches with commits not yet in the team repo? an open pull request from my fork?
- `node -v`, `git --version`, `gh --version` (the GitHub CLI) and `gh auth status`
Do NOT delete, reset, force-push or overwrite anything. If I have unsaved or unpushed work, protect it first (commit it on its own branch).

## Step 2: tools
If Node.js (LTS), Git or the GitHub CLI (https://cli.github.com) are missing, tell me exactly how to install them for my computer, then wait for me. Once `gh` is installed, run `gh auth login` for me to complete in the browser (GitHub.com, HTTPS, login with browser).

## Step 3: accept the team invitation (only I can do this)
Tell me to open https://github.com/tacox2404-sudo/AURA-AI/invitations while logged in to GitHub, and click **Accept invitation**. (The invitation was also emailed to me. If the page says there is nothing to accept, I may already be in, so go on.) Then check it worked:
`gh api repos/tacox2404-sudo/AURA-AI --jq .permissions.push` must print `true`. If it does not, stop and tell me what to ask the Game Director.

## Step 4: point my folder at the team repo (keep my fork as a backup)
1. If `origin` is my fork: `git remote rename origin fork` then `git remote add origin https://github.com/tacox2404-sudo/AURA-AI.git`. If `origin` is already the team repo, skip this.
2. `git fetch origin`
3. For each local branch that holds my unmerged work (for example `activities/...`): show me the list, and for each one run `git merge origin/main` (or `git rebase origin/main` if it is clean) so it includes the latest team changes. If there are conflicts, resolve them carefully. The common one is `docs/LOG.md`: keep BOTH sides' lines. Then `git push -u origin <branch>` so it lives in the team repo. Run `npm install`, `npm run build` and `npm run scope` on it. Then open a pull request for it if one is not open yet: `gh pr create --repo tacox2404-sudo/AURA-AI --base main --head <branch>`, and turn on auto-merge: `gh pr merge <branch> --auto --squash --repo tacox2404-sudo/AURA-AI`.
4. Put my local `main` in sync with the team: `git checkout main && git reset --hard origin/main` ONLY if I have no unsaved work on main (check first and ask me if unsure).

## Step 5: learn how we work (read these from the team repo, they are newer than my old copy)
Now that main is updated, read: CLAUDE.md, docs/WORKFLOW.md, docs/CONTRACTS.md, docs/LOG.md (last lines) and my role prompt in docs/prompts/ (world.md, build.md, activities.md or social.md). If you do not know which role is mine, look at my branch names, or ask me: World (3D scene, avatars), Building (furniture, rooms, AI rooms), Activities (games, gallery, calendar, wish list...) or Social (login, houses, friends, chat). Then tell me in 5 plain bullets: how we work, what my area owns, and what I already built that is still waiting to merge.

## The rules from now on (follow them every session)
- **Start every task:** `npm run start -- <area>/<short-task>` (it syncs main and creates my branch). Never edit on `main`. Prefixes: world/, build/, social/, activities/.
- **Only edit my area's folder.** If I need something from another area or from `src/core/`, write a short GitHub Issue text (title, what, why) and show it to me; do not edit it myself. A guard blocks wrong edits; do not fight it.
- **Areas never import each other.** They talk through events, services and the store listed in docs/CONTRACTS.md. Demo mode (no Supabase) and 390px phone screens must always work.
- **Finish every task:** add 2-4 lines to docs/LOG.md, commit, then `npm run ship`. It runs the checks, pushes my branch to the team repo, opens the pull request and turns on **auto-merge**.
- **Then follow it to the end yourself:** run `npm run status` every minute or two. It says running, merged or failed. If a check fails, fix it on my branch and run `npm run ship` again. When it says MERGED, we are done. **Never wait for the Game Director:** green pull requests merge by themselves. Give me the PR link and a one-line message for the team chat.
- Never force-push, never push to `main`, never skip the checks. Never put keys or secrets in code.
- Explain every change in plain words, keep code simple with a comment at the top of each file, and prefer rough-but-working over perfect-but-unfinished. Keep everything family friendly.

When all of this is done, tell me what is ready and ask what feature I want to build next in my area.
