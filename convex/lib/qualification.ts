/**
 * Shared qualification gates for streaks, achievements, and ranking.
 * Rank eligibility lives in leaderboardEligibility.ts (stricter WPM cap).
 */

export const MIN_DURATION_MS = 30000; // 30 seconds
export const MIN_CORRECT_WORDS = 50;

/**
 * Check if a test qualifies for streak counting.
 * Qualification: duration >= 30s OR wordsCorrect >= 50
 */
export function qualifiesForStreak(
  duration: number,
  wordsCorrect: number
): boolean {
  return duration >= MIN_DURATION_MS || wordsCorrect >= MIN_CORRECT_WORDS;
}

/**
 * Check if a test qualifies for non-exempt achievement counting.
 * Qualification: (duration >= 30s OR wordsCorrect >= 50) AND accuracy >= 90%
 * This is NOT the anti-cheat isValid flag. Exempt badges skip this gate.
 */
export function qualifiesForAchievement(
  duration: number,
  wordsCorrect: number,
  accuracy: number
): boolean {
  const meetsDurationOrWords =
    duration >= MIN_DURATION_MS || wordsCorrect >= MIN_CORRECT_WORDS;
  const meetsAccuracy = accuracy >= 90;
  return meetsDurationOrWords && meetsAccuracy;
}
