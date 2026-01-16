// Achievement Thresholds Configuration for Convex Backend
// This mirrors src/lib/achievement-thresholds.ts for backend use
// =====================================
// To adjust difficulty, modify the arrays below - no code changes needed!

export type AchievementTier = "copper" | "silver" | "gold" | "diamond" | "emerald";

export interface TierThresholds {
  copper: readonly number[];
  silver: readonly number[];
  gold: readonly number[];
  diamond: readonly number[];
  emerald: readonly number[];
}

// =============================================================================
// PROGRESSIVE THRESHOLDS - Keep in sync with src/lib/achievement-thresholds.ts
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
    diamond: [420, 600, 900, 1200, 1440],
    emerald: [1800, 3000, 4500, 6000, 9000],
  },

  // Streak achievements (consecutive days)
  streak: {
    copper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    silver: [12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    gold: [35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
    diamond: [90, 100, 120, 150, 200],
    emerald: [250, 300, 365, 500, 730],
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

export type ProgressiveCategory = keyof typeof PROGRESSIVE_THRESHOLDS;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const TIERS: AchievementTier[] = ["copper", "silver", "gold", "diamond", "emerald"];

/**
 * Get all achievement IDs that a user qualifies for in a category
 */
export function getQualifyingAchievementIds(
  category: ProgressiveCategory,
  currentValue: number
): string[] {
  const thresholds = PROGRESSIVE_THRESHOLDS[category];
  const ids: string[] = [];

  for (const tier of TIERS) {
    const values = thresholds[tier];
    for (let i = 0; i < values.length; i++) {
      if (currentValue >= values[i]) {
        ids.push(`${category}-${tier}-${i + 1}`);
      }
    }
  }

  return ids;
}

/**
 * Build achievement ID from components
 */
export function buildAchievementId(
  category: string,
  tier: AchievementTier,
  level: number
): string {
  return `${category}-${tier}-${level}`;
}
