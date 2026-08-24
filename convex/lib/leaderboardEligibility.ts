import { MAX_WPM } from "./antiCheatConstants";
import { MIN_CORRECT_WORDS, MIN_DURATION_MS } from "./qualification";

export interface LeaderboardCandidate {
  isValid?: boolean;
  accuracy: number;
  wpm: number;
  duration: number;
  /** Prefer wordsCorrect. Never use wordCount for the 50-word rank gate. */
  wordsCorrect?: number;
  /**
   * Ranked path only (finalizeSession).
   * false = saveResult / unranked write (never ranks).
   * omitted = legacy row; keep prior eligibility (isValid !== false + gates).
   */
  rankedEligible?: boolean;
}

/**
 * Ranked-leaderboard eligibility.
 * New saveResult rows set rankedEligible: false and never rank.
 * Legacy rows with the field omitted still count (isValid !== false + gates).
 * 15s tests can be valid history but do not rank unless wordsCorrect >= 50.
 */
export function isLeaderboardEligible(result: LeaderboardCandidate): boolean {
  if (result.rankedEligible === false) return false;
  if (result.isValid === false) return false;
  if (result.accuracy < 90) return false;
  if (result.wpm > MAX_WPM) return false;
  const wordsCorrect = result.wordsCorrect ?? 0;
  return result.duration >= MIN_DURATION_MS || wordsCorrect >= MIN_CORRECT_WORDS;
}

/**
 * Validity for unranked saveResult writes.
 * Persist the real WPM; never clamp to 299. Over-cap rows are invalid.
 */
export function validityForUnrankedSave(wpm: number): {
  isValid: boolean;
  invalidReason: string | undefined;
} {
  if (wpm > MAX_WPM) {
    return {
      isValid: false,
      invalidReason: `WPM exceeds maximum: ${Math.round(wpm)} > ${MAX_WPM}`,
    };
  }
  return { isValid: true, invalidReason: undefined };
}
