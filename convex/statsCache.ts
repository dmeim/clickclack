import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/**
 * Internal mutation to update a user's stats cache after a new test result.
 * Called from testResults.saveResult.
 */
export const updateUserStatsCache = internalMutation({
  args: {
    userId: v.id("users"),
    wpm: v.number(),
    accuracy: v.number(),
    duration: v.number(),
    wordCount: v.number(),
    isValid: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Only count valid results in the cache
    // isValid !== false means valid (includes undefined for legacy data)
    if (args.isValid === false) {
      return null;
    }

    const now = Date.now();

    // Get existing cache row for user
    const existingCache = await ctx.db
      .query("userStatsCache")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!existingCache) {
      // Create new cache entry
      await ctx.db.insert("userStatsCache", {
        userId: args.userId,
        totalTests: 1,
        totalWpm: args.wpm,
        bestWpm: args.wpm,
        totalAccuracy: args.accuracy,
        totalTimeTyped: args.duration,
        totalWordsTyped: args.wordCount,
        updatedAt: now,
      });
      return { created: true };
    }

    // Update existing cache
    await ctx.db.patch(existingCache._id, {
      totalTests: existingCache.totalTests + 1,
      totalWpm: existingCache.totalWpm + args.wpm,
      bestWpm: Math.max(existingCache.bestWpm, args.wpm),
      totalAccuracy: existingCache.totalAccuracy + args.accuracy,
      totalTimeTyped: existingCache.totalTimeTyped + args.duration,
      totalWordsTyped: existingCache.totalWordsTyped + args.wordCount,
      updatedAt: now,
    });

    return { updated: true };
  },
});

/**
 * Internal mutation to update the leaderboard cache after a new test result.
 * Only called if accuracy >= 90% (leaderboard requirement).
 * Called from testResults.saveResult.
 */
export const updateLeaderboardCache = internalMutation({
  args: {
    userId: v.id("users"),
    wpm: v.number(),
    createdAt: v.number(),
    username: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const timeRanges = ["all-time", "week", "today"] as const;
    const updates: string[] = [];

    for (const timeRange of timeRanges) {
      // Check if user has an existing entry for this time range
      const existingEntry = await ctx.db
        .query("leaderboardCache")
        .withIndex("by_user_time_range", (q) =>
          q.eq("userId", args.userId).eq("timeRange", timeRange)
        )
        .first();

      if (!existingEntry) {
        // Create new entry
        await ctx.db.insert("leaderboardCache", {
          userId: args.userId,
          timeRange,
          bestWpm: args.wpm,
          bestWpmAt: args.createdAt,
          username: args.username,
          avatarUrl: args.avatarUrl,
          updatedAt: now,
        });
        updates.push(`created ${timeRange}`);
      } else if (args.wpm > existingEntry.bestWpm) {
        // Update if new score is better
        await ctx.db.patch(existingEntry._id, {
          bestWpm: args.wpm,
          bestWpmAt: args.createdAt,
          username: args.username, // Also update username/avatar in case they changed
          avatarUrl: args.avatarUrl,
          updatedAt: now,
        });
        updates.push(`updated ${timeRange}`);
      }
    }

    return { updates };
  },
});

/**
 * Internal mutation to decrement user stats cache after deleting a result.
 * If the deleted result was the user's best WPM, we need to recalculate.
 */
export const decrementUserStatsCache = internalMutation({
  args: {
    userId: v.id("users"),
    wpm: v.number(),
    accuracy: v.number(),
    duration: v.number(),
    wordCount: v.number(),
    wasValid: v.boolean(),
    wasBestWpm: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Only affect cache if the deleted result was valid
    if (!args.wasValid) {
      return null;
    }

    const existingCache = await ctx.db
      .query("userStatsCache")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!existingCache) {
      return null;
    }

    const now = Date.now();
    const newTotalTests = Math.max(0, existingCache.totalTests - 1);

    if (newTotalTests === 0) {
      // No more tests - delete cache entry
      await ctx.db.delete(existingCache._id);
      return { deleted: true };
    }

    if (args.wasBestWpm) {
      // Need to recalculate best WPM from remaining results
      const allResults = await ctx.db
        .query("testResults")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      const validResults = allResults.filter((r) => r.isValid !== false);
      const newBestWpm =
        validResults.length > 0
          ? Math.max(...validResults.map((r) => r.wpm))
          : 0;

      await ctx.db.patch(existingCache._id, {
        totalTests: newTotalTests,
        totalWpm: Math.max(0, existingCache.totalWpm - args.wpm),
        bestWpm: newBestWpm,
        totalAccuracy: Math.max(0, existingCache.totalAccuracy - args.accuracy),
        totalTimeTyped: Math.max(0, existingCache.totalTimeTyped - args.duration),
        totalWordsTyped: Math.max(0, existingCache.totalWordsTyped - args.wordCount),
        updatedAt: now,
      });
    } else {
      // Simple decrement
      await ctx.db.patch(existingCache._id, {
        totalTests: newTotalTests,
        totalWpm: Math.max(0, existingCache.totalWpm - args.wpm),
        totalAccuracy: Math.max(0, existingCache.totalAccuracy - args.accuracy),
        totalTimeTyped: Math.max(0, existingCache.totalTimeTyped - args.duration),
        totalWordsTyped: Math.max(0, existingCache.totalWordsTyped - args.wordCount),
        updatedAt: now,
      });
    }

    return { updated: true };
  },
});

