# AURA (code name OurPlace): rules for Claude (read this first, every session)

AURA is a cozy low-poly 3D browser game where people build a shared house with
their partner, friends or family, then hang out, play and keep memories together,
live or at different times. Read `docs/PLAN.md` for the scope, and the
`docs/CONTRACTS.md` file before changing how areas talk to each other.

The team is 4 people with little coding experience. **Explain what you change in
plain words**, keep code simple and commented, and prefer working-and-rough over
perfect-and-unfinished. We go broad first, then deep.

## Who owns what

| Area | Folder | GitHub label | Owner |
| --- | --- | --- | --- |
| World | `src/world/` | `area:world` | 3D scene, camera, avatars, movement, wardrobe |
| Building | `src/build/`, `supabase/functions/` | `area:build` | Furniture catalog, build mode, rooms, house templates, AI rooms, link previews |
| Social | `src/social/`, `supabase/schema.sql` | `area:social` | Login, onboarding, houses, invites, roles, chat, presence, points |
| Activities | `src/activities/` | `area:activities` | Games, gallery, calendar, wish list, weather, movies, travel, boards |
| Lead (shared) | `src/core/`, `src/main.js`, `src/styles.css`, `index.html` | `area:core` | Bus, store, backends, UI helpers, top bar |

## Hard rules

1. **Only edit files in the area you were asked to work on.** If the task needs a change
   in another area or in `src/core/`, STOP and write a short GitHub Issue text for that
   area's owner instead (title, what's needed, why). Show it to the user.
2. **Areas never import each other's files.** They talk through:
   - events: `ctx.bus.emit(name, payload)` / `ctx.bus.on(name, fn)`
   - services: `ctx.provide('area.thing', fn)` / `ctx.use('area.thing')(...)`
   - shared state: `ctx.store` and data shapes, all listed in `docs/CONTRACTS.md`.
   Adding a new event or service is fine: add it to `docs/CONTRACTS.md` in the same PR.
3. **Demo mode must keep working.** Every feature must run without Supabase, using
   `src/core/backend/local.js`. Never call Supabase directly from an area; use `ctx.backend`.
4. **Phone first.** Every UI must work with taps on a 390px-wide screen.
5. **No secrets in code.** Keys go in `.env.local` (git-ignored) or Supabase secrets.
6. **Keep it family friendly.** Romance is fine in Love Nest houses (hearts, "thinking of
   you"), nothing sexual, no content about real people.
7. **Before finishing:** run `npm run build` and fix every error. Then add 2-4 lines to
   `docs/LOG.md` (date, area, what changed, what's next).

## Git workflow: everyone clones the team repo (do it for the user, explain each step briefly)

Everyone (lead included) clones `tacox2404-sudo/AURA-AI` directly and pushes short-lived
branches to it, so every team can read the others' work. Only the lead merges into `main`
(enforced by a branch ruleset on GitHub), so nobody can break the live game by accident.

- First time: `git clone https://github.com/tacox2404-sudo/AURA-AI.git` (the lead invites
  teammates as collaborators first).
- Start every session: `git checkout main && git pull`, then
  `git checkout -b <area>/<short-task>` (example: `world/walk-animation`).
  The area prefix is required: world/, build/, social/, activities/ (lead: core/).
- Keep branches short (merged within a day or two). No long-lived team branches: they drift apart.
- Commit small steps with clear messages. Push often with `git push -u origin <branch>`.
- To read another team's work: merged work arrives with `git pull` on main; work in
  progress with `git fetch` then `git checkout <their-branch>` (look, don't edit).
- Before the pull request: `npm run build`, `npm run smoke`, `npm run scope`. All must pass.
- Finish: open a pull request into `main`:
  `gh pr create --base main --title "..." --body "..."`
  (or the "Compare & pull request" button on GitHub). Fill in the PR template.
- Update your branch if main moved: `git pull origin main`.

## Safety nets (don't fight them)

- **Scope guard hook** (`.claude/hooks/scope-guard.mjs`): blocks edits on `main` and
  edits outside your area, based on your branch name. If it blocks you, write an Issue
  for the right area instead. Never edit the hook, `scripts/areas.json` or `.claude/`
  unless you are the lead on a `core/` branch.
- **PR checks** (`.github/workflows/check.yml`): build, scope and smoke test run on every
  pull request. A red check = not merged. Fix it on your branch and push again.
- **Smoke test** (`tests/smoke.mjs`): a robot plays the game. If you add a feature,
  you may ask the lead to add a step for it.

## Commands

- `npm install` once, then `npm run dev` (prints a local link; `--host` lets phones on
  the same Wi-Fi open it).
- `npm run build` checks everything compiles.
- `npm run smoke` plays the game automatically (after a build) and fails on any crash.
  First time only: `npx playwright install chromium`.
- `npm run scope` checks your branch only changed your area's files.
- `npm run check` = build + smoke.
- Two players locally: open two browser windows, create two accounts (demo mode syncs tabs).

## Style

- Plain JavaScript (ES modules), no TypeScript, no extra frameworks.
- UI with `ctx.ui.h(...)`, `ctx.ui.panel(...)`, `ctx.ui.toast(...)` so everything looks the same.
- Small files with a comment at the top saying what the file does and who owns it.
