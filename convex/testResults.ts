import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Save a test result
export const saveResult = mutation({
  args: {
    clerkId: v.string(),
    wpm: v.number(),
    accuracy: v.number(),
    mode: v.string(),
    duration: v.number(),
    wordCount: v.number(),
    difficulty: v.string(),
    punctuation: v.boolean(),
    numbers: v.boolean(),
    capitalization: v.optional(v.boolean()),
    // Additional stats
    wordsCorrect: v.number(),
    wordsIncorrect: v.number(),
    charsMissed: v.number(),
    charsExtra: v.number(),
    // For streak and achievement tracking
    localDate: v.string(), // "YYYY-MM-DD" in user's local time
    localHour: v.number(), // 0-23, user's local hour
    isWeekend: v.boolean(), // Whether it's Saturday or Sunday
    // New time-based fields for achievements
    dayOfWeek: v.number(), // 0-6 (Sunday-Saturday)
    month: v.number(), // 0-11
    day: v.number(), // 1-31
  },
  handler: async (ctx, args): Promise<{ resultId: Id<"testResults">; newAchievements: string[] }> => {
    // Find the user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found. Please sign in first.");
    }

    const createdAt = Date.now();

    // Insert the test result
    const resultId = await ctx.db.insert("testResults", {
      userId: user._id,
      wpm: args.wpm,
      accuracy: args.accuracy,
      mode: args.mode,
      duration: args.duration,
      wordCount: args.wordCount,
      difficulty: args.difficulty,
      punctuation: args.punctuation,
      numbers: args.numbers,
      capitalization: args.capitalization,
      wordsCorrect: args.wordsCorrect,
      wordsIncorrect: args.wordsIncorrect,
      charsMissed: args.charsMissed,
      charsExtra: args.charsExtra,
      createdAt,
    });

    // Update streak (runs in same transaction)
    await ctx.runMutation(internal.streaks.updateStreak, {
      userId: user._id,
      localDate: args.localDate,
      duration: args.duration,
      wordsCorrect: args.wordsCorrect,
    });

    // Check and award achievements (runs in same transaction)
    const achievementResult: { newAchievements: string[]; totalAchievements: number } = await ctx.runMutation(
      internal.achievements.checkAndAwardAchievements,
      {
        userId: user._id,
        testResult: {
          wpm: args.wpm,
          accuracy: args.accuracy,
          mode: args.mode,
          duration: args.duration,
          wordCount: args.wordCount,
          difficulty: args.difficulty,
          punctuation: args.punctuation,
          numbers: args.numbers,
          capitalization: args.capitalization,
          wordsCorrect: args.wordsCorrect,
          wordsIncorrect: args.wordsIncorrect,
          createdAt,
        },
        localHour: args.localHour,
        isWeekend: args.isWeekend,
        dayOfWeek: args.dayOfWeek,
        month: args.month,
        day: args.day,
      }
    );

    return {
      resultId,
      newAchievements: achievementResult.newAchievements,
    };
  },
});

// Delete a test result
export const deleteResult = mutation({
  args: {
    resultId: v.id("testResults"),
    clerkId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; removedAchievements: string[] }> => {
    // Find the user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found. Please sign in first.");
    }

    // Get the test result
    const result = await ctx.db.get(args.resultId);

    if (!result) {
      throw new Error("Test result not found.");
    }

    // Verify ownership
    if (result.userId !== user._id) {
      throw new Error("You can only delete your own test results.");
    }

    // Delete the result
    await ctx.db.delete(args.resultId);

    // Recheck achievements and remove any that user no longer qualifies for
    const { removedAchievements } = await ctx.runMutation(
      internal.achievements.recheckAchievementsAfterDeletion,
      { userId: user._id }
    );

    return { success: true, removedAchievements };
  },
});

// Get user's test results (most recent first)
export const getUserResults = query({
  args: {
    clerkId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find the user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return [];
    }

    const limit = args.limit ?? 50;

    // Get results ordered by creation date (descending)
    const results = await ctx.db
      .query("testResults")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return results;
  },
});