/**
 * Internal mutation to update leaderboard cache after deleting a result.
 * Only needed if the deleted result was on the leaderboard (accuracy >= 90%).
 */
export const updateLeaderboardCacheAfterDeletion = internalMutation({
  args: {
    userId: v.id("users"),
    deletedWpm: v.number(),
    deletedAccuracy: v.number(),
    deletedCreatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Only affects leaderboard if accuracy was >= 90%
    if (args.deletedAccuracy < 90) {
      return null;
    }

    const now = Date.now();
    const timeRanges = ["all-time", "week", "today"] as const;

    // Get user for username/avatar
    const user = await ctx.db.get(args.userId);

    for (const timeRange of timeRanges) {
      const existingEntry = await ctx.db
        .query("leaderboardCache")
        .withIndex("by_user_time_range", (q) =>
          q.eq("userId", args.userId).eq("timeRange", timeRange)
        )
        .first();

      if (!existingEntry) {
        continue;
      }

      // Check if the deleted result was this user's best for this time range
      if (
        existingEntry.bestWpm === args.deletedWpm &&
        existingEntry.bestWpmAt === args.deletedCreatedAt
      ) {
        // Need to recalculate best WPM from remaining results
        const allResults = await ctx.db
          .query("testResults")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .collect();

        // Filter by time range and accuracy
        let timeCutoff = 0;
        if (timeRange === "today") {
          timeCutoff = getStartOfDayET(0);
        } else if (timeRange === "week") {
          timeCutoff = getStartOfDayET(7);
        }

        const eligibleResults = allResults.filter((r) => {
          const meetsAccuracy = r.accuracy >= 90;
          const meetsTimeRange = timeRange === "all-time" || r.createdAt >= timeCutoff;
          const isValid = r.isValid !== false;
          return meetsAccuracy && meetsTimeRange && isValid;
        });

        if (eligibleResults.length === 0) {
          // No more eligible results - delete cache entry
          await ctx.db.delete(existingEntry._id);
        } else {
          // Find new best
          const best = eligibleResults.reduce((a, b) =>
            a.wpm > b.wpm ? a : b
          );

          await ctx.db.patch(existingEntry._id, {
            bestWpm: best.wpm,
            bestWpmAt: best.createdAt,
            username: user?.username ?? existingEntry.username,
            avatarUrl: user?.avatarUrl ?? existingEntry.avatarUrl,
            updatedAt: now,
          });
        }
      }
    }

    return { updated: true };
  },
});

/**
 * Rebuild user stats cache for a single user.
 * Used during migration to backfill cache from existing data.
 */
export const rebuildUserStatsCacheForUser = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Delete existing cache entry if any
    const existingCache = await ctx.db
      .query("userStatsCache")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingCache) {
      await ctx.db.delete(existingCache._id);
    }

    // Get all results for this user
    const allResults = await ctx.db
      .query("testResults")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter to valid results only
    const validResults = allResults.filter((r) => r.isValid !== false);

    if (validResults.length === 0) {
      return { skipped: true, reason: "no valid results" };
    }

    // Calculate aggregates
    const totalTests = validResults.length;
    const totalWpm = validResults.reduce((sum, r) => sum + r.wpm, 0);
    const bestWpm = Math.max(...validResults.map((r) => r.wpm));
    const totalAccuracy = validResults.reduce((sum, r) => sum + r.accuracy, 0);
    const totalTimeTyped = validResults.reduce((sum, r) => sum + r.duration, 0);
    const totalWordsTyped = validResults.reduce(
      (sum, r) => sum + r.wordCount,
      0
    );

    // Insert new cache entry
    await ctx.db.insert("userStatsCache", {
      userId: args.userId,
      totalTests,
      totalWpm,
      bestWpm,
      totalAccuracy,
      totalTimeTyped,
      totalWordsTyped,
      updatedAt: now,
    });

    return { created: true, totalTests };
  },
});

