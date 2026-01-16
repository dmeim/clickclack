// Achievement Thresholds Configuration
// =====================================
// This file contains all threshold values for progressive achievements.
// To adjust difficulty, simply modify the arrays below - no code changes needed!
//
// Each category has 40 total levels:
// - Copper: 10 levels (entry-level, easy increments)
// - Silver: 10 levels (moderate increments)
// - Gold: 10 levels (intermediate increments)
// - Diamond: 5 levels (hard achievements)
// - Emerald: 5 levels (expert/elite achievements)

export type AchievementTier = "copper" | "silver" | "gold" | "diamond" | "emerald";

export interface TierThresholds {
  copper: readonly number[];
  silver: readonly number[];
  gold: readonly number[];
  diamond: readonly number[];
  emerald: readonly number[];
}

// =============================================================================
// PROGRESSIVE THRESHOLDS - Edit these arrays to adjust achievement difficulty!
// =============================================================================

export const PROGRESSIVE_THRESHOLDS = {
  // Speed achievements (WPM milestones)
  speed: {
    copper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    silver: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    gold: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    diamond: [35, 40, 45, 50, 55],
    emerald: [60, 70, 80, 90, 100],
  },

  // Words achievements (cumulative correct words)
  words: {
    copper: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    silver: [150, 200, 250, 300, 350, 400, 450, 500, 550, 600],
    gold: [700, 900, 1100, 1300, 1500, 1700, 1900, 2100, 2300, 2500],
    diamond: [3000, 4000, 5000, 7500, 10000],
    emerald: [15000, 25000, 40000, 60000, 100000],
  },

  // Time achievements (cumulative minutes typed)
  time: {
    copper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    silver: [15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
    gold: [90, 120, 150, 180, 210, 240, 270, 300, 330, 360],
    diamond: [420, 600, 900, 1200, 1440], // 7h, 10h, 15h, 20h, 24h
    emerald: [1800, 3000, 4500, 6000, 9000], // 30h, 50h, 75h, 100h, 150h
  },

  // Streak achievements (consecutive days)
  streak: {
    copper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    silver: [12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    gold: [35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
    diamond: [90, 100, 120, 150, 200],
    emerald: [250, 300, 365, 500, 730], // Up to 2 years!
  },

  // Tests achievements (total tests completed)
  tests: {
    copper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    silver: [15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
    gold: [75, 100, 125, 150, 175, 200, 225, 250, 275, 300],
    diamond: [400, 500, 600, 750, 1000],
    emerald: [1250, 1500, 2000, 3000, 5000],
  },

  // Accuracy-95 achievements (tests with 95%+ accuracy)
  "accuracy-95": {
    copper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    silver: [12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    gold: [35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
    diamond: [90, 100, 120, 150, 200],
    emerald: [250, 300, 400, 500, 750],
  },

  // Accuracy-streak achievements (consecutive 100% accuracy tests)
  "accuracy-streak": {
    copper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    silver: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    gold: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    diamond: [35, 40, 45, 50, 55],
    emerald: [60, 70, 80, 90, 100],
  },

  // Consistency-90plus achievements (consecutive 90%+ accuracy tests)
  "consistency-90plus": {
    copper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    silver: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    gold: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    diamond: [35, 40, 45, 50, 60],
    emerald: [75, 90, 100, 125, 150],
  },

  // Consistency-variance achievements (tests with low WPM variance)
  "consistency-variance": {
    copper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    silver: [12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    gold: [35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
    diamond: [90, 100, 120, 150, 200],
    emerald: [250, 300, 400, 500, 750],
  },

  // Improvement-pb-count achievements (personal bests set)
  "improvement-pb": {
    copper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    silver: [12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    gold: [35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
    diamond: [90, 100, 120, 150, 200],
    emerald: [250, 300, 400, 500, 750],
  },

  // Endurance-tests-day achievements (tests completed in one day)
  "endurance-daily": {
    copper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    silver: [12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    gold: [35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
    diamond: [90, 100, 120, 150, 200],
    emerald: [250, 300, 400, 500, 750],
  },

  // Collection achievements (total achievements earned)
  collection: {
    copper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    silver: [15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
    gold: [75, 100, 125, 150, 175, 200, 225, 250, 275, 300],
    diamond: [350, 400, 450, 500, 550],
    emerald: [600, 700, 800, 900, 1000],
  },
} as const;

// Type for the keys of PROGRESSIVE_THRESHOLDS
export type ProgressiveCategory = keyof typeof PROGRESSIVE_THRESHOLDS;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the threshold value for a specific tier-based achievement ID
 * @param category - The achievement category (e.g., "speed", "words")
 * @param tier - The tier (copper, silver, gold, diamond, emerald)
 * @param level - The level within the tier (1-10 for copper/silver/gold, 1-5 for diamond/emerald)
 * @returns The threshold value, or undefined if invalid
 */
export function getThresholdValue(
  category: ProgressiveCategory,
  tier: AchievementTier,
  level: number
): number | undefined {
  const thresholds = PROGRESSIVE_THRESHOLDS[category]?.[tier];
  if (!thresholds || level < 1 || level > thresholds.length) {
    return undefined;
  }
  return thresholds[level - 1];
}

/**
 * Parse a tier-based achievement ID into its components
 * @param id - Achievement ID (e.g., "speed-copper-1")
 * @returns Parsed components or null if invalid
 */
export function parseAchievementId(
  id: string
): { category: string; tier: AchievementTier; level: number } | null {
  const match = id.match(/^(.+)-(copper|silver|gold|diamond|emerald)-(\d+)$/);
  if (!match) return null;

  return {
    category: match[1],
    tier: match[2] as AchievementTier,
    level: parseInt(match[3], 10),
  };
}

/**
 * Build a tier-based achievement ID
 * @param category - The achievement category
 * @param tier - The tier
 * @param level - The level within the tier
 * @returns The achievement ID
 */
export function buildAchievementId(
  category: string,
  tier: AchievementTier,
  level: number
): string {
  return `${category}-${tier}-${level}`;
}

/**
 * Get all threshold entries for a category as a flat array with tier info
 */
export function getAllThresholdsForCategory(
  category: ProgressiveCategory
): Array<{ tier: AchievementTier; level: number; value: number; id: string }> {
  const thresholds = PROGRESSIVE_THRESHOLDS[category];
  const result: Array<{ tier: AchievementTier; level: number; value: number; id: string }> = [];

  const tiers: AchievementTier[] = ["copper", "silver", "gold", "diamond", "emerald"];

  for (const tier of tiers) {
    const values = thresholds[tier];
    for (let i = 0; i < values.length; i++) {
      result.push({
        tier,
        level: i + 1,
        value: values[i],
        id: buildAchievementId(category, tier, i + 1),
      });
    }
  }

  return result;
}

/**
 * Find which tier-based ID a user qualifies for given their current value
 * Returns the highest qualifying achievement ID, or null if none qualify
 */
export function findHighestQualifyingId(
  category: ProgressiveCategory,
  currentValue: number
): string | null {
  const allThresholds = getAllThresholdsForCategory(category);

  // Find all qualifying thresholds (where currentValue >= threshold)
  const qualifying = allThresholds.filter((t) => currentValue >= t.value);

  if (qualifying.length === 0) return null;

  // Return the highest one (last in the sorted array)
  return qualifying[qualifying.length - 1].id;
}

/**
 * Get all achievement IDs that a user qualifies for given their current value
 */
export function getAllQualifyingIds(
  category: ProgressiveCategory,
  currentValue: number
): string[] {
  const allThresholds = getAllThresholdsForCategory(category);
  return allThresholds.filter((t) => currentValue >= t.value).map((t) => t.id);
}

// =============================================================================
// TIER ORDER (for sorting and comparison)
// =============================================================================

export const TIER_ORDER: Record<AchievementTier, number> = {
  copper: 0,
  silver: 1,
  gold: 2,
  diamond: 3,
  emerald: 4,
};

/**
 * Compare two tiers for sorting
 * @returns negative if a < b, positive if a > b, 0 if equal
 */
export function compareTiers(a: AchievementTier, b: AchievementTier): number {
  return TIER_ORDER[a] - TIER_ORDER[b];
}
