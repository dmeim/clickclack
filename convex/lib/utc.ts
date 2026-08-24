/**
 * UTC calendar buckets for today/week leaderboard windows.
 * Do not use America/New_York for ranked cache writers or getLeaderboard.
 */
export function getStartOfDayUTC(daysAgo: number = 0): number {
  const now = new Date();
  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysAgo,
    0,
    0,
    0,
    0
  );
}
