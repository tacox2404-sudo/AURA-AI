# Team log

Newest at the bottom. 2-4 lines per session: date, area, what changed, what's next.

- 2026-11-25 · all · Working base created: 3D rooms, avatars + wardrobe, build mode, AI/keyword rooms, house types + onboarding, invites with housemate/guest codes, live presence, chat + nudges, points + streak + records, Connect Four, Tic-Tac-Toe, Draw & Guess, gallery, calendar, wish list, weather, movies, travel, link boards, notes, portals. Demo mode + Supabase backend. Next: each owner starts their kickoff prompt.
- 2026-11-25 · core · Moved to forks + safety nets: Claude Code scope guard hook (.claude/), PR checks (build + scope + smoke test), npm run smoke/scope/check, role titles and new kickoff prompts for all 5 roles, TEAM_START.md. Next: Game Director turns on Pages + ruleset, everyone forks and starts.
- 2026-11-25 · core · Dropped forks: everyone clones the team repo and pushes short-lived <area>/<task> branches; only the lead merges into main. Updated CLAUDE.md, TEAM_START, SETUP, all prompts and the deny list. Next: Game Director sets the main ruleset and invites collaborators.
- 2026-11-25 · core · One-command workflow: npm run start / npm run ship, SessionStart reminder hook, docs/WORKFLOW.md, mandatory rules in CLAUDE.md. Next: invite collaborators, Supabase.
- 2026-11-25 · social · Supabase project live (eu). schema.sql now grants API access to signed-in players (new Supabase projects don't by default). Next: test sign-up + invites on two phones.
- 2026-11-25 · social · Friendlier errors (wrong password, taken username, bad code), invite welcome on the login screen, 'You joined...' message, fixed old invite code staying pre-filled, added ping() for the keep-alive. Next: roles (promote guest, remove member, leave house) needs backend + schema, via a core branch.
- 2026-11-25 · core · Smoke test now builds a demo-only copy (never touches real Supabase) and checks housemate/guest invite links give the right role. Added weekly keep-alive workflow so the free Supabase project never pauses (needs ping() from schema.sql). Next: social invite polish + roles.
- 2026-11-25 · social · schema.sql: set_member_role, remove_member, leave_house functions (rules: housemates handle guests, only the owner handles housemates, owner can't be removed or leave). Next: backend methods (core), then People panel buttons.
- 2026-11-25 · core · Backend API: setMemberRole, removeMember, leaveHouse in local.js and supabase.js (same rules as the SQL functions), documented in CONTRACTS.md. Next: People panel buttons + Leave house (social).
- 2026-11-25 · social · People panel: promote/demote/remove buttons (with confirm), 'Leave this house' in the menu, removed members are sent back to the house list. Next: smoke step, then login page + friends.
