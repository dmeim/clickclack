# Anti-cheat / leaderboard integrity tracker

This file tracks solo-home anti-cheat and leaderboard integrity. It is separate from `docs/TODO.md` (platform master TODO). Check a box when the work ships. Reply in chat with next steps.

## Local Convex (`bun run convex:dev`)

`npx convex codegen` / `convex dev` need these **Convex dashboard** env vars (not `VITE_`, not git):

- `CLERK_JWT_ISSUER_DOMAIN` — Clerk JWT issuer URL (Frontend API), e.g. `https://<your-instance>.clerk.accounts.dev`
- `ADMIN_PASSWORD` — password for `/admin` (never commit it)

Until `CLERK_JWT_ISSUER_DOMAIN` is set, codegen cannot refresh `convex/_generated` (`api.admin` stays a frontend cast). Frontend already uses `ConvexProviderWithClerk` when `VITE_CLERK_PUBLISHABLE_KEY` is present.

## Constraints (decided)

- Rank gate is **server-enforced**, not UI copy: `accuracy >= 90` AND (`duration >= 30000` OR `wordsCorrect >= 50`). Apply in `getLeaderboard` **and** cache writers. 15s tests stay valid for history / PBs / exempt achievements; they **do not rank**.
- Use `wordsCorrect`, never `wordCount`, for the 50-word rank gate.
- 170–200 WPM is always valid. Hard cap is **300** only. No auto-invalid at 150 or 220. If a review queue exists, floor is **≥250**, never 150/220.
- Gross WPM (`convex/lib/computeStats.ts` `calculateWpm`: typed length / 5 / minutes). UTC dates stay UTC (`convex/testResults.ts` and `convex/statsCache.ts` bucket today/week with `getStartOfDayUTC`).
- Do not touch old scores. No legacy status field. No backfill. Owner deletes bad Convex rows by hand.
- Highest valid stat per type.
- Invalid tests award **no** achievements. `isValid` ≠ `qualifiesForAchievement` (`convex/streaks.ts`).
- Solo home only. Do not touch Connect, Race, or classroom.
- Do not block keystrokes on network (heartbeats / finalize are fire-and-forget).
- Admin password: never put the real password in this repo. Convex env `ADMIN_PASSWORD` walkthrough is later, not blocking.

## Out of scope (recap)

Connect (`src/pages/Connect.tsx`, `Host.tsx`, `Join.tsx`), Race (`src/pages/Race.tsx`, `RaceLobby.tsx`, `RaceActive.tsx`, `RaceResults.tsx`, `convex/raceResults.ts`), classroom (not in this repo), guest UX beyond “unsigned tests cannot rank,” and any rewrite of `docs/TODO.md`.

---

## Achievement pitfalls

`isValid` = anti-cheat / persist flag. `qualifiesForAchievement` = 90% + (30s OR 50 `wordsCorrect`). Gating **all** badges on the rank formula makes first-test, explorer, quirky, night-owl, zen, 15s, and endurance-exempt badges impossible.

Invalid tests: skip `checkAndAwardAchievements` / `updateStreak` entirely (already the pattern in `convex/typingSessions.ts` `finalizeSession`). Do not also require `qualifiesForAchievement` for exempt IDs.

**Keep awardable on a valid 15s / short / quirky / zen test** (`EXEMPT_ACHIEVEMENTS` in `convex/achievements.ts`):

- First test: `special-first-test`
- Time-of-day / special: `special-night-owl`, `special-early-bird`, `special-weekend-warrior`
- Explorer (no zen explorer ID exists — zen is a mode, not a badge): `explorer-time-mode`, `explorer-words-mode`, `explorer-quote-mode`, `explorer-preset-mode`, `explorer-punctuation`, `explorer-numbers`, `explorer-all-difficulties`
- Quirky: `quirky-67`, `quirky-lucky-7`, `quirky-100-exact`, `quirky-palindrome`, `quirky-42`, `quirky-123`, `quirky-pi`
- Time-based: `timebased-lunch`, `timebased-midnight`, `timebased-new-year`, `timebased-friday`, `timebased-monday`, `timebased-holiday`, `timebased-all-weekdays`, `timebased-all-weekend`
- Endurance-exempt (inherently long; still must not require extra rank filters): `special-marathon`, `endurance-180s-test`, `endurance-300s-test`, `endurance-500-words-test`

Zen: relaxed validation only (no duration/word-target fail). Short tests: valid 15s can still earn the exempt set above.

---

## Phase 0 — Honesty and hard caps