/**
 * Rebuild leaderboard cache for a single user.
 * Used during migration to backfill cache from existing data.
 */
export const rebuildLeaderboardCacheForUser = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const timeRanges = ["all-time", "week", "today"] as const;

    // Get user for username/avatar
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { skipped: true, reason: "user not found" };
    }

    // Delete existing cache entries for this user
    for (const timeRange of timeRanges) {
      const existingEntry = await ctx.db
        .query("leaderboardCache")
        .withIndex("by_user_time_range", (q) =>
          q.eq("userId", args.userId).eq("timeRange", timeRange)
        )
        .first();

      if (existingEntry) {
        await ctx.db.delete(existingEntry._id);
      }
    }

    // Get all results for this user
    const allResults = await ctx.db
      .query("testResults")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const created: string[] = [];

    for (const timeRange of timeRanges) {
      // Filter by time range and accuracy
      let timeCutoff = 0;
      if (timeRange === "today") {
        timeCutoff = getStartOfDayET(0);
      } else if (timeRange === "week") {
        timeCutoff = getStartOfDayET(7);
      }

      const eligibleResults = allResults.filter((r) => {
        const meetsAccuracy = r.accuracy >= 90;
        const meetsTimeRange = timeRange === "all-time" || r.createdAt >= timeCutoff;
        const isValid = r.isValid !== false;
        return meetsAccuracy && meetsTimeRange && isValid;
      });

      if (eligibleResults.length === 0) {
        continue;
      }

      // Find best result
      const best = eligibleResults.reduce((a, b) => (a.wpm > b.wpm ? a : b));

      // Create cache entry
      await ctx.db.insert("leaderboardCache", {
        userId: args.userId,
        timeRange,
        bestWpm: best.wpm,
        bestWpmAt: best.createdAt,
        username: user.username,
        avatarUrl: user.avatarUrl,
        updatedAt: now,
      });

      created.push(timeRange);
    }

    return { created };
  },
});

/**
 * Query to get cached user stats (for internal use).
 */
export const getCachedUserStats = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userStatsCache")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Scheduled job to prune stale leaderboard cache entries.
 * - "today" entries older than midnight today are deleted
 * - "week" entries older than 7 days ago are deleted
 * Run this daily (e.g., at midnight ET) to keep the cache clean.
 */
export const pruneStaleLeaderboardEntries = internalMutation({
  args: {},
  handler: async (ctx) => {
    const todayCutoff = getStartOfDayET(0);
    const weekCutoff = getStartOfDayET(7);
    let deletedToday = 0;
    let deletedWeek = 0;

    // Get all "today" entries and delete stale ones
    const todayEntries = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_time_range_wpm", (q) => q.eq("timeRange", "today"))
      .collect();

    for (const entry of todayEntries) {
      if (entry.bestWpmAt < todayCutoff) {
        await ctx.db.delete(entry._id);
        deletedToday++;
      }
    }

    // Get all "week" entries and delete stale ones
    const weekEntries = await ctx.db
      .query("leaderboardCache")
      .withIndex("by_time_range_wpm", (q) => q.eq("timeRange", "week"))
      .collect();

    for (const entry of weekEntries) {
      if (entry.bestWpmAt < weekCutoff) {
        await ctx.db.delete(entry._id);
        deletedWeek++;
      }
    }

    return { deletedToday, deletedWeek };
  },
});

// ==============================================================================
// Helper functions (copied from testResults.ts for timezone handling)
// ==============================================================================

const TIMEZONE = "America/New_York";

function getTimezoneOffset(date: Date): number {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone: TIMEZONE }));
  return utcDate.getTime() - tzDate.getTime();
}

function getStartOfDayET(daysAgo: number = 0): number {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === "year")!.value);
  const month = parseInt(parts.find((p) => p.type === "month")!.value) - 1;
  const day = parseInt(parts.find((p) => p.type === "day")!.value) - daysAgo;

  const midnightUTC = Date.UTC(year, month, day, 0, 0, 0, 0);
  const offset = getTimezoneOffset(new Date(midnightUTC));

  return midnightUTC + offset;
}
