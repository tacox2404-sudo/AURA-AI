# How we work (mandatory, 1 page)

Five people, one game. Everyone owns one **area** and only touches that folder, so we
never block each other. Everything reaches the live game through a pull request.

| Area | Folder | Branch prefix | Person |
| --- | --- | --- | --- |
| World | `src/world/` | `world/` | World & Avatar Designer |
| Building | `src/build/`, `supabase/functions/` | `build/` | Home Builder & AI Architect |
| Social | `src/social/`, `supabase/schema.sql` | `social/` | Community Lead (also the Game Director) |
| Activities | `src/activities/` | `activities/` | Games & Moments Designer |
| Core | `src/core/`, `src/main.js`, `src/styles.css`, `index.html`, `.claude/`, `scripts/`, `tests/`, `.github/` | `core/` | Game Director only |

## The loop (every feature, every time)

```bash
npm run start -- <area>/<short-task>   # e.g. world/walk-animation: syncs main, makes your branch
# ...build the feature with Claude, test it with npm run dev...
npm run ship                           # build + scope + smoke, LOG line check, push, open the PR
```

`npm run ship` also turns on **auto-merge**: when the 3 checks pass, your PR merges into `main` by itself and the
live game updates. You do not wait for anyone. Follow it with:

```bash
npm run status     # ⏳ running / ✅ merged / ❌ failed (with a link to what failed)
```

Red check? Fix it on your branch, commit, `npm run ship` again. When status says MERGED you are done; share the PR link
in the team chat and start the next task with `npm run start` again. The Director still looks at what lands
and can revert anything, but never blocks you.

## Rules that keep us fast

1. **Stay in your folder.** The scope guard blocks other files. Need a change somewhere
   else (another area, or `src/core/`)? Ask your Claude to write a short Issue text
   (title, what, why), post it on GitHub with the target's `area:` label, and keep going.
2. **Small and often.** Branches live 1-2 days. One feature per branch. Merged work is
   what other teams can use, so ship early, even rough.
3. **Talk through contracts.** Areas never import each other. Use events, services and
   shared data from `docs/CONTRACTS.md`. New event or service? Add it to that file in the same PR.
4. **Never push to `main`.** It is protected: only a pull request with green checks gets in.
5. **Demo mode and phones always work.** Test with `npm run dev` on a 390px-wide screen.
6. **Read other teams' work** with `git pull` (merged) or `git fetch` + `git checkout <their-branch>`
   (in progress; look, don't edit). Full list of branches: GitHub -> Branches.
7. **Red check = fix it on your branch** and run `npm run ship` again. Don't ask for a merge on red (auto-merge only merges green PRs).
8. **Update the log.** 2-4 lines in `docs/LOG.md` per PR (the ship command checks).

## If you're stuck
Don't fight the guards. Write what's blocking you as an Issue (labels `area:...`) and tell the Director.
