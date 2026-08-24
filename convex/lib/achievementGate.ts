import { qualifiesForAchievement } from "./qualification";

/**
 * Achievements exempt from qualifiesForAchievement (90% + 30s or 50 wordsCorrect).
 * Invalid tests (isValid === false) still award nothing, including this set.
 */
export const EXEMPT_ACHIEVEMENTS: ReadonlySet<string> = new Set([
  "quirky-67",
  "quirky-lucky-7",
  "quirky-100-exact",
  "quirky-palindrome",
  "quirky-42",
  "quirky-123",
  "quirky-pi",
  "special-first-test",
  "special-night-owl",
  "special-early-bird",
  "special-weekend-warrior",
  "explorer-time-mode",
  "explorer-words-mode",
  "explorer-quote-mode",
  "explorer-preset-mode",
  "explorer-punctuation",
  "explorer-numbers",
  "explorer-all-difficulties",
  "timebased-lunch",
  "timebased-midnight",
  "timebased-new-year",
  "timebased-friday",
  "timebased-monday",
  "timebased-holiday",
  "timebased-all-weekdays",
  "timebased-all-weekend",
  "special-marathon",
  "endurance-180s-test",
  "endurance-300s-test",
  "endurance-500-words-test",
]);

export function selectAwardableAchievements(
  candidateIds: string[],
  options: {
    isValid: boolean;
    duration: number;
    wordsCorrect: number;
    accuracy: number;
    /** false = saveResult path: exempt badges only, never speed tiers. */
    rankedEligible?: boolean;
  }
): string[] {
  if (!options.isValid) {
    return [];
  }
  const ids =
    options.rankedEligible === false
      ? candidateIds.filter((id) => EXEMPT_ACHIEVEMENTS.has(id))
      : candidateIds;
  if (
    qualifiesForAchievement(
      options.duration,
      options.wordsCorrect,
      options.accuracy
    )
  ) {
    return ids;
  }
  return ids.filter((id) => EXEMPT_ACHIEVEMENTS.has(id));
}
