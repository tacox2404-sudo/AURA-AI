# Setup guide (about 30 minutes, once)

You can play in **demo mode** right away (step 1 only). Steps 2-5 make it work across
different phones. The lead does steps 2-5; everyone else just does step 1.

## 1. Everyone: get the code running

1. Install [Node.js](https://nodejs.org) (the LTS version) and Git.
2. Clone the team repo directly (everyone, lead included; the lead invites teammates as collaborators first). In a terminal:
   ```bash
   git clone https://github.com/tacox2404-sudo/AURA-AI.git
   cd AURA-AI
   npm install
   npm run dev
   ```
3. Open the link it prints. To test on your phone on the same Wi-Fi, use the
   "Network" link.
4. Start Claude Code inside the `AURA-AI` folder (`claude`) and paste your kickoff
   prompt from `docs/prompts/`.

## 2. Lead: the GitHub repo (done)

The repo is https://github.com/tacox2404-sudo/AURA-AI (public, so GitHub Pages is free).
Labels and the Day 1 issues are already created. Still to do:
- Settings → Collaborators → invite the other three.

## 3. Lead: Supabase (accounts + live play)

1. Sign up at [supabase.com](https://supabase.com) and create a project (free plan).
2. **SQL Editor** → New query → paste all of `supabase/schema.sql` → Run.
3. **Authentication → Sign In / Providers → Email**: keep Email on, turn
   **"Confirm email" OFF**. (We use username + password; no emails are sent.)
4. **Project Settings → API**: copy the Project URL and the `anon` public key.
5. Create a file `.env.local` in the project folder (never commit it):
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
6. Restart `npm run dev`. The login screen no longer says "Demo mode".
7. Organization → Team: invite the other three so they can see the dashboard.

## 4. Lead: AI rooms + link previews (optional, free)

1. Get a free Gemini API key at [Google AI Studio](https://aistudio.google.com).
2. In the project folder:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your project ref>
   npx supabase secrets set GEMINI_API_KEY=<key>
   npx supabase secrets set GEMINI_MODEL=<a Flash model id copied from AI Studio>
   npx supabase functions deploy ai-room
   npx supabase functions deploy link-preview
   ```
   Without this, rooms are made by the built-in keyword generator, which is fine for testing.

## 5. Lead: publish the game (GitHub Pages)

1. Repo Settings → Pages → Source: **GitHub Actions**.
2. Repo Settings → Secrets and variables → Actions → **Variables**: add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the anon key is safe to be public;
   the database rules in `schema.sql` protect the data).
3. Every merge to `main` now publishes to https://tacox2404-sudo.github.io/AURA-AI/.
   Share that link with testers.

## Free-tier notes

- Supabase free projects pause after 7 days with no activity; open the dashboard to wake them.
- Gemini's free tier has small daily limits; if AI rooms stop working, the keyword
  generator takes over automatically.
- Weather (Open-Meteo) and movies (TMDB) are free for non-commercial use only.
