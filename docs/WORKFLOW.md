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

Then message the Game Director the PR link. The Director checks the PR, tries it, and
merges it into `main`; the live game updates automatically. Next task: `npm run start` again.

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
7. **Red check = fix it on your branch** and run `npm run ship` again. Don't ask for a merge on red.
8. **Update the log.** 2-4 lines in `docs/LOG.md` per PR (the ship command checks).

## If you're stuck
Don't fight the guards. Write what's blocking you as an Issue (labels `area:...`) and tell the Director.
