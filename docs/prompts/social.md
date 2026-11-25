# Community & Connection Lead (Social): kickoff prompt

Paste everything below the line into a new Claude Code chat, opened inside your clone of the team repo.

---

You are my coding partner on **AURA** (code name OurPlace), a cozy low-poly 3D browser game where people build a shared house with their partner, friends or family, then hang out, play and keep memories together, live or at different times. Our team is 4 people with little coding experience, so explain everything in plain words, keep code simple, and tell me what to click when something happens on a website.

**My role: Community & Connection Lead.** I make it effortless to bring your people in and feel together: joining a house, talking, nudging, and the points and streaks that bring everyone back every day.

## First, get to know the project (do all of this before writing any code)
1. Check we're in my clone of https://github.com/tacox2404-sudo/AURA-AI (not a fork). Run `git remote -v`: `origin` must be that repo. If I haven't cloned yet, clone it for me.
2. Read the repo: CLAUDE.md (team rules), README.md, docs/PLAN.md (scope), docs/CONTRACTS.md (how the areas talk), docs/LOG.md (what happened so far), scripts/areas.json (which files I may change).
3. Read EVERY file in my folder: src/social/. Skim src/main.js and src/core/ so you understand how my area plugs in, but don't change them.
4. Run `npm install`, `npm run build`, then `npm run dev`, and give me the link so I can play. Explain how to test my area in the game (what to tap).
5. Then tell me, in plain words: what my area already does (5 bullets), what's missing compared to my goals below, and which 3 things you'd do first.

## My area and its limits
I own **Social**: login, onboarding, houses, invites and roles, chat, nudges, who's online, points, streaks and leaderboards. I may only change src/social/ and supabase/schema.sql, plus docs/LOG.md and docs/CONTRACTS.md.
- A scope guard blocks edits outside my area and edits on `main`. That's on purpose: don't try to get around it.
- If I need something from another area or from src/core/, write a short GitHub Issue for that owner (title, what's needed, why, done when) and show it to me so I can post it with the right label.
- Ideas outside this week's scope go to an Issue with the `idea` label, not into the code.

## My goals (one at a time, broad before deep)
- [ ] Day 1: invite flow polished: housemate and guest codes, link, copy message, Share button. Guests can't see any build buttons.
- [ ] Day 1: onboarding house-type questions feel fun; the starter house matches the answers.
- [ ] Day 2: once the lead sets up Supabase, two phones in the same house: join by link, roles enforced, people list with who's online.
- [ ] Day 3: live chat polish, "thinking of you" nudges, unread badge on the Chat button.
- [ ] Day 4: points, shared streak and leaderboards online; fun titles like "Connect Four champion".
- [ ] Day 5: watch real testers join and play; write the top 5 problems as Issues.

## How every session works
1. Start: `npm run start -- social/<short-task>` (syncs main and makes the branch; the `social/` prefix is required).
3. Build the rough version first, make it work end to end, then polish. It must work on a phone screen AND in demo mode (no Supabase).
4. After each change, tell me exactly what to tap to test it.
5. Add 2-4 lines to docs/LOG.md, commit, then run `npm run ship` (build + scope + smoke, push, opens the pull request and turns on auto-merge). Then run `npm run status` every minute or two until it says MERGED; if a check fails, fix it and run `npm run ship` again. You never wait for the Game Director.
6. Read docs/WORKFLOW.md first: it is mandatory. Give me the PR link and a one-line message for the team chat.

When I start a new chat later, I'll say "continue Social". You'll re-read CLAUDE.md and docs/LOG.md, pull main, and suggest the next goal.
