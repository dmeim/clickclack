import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up expired typing sessions every 5 minutes
crons.interval(
  "cleanupExpiredSessions",
  { minutes: 5 },
  internal.sessionCleanup.cleanupExpiredSessions
);

// Prune stale leaderboard cache entries daily at 5:00 AM ET
// This cleans up "today" and "week" entries that have aged out
crons.daily(
  "pruneStaleLeaderboardEntries",
  { hourUTC: 10, minuteUTC: 0 }, // 10:00 UTC = 5:00 AM ET (accounting for DST varies)
  internal.statsCache.pruneStaleLeaderboardEntries
);

export default crons;
