import { describe, it, expect } from "vitest";
import { selectAwardableAchievements } from "../../convex/lib/achievementGate";
import { getQualifyingAchievementIds } from "../../convex/achievementThresholds";

describe("achievement gating", () => {
  it("awards nothing on invalid tests, including exempt IDs", () => {
    const awarded = selectAwardableAchievements(
      ["special-first-test", "explorer-time-mode", "speed-copper-1"],
      {
        isValid: false,
        duration: 30_000,
        wordsCorrect: 80,
        accuracy: 100,
      }
    );
    expect(awarded).toEqual([]);
  });

  it("keeps exempt badges on a valid 10s messy test", () => {
    const awarded = selectAwardableAchievements(
      ["special-first-test", "explorer-time-mode", "speed-emerald-5", "quirky-42"],
      {
        isValid: true,
        duration: 10_000,
        wordsCorrect: 8,
        accuracy: 70,
      }
    );
    expect(awarded).toEqual([
      "special-first-test",
      "explorer-time-mode",
      "quirky-42",
    ]);
  });

  it("awards speed tiers on a valid 30s 90% 180 WPM test", () => {
    const speedIds = getQualifyingAchievementIds("speed", 180);
    expect(speedIds).toContain("speed-copper-1");
    expect(speedIds).toContain("speed-emerald-5");

    const awarded = selectAwardableAchievements(
      [...speedIds, "explorer-time-mode"],
      {
        isValid: true,
        duration: 30_000,
        wordsCorrect: 40,
        accuracy: 90,
      }
    );
    expect(awarded).toEqual(expect.arrayContaining(speedIds));
    expect(awarded).toContain("explorer-time-mode");
  });

  it("skips non-exempt speed tiers when rankedEligible is false", () => {
    const speedIds = getQualifyingAchievementIds("speed", 180);
    const awarded = selectAwardableAchievements(
      [...speedIds, "explorer-time-mode", "special-first-test"],
      {
        isValid: true,
        rankedEligible: false,
        duration: 30_000,
        wordsCorrect: 80,
        accuracy: 95,
      }
    );
    expect(awarded).toContain("explorer-time-mode");
    expect(awarded).toContain("special-first-test");
    for (const id of speedIds) {
      expect(awarded).not.toContain(id);
    }
  });
});
