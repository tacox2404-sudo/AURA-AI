# 🏠 OurPlace

A cozy low-poly 3D home you build with your partner, friends or family, wherever they are.
Hang out live or at different times, play small games, plan trips, keep memories.

**Play the latest version:** https://play-aura.netlify.app
(demo mode until Supabase is set up: accounts live in your browser only)

**On your phone:** open the link, then *Share → Add to Home Screen* (iPhone, in Safari) or *⋮ → Install app* (Android, in Chrome). It opens full screen like an app, with its own icon. Log in once inside the app and it remembers you.

**New to the team?** Start with [docs/TEAM_START.md](docs/TEAM_START.md).

## Run it

```bash
npm install
npm run dev
```

It starts in **demo mode** (no accounts needed, data stays in your browser). To play
with two players on one computer, open two windows and create two accounts. To play
across phones, follow [docs/SETUP.md](docs/SETUP.md).

## For the team

| Read this | Why |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | Team rules. Claude Code reads it automatically. |
| [docs/PLAN.md](docs/PLAN.md) | What we're building and what's out of scope |
| [docs/CONTRACTS.md](docs/CONTRACTS.md) | How the four areas talk to each other |
| [docs/prompts/](docs/prompts/) | Your kickoff prompt for Claude Code |
| [docs/SETUP.md](docs/SETUP.md) | Supabase, AI and publishing setup |
| [docs/LOG.md](docs/LOG.md) | What changed, session by session |

## Folders

```
src/
  core/        shared (lead): event bus, store, backends (demo + Supabase), UI helpers
  world/       World: 3D scene, camera, avatars, walking, wardrobe
  build/       Building: furniture catalog, build mode, rooms, templates, AI rooms
  social/      Social: login, onboarding, houses, invites, chat, presence, points
  activities/  Activities: games, gallery, calendar, wish list, weather, movies, travel…
supabase/      database schema + edge functions (AI rooms, link previews)
docs/          plan, contracts, setup, prompts, log
```

Credits: weather by [Open-Meteo](https://open-meteo.com) (CC BY 4.0). Non-commercial project.