// Get aggregated stats for a user
// Note: Aggregates (averages, best) only use valid results
// History shows all results with isValid flag for UI distinction
export const getUserStats = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return null;
    }

    // Get all results for this user
    const allResults = await ctx.db
      .query("testResults")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (allResults.length === 0) {
      return {
        totalTests: 0,
        averageWpm: 0,
        bestWpm: 0,
        averageAccuracy: 0,
        totalTimeTyped: 0,
        totalWordsTyped: 0,
        totalCharactersTyped: 0,
        allResults: [],
      };
    }

    // Filter to valid results for aggregate stats
    // isValid !== false means valid (includes undefined for legacy data)
    const validResults = allResults.filter((r) => r.isValid !== false);

    // Calculate stats from valid results only
    const totalTests = validResults.length;
    const totalWpm = validResults.reduce((sum, r) => sum + r.wpm, 0);
    const averageWpm = totalTests > 0 ? Math.round(totalWpm / totalTests) : 0;
    const bestWpm = validResults.length > 0 ? Math.max(...validResults.map((r) => r.wpm)) : 0;
    const totalAccuracy = validResults.reduce((sum, r) => sum + r.accuracy, 0);
    const averageAccuracy = totalTests > 0 ? Math.round((totalAccuracy / totalTests) * 10) / 10 : 0;
    const totalTimeTyped = validResults.reduce((sum, r) => sum + r.duration, 0);
    const totalWordsTyped = validResults.reduce((sum, r) => sum + r.wordCount, 0);
    // Characters typed (5 characters per word, standard WPM calculation)
    const totalCharactersTyped = totalWordsTyped * 5;

    // Return all results (including invalid) for history display
    // Sorted by date (most recent first)
    const sortedResults = allResults.sort((a, b) => b.createdAt - a.createdAt);

    return {
      totalTests,
      averageWpm,
      bestWpm,
      averageAccuracy,
      totalTimeTyped,
      totalWordsTyped,
      totalCharactersTyped,
      allResults: sortedResults,
    };
  },
});

// Get leaderboard data for top WPM scores
export const getLeaderboard = query({
  args: {
    timeRange: v.union(
      v.literal("all-time"),
      v.literal("week"),
      v.literal("today")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Calculate time cutoff based on range
    const now = Date.now();
    let timeCutoff = 0;

    if (args.timeRange === "today") {
      // Start of today (midnight UTC)
      const today = new Date(now);
      today.setUTCHours(0, 0, 0, 0);
      timeCutoff = today.getTime();
    } else if (args.timeRange === "week") {
      // 7 days ago
      timeCutoff = now - 7 * 24 * 60 * 60 * 1000;
    }
    // For "all-time", timeCutoff stays 0

    // Fetch all test results (we'll filter and group in memory)
    const allResults = await ctx.db.query("testResults").collect();

    // Filter by time range, minimum accuracy (90%), and validity
    // isValid !== false means valid (includes undefined for legacy data)
    const filteredResults = allResults.filter((r) => {
      const meetsAccuracy = r.accuracy >= 90;
      const meetsTimeRange = args.timeRange === "all-time" || r.createdAt >= timeCutoff;
      const isValidResult = r.isValid !== false;
      return meetsAccuracy && meetsTimeRange && isValidResult;
    });

    // Group by user and find best WPM for each user
    // Use a Map keyed by the string representation of userId
    const userBestMap = new Map<
      string,
      { wpm: number; createdAt: number; userId: typeof filteredResults[0]["userId"] }
    >();

    for (const result of filteredResults) {
      const userIdStr = result.userId as unknown as string;
      const existing = userBestMap.get(userIdStr);

      if (!existing || result.wpm > existing.wpm) {
        userBestMap.set(userIdStr, {
          wpm: result.wpm,
          createdAt: result.createdAt,
          userId: result.userId,
        });
      }
    }

    // Convert to array and sort by WPM descending
    const sortedBests = Array.from(userBestMap.values()).sort(
      (a, b) => b.wpm - a.wpm
    );

    // Take top N
    const topBests = sortedBests.slice(0, limit);

    // Fetch user details for each entry
    const leaderboard = await Promise.all(
      topBests.map(async (entry, index) => {
        // Get user by ID directly
        const user = await ctx.db.get(entry.userId);

        return {
          rank: index + 1,
          username: user?.username ?? "Unknown",
          avatarUrl: user?.avatarUrl ?? null,
          wpm: entry.wpm,
          createdAt: entry.createdAt,
        };
      })
    );

    return leaderboard;
  },
});
