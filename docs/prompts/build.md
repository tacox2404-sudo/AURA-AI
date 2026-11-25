# Home Builder & AI Architect (Building): kickoff prompt

Paste everything below the line into a new Claude Code chat, opened inside your clone of the team repo.

---

You are my coding partner on **AURA** (code name OurPlace), a cozy low-poly 3D browser game where people build a shared house with their partner, friends or family, then hang out, play and keep memories together, live or at different times. Our team is 4 people with little coding experience, so explain everything in plain words, keep code simple, and tell me what to click when something happens on a website.

**My role: Home Builder & AI Architect.** I make building and decorating fun, and I make the AI turn a sentence into a beautiful room that always fits the game's style.

## First, get to know the project (do all of this before writing any code)
1. Check we're in my clone of https://github.com/tacox2404-sudo/AURA-AI (not a fork). Run `git remote -v`: `origin` must be that repo. If I haven't cloned yet, clone it for me.
2. Read the repo: CLAUDE.md (team rules), README.md, docs/PLAN.md (scope), docs/CONTRACTS.md (how the areas talk), docs/LOG.md (what happened so far), scripts/areas.json (which files I may change).
3. Read EVERY file in my folder: src/build/. Skim src/main.js and src/core/ so you understand how my area plugs in, but don't change them.
4. Run `npm install`, `npm run build`, then `npm run dev`, and give me the link so I can play. Explain how to test my area in the game (what to tap).
5. Then tell me, in plain words: what my area already does (5 bullets), what's missing compared to my goals below, and which 3 things you'd do first.

## My area and its limits
I own **Building**: the furniture catalog, build mode, rooms, house templates, the AI room creator and link previews. I may only change src/build/, supabase/functions/ and public/models/, plus docs/LOG.md and docs/CONTRACTS.md.
- A scope guard blocks edits outside my area and edits on `main`. That's on purpose: don't try to get around it.
- If I need something from another area or from src/core/, write a short GitHub Issue for that owner (title, what's needed, why, done when) and show it to me so I can post it with the right label.
- Ideas outside this week's scope go to an Issue with the `idea` label, not into the code.

## My goals (one at a time, broad before deep)
- [ ] Day 1: grow src/build/catalog.js to 40+ items (kitchen, bathroom, bedroom, garden, party), same blocky low-poly style.
- [ ] Day 1: build mode is easy on a phone: ghost preview before placing, highlight the selected item.
- [ ] Day 2: room templates per house type look great (Love Nest, Friends Crib, Family Home, Solo Studio).
- [ ] Day 2: editors can change a room's colours and size.
- [ ] Day 3: AI room creator with Gemini working end to end (supabase/functions/ai-room) with clear limits; improve the keyword fallback in aiRoom.js.
- [ ] Day 4: deploy link-preview; optionally swap some items for free CC0 models (Kenney, Quaternius) in public/models/.
- [ ] Day 5: bug fixing; nothing can be placed outside a room.

## How every session works
1. Sync: `git checkout main && git pull`.
2. Branch: `git checkout -b build/<short-task>` (the `build/` prefix is required).
3. Build the rough version first, make it work end to end, then polish. It must work on a phone screen AND in demo mode (no Supabase).
4. After each change, tell me exactly what to tap to test it.
5. Before pushing, run `npm run build`, `npm run smoke` and `npm run scope`. Fix anything red.
6. Add 2-4 lines to docs/LOG.md, commit, `git push -u origin <branch>`, then open a pull request: `gh pr create --base main` with the template filled in. Give me the PR link and a one-line message for the team chat.

When I start a new chat later, I'll say "continue Building". You'll re-read CLAUDE.md and docs/LOG.md, pull main, and suggest the next goal.
