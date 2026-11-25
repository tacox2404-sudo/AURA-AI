# Welcome to AURA: start here (20 minutes)

## 1. Play it first (5 min, phone or laptop)

Open **https://tacox2404-sudo.github.io/AURA-AI/**

1. Create an account (any username + password).
2. Create a house: pick a house type, a name, a vibe.
3. Make your avatar in 👕 Wardrobe, then visit every room with the tabs at the top.
4. Tap furniture: the arcade, the Connect Four table, the easel, the gift box, the globe, the photo frame…
5. Try 🛠️ Build (place, move, rotate) and 🚪 Rooms → "Create room" with a sentence like "spa room".
6. **Play as two people:** open a second browser window, ☰ → Log out, create a second
   account, and join with the code from 👥 People.

Right now it's **demo mode**: your houses live in your browser only. Playing across
phones comes once the Game Director sets up Supabase.

While you play, note 3 things in **your area** you'd improve.

## 2. Your role

| Role | Area | You own | Your prompt |
| --- | --- | --- | --- |
| 🎬 Game Director | Lead | Merging, Supabase, the shared core, safety nets | [lead.md](prompts/lead.md) |
| 🌍 World & Avatar Designer | World | 3D scene, camera, avatars, walking, wardrobe | [world.md](prompts/world.md) |
| 🛠️ Home Builder & AI Architect | Building | Furniture, build mode, rooms, AI room creator | [build.md](prompts/build.md) |
| 💬 Community & Connection Lead | Social | Login, onboarding, invites, chat, points | [social.md](prompts/social.md) |
| 🎲 Games & Moments Designer | Activities | Games, gallery, calendar, wish list, travel… | [activities.md](prompts/activities.md) |

Your Day 1 task is on the [Issues board](https://github.com/tacox2404-sudo/AURA-AI/issues) under your area's label.

## 3. Set up your copy (10 min)

1. Install [Node.js](https://nodejs.org) (LTS), [Git](https://git-scm.com), the [GitHub CLI](https://cli.github.com) (then run `gh auth login`) and Claude Code.
2. Accept the collaborator invitation the Game Director sent you (email or github.com notifications).
3. In a terminal:
   ```bash
   git clone https://github.com/tacox2404-sudo/AURA-AI.git
   cd AURA-AI
   npm install
   claude
   ```
4. Read [WORKFLOW.md](WORKFLOW.md) (1 page). Then open your prompt file above, copy everything under the line, and paste it into Claude.
   Claude reads the repo and the team rules, runs the game for you, and plans your first goal.
5. Next days: start a new chat with [continue.md](prompts/continue.md).

## 4. How we keep the game from breaking

- **You work in your own clone**, on a branch named after your area (`world/…`, `build/…`, `social/…`, `activities/…`). You push it to the team repo so everyone can read it; only the Game Director merges into `main`.
- **Claude can only edit your area's folder.** A guard blocks anything else. If you need something from another area, Claude writes an Issue for them instead.
- **Every pull request is checked automatically:** it must build, only touch your area, and pass a robot playtest of the whole game. Red check = fix it before it gets merged.
- **Merge small, every day.** Ideas for later go on the board with the `idea` label.