- [x] `convex/testResults.ts` `saveResult`: if WPM > 300, persist with `isValid: false` + `invalidReason`; do not clamp to 299
- [x] Stop hardcoding `isValid: true` into stats cache (`saveResult` → `internal.statsCache.updateUserStatsCache`)
- [x] Rank filter in `getLeaderboard` **and** cache writers (`convex/statsCache.ts`: `updateLeaderboardCache`, `rebuildLeaderboardCacheForUser`, `updateLeaderboardCacheAfterDeletion`): `isValid !== false`, `accuracy >= 90`, `wpm <= 300`, (`duration >= 30000` OR `wordsCorrect >= 50`). Use `wordsCorrect`, not `wordCount`
- [x] `src/pages/About.tsx` and `src/pages/Leaderboard.tsx` copy matches the shipped query (90% + 30s / 50 words is true in both; Leaderboard already claims it, `getLeaderboard` does not yet enforce duration/words)

## Phase 1 — Server ranking (solo home only)

- [x] Repair `convex/typingSessions.ts` vs `typingSessions` in `convex/schema.ts` (schema comment still says `startedAt` on first `recordProgress`; insert sets it immediately)
- [x] Wire sessions from `src/components/typing/TypingPractice.tsx` only when `!connectMode`; fire-and-forget (`startSession` / `recordProgress` / `finalizeSession`). Remove the “save directly without session validation” bypass
- [x] Heartbeats required in time mode (min 3; 15s can meet it). Today `validateSession` skips `MIN_PROGRESS_EVENTS` for time mode — stop skipping
- [x] Ranked WPM from **server elapsed** + gross `computeStats` / `calculateWpm` (`convex/lib/computeStats.ts`). Do not rank on client elapsed
- [x] Server-owned target text for ranked time/words
- [x] `saveResult` cannot rank (history/PBs/exempt path only; no leaderboard cache write)
- [x] Zen: relaxed validation (universal cap + burst; no duration/word-target fail)
- [x] Achievements/streaks only if `isValid`; valid 15s can still get exempt badges (see pitfalls)
- [x] `lastResultIsValid` in `TypingPractice.tsx` comes from `finalizeSession`, not a client guess

## Phase 2 — Paste/bots without punishing 170–200

- [x] Solo `onPaste` `preventDefault` in `TypingPractice.tsx` (`connectMode` unchanged)
- [x] Burst time-scaled at 25 cps = 300 WPM (`convex/lib/antiCheatConstants.ts` already has `MAX_CHARS_PER_SECOND = 25`, `MAX_WPM = 300`). Replace flat `MAX_BURST_CHARS` fail that punishes fast typists
- [x] Never a 15–18 cps cap
- [x] Optional admin review queue **≥250 WPM only** (never 150/220)
- [x] Do not flag 100% accuracy or consistent 180 WPM

## Phase 3 — Auth/rate limits (solo only)

- [x] Clerk + Convex `auth.config` + `ConvexProviderWithClerk` in `src/main.tsx` (today: `ConvexProvider` + optional `ClerkProvider`, no `auth.config`)
- [x] Server identity via `ctx.auth`, not client `clerkId` args on finalize/`saveResult`
- [x] Rate-limit `finalizeSession` / `saveResult`; still allow 15s grinding

## Phase 4 — /admin

- [x] `/admin` page (new route in `src/App.tsx`); **not** in public nav (`src/components/layout/Header.tsx` `NAV_TABS`)
- [x] Server checks Convex env `ADMIN_PASSWORD`; session token; no `VITE_` secret
- [ ] **Later (not blocking):** walkthrough for the owner on setting Convex env `ADMIN_PASSWORD` (do not put the real password in this file or the repo)
- [x] List invalid results + high WPM ≥250; mark valid/invalid; rebuild **that user’s** cache only (`rebuildUserStatsCacheForUser` / `rebuildLeaderboardCacheForUser` in `convex/statsCache.ts`)
- [x] Rate-limit admin login

## Phase 5 — Tests and copy

- [x] Achievement regression tests (exempt vs rank gate vs `isValid`; IDs in pitfalls)
- [x] Anti-cheat unit tests (`tests/unit/`; constants, burst cps, rank eligibility, WPM cap persist-not-clamp)
- [x] About + Leaderboard copy aligned with shipped rank query
- [x] Short feature doc, **solo only** (e.g. `docs/features/`; do not describe Connect/Race)
- [ ] Handoff: `bun run build && bun run test:run`. Manual: 15s unranked; 30s 180 WPM ranked; paste blocked; Connect/Race unchanged; `/admin` without password fails

---

## Explicitly not doing

- Connect, Race, classroom, or any `connectMode` anti-cheat
- Blocking keystrokes while Convex/network is slow
- Auto-invalid at 150 or 220 WPM; 15–18 cps caps; flagging 100% acc or steady 180 WPM
- Clamping WPM to 299 instead of persisting invalid
- Ranking 15s tests; ranking `saveResult` client-trusted WPM
- Using `wordCount` for the 50-word gate
- Making first-test / explorer / quirky / zen / short-test / time-of-day / endurance-exempt badges require the rank formula
- Touching old Convex rows, legacy status, or backfill migrations
- Putting `ADMIN_PASSWORD` (or any real secret) in git, `VITE_` env, or this file
- Adding `/admin` to Header nav
- Rewriting `docs/TODO.md` or implementing product code from this tracker until the owner picks a next step
