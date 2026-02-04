import { v } from "convex/values";
import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Migration to backfill userStatsCache and leaderboardCache tables.
 * 
 * Run this once after deploying the schema changes to populate the cache
 * from existing test results.
 * 
 * Usage from Convex dashboard:
 *   1. Go to Functions > migrations > backfillAllCaches
 *   2. Click "Run" with no arguments
 *   3. Monitor progress in the logs
 * 
 * For large datasets, this runs in batches to avoid timeouts.
 */

/**
 * Backfill user stats cache for a batch of users.
 * Processes users in batches to avoid timeout.
 */
export const backfillUserStatsCacheBatch = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 50;
    
    // If we have a cursor, start from there
    // Note: Convex doesn't have cursor-based pagination built-in,
    // so we use the _id as a cursor by filtering
    const users = args.cursor
      ? await ctx.db
          .query("users")
          .filter((q) => q.gt(q.field("_id"), args.cursor as string))
          .take(batchSize)
      : await ctx.db.query("users").take(batchSize);

    if (users.length === 0) {
      return { done: true, processed: 0, nextCursor: null };
    }

    let processed = 0;
    for (const user of users) {
      await ctx.runMutation(internal.statsCache.rebuildUserStatsCacheForUser, {
        userId: user._id,
      });
      processed++;
    }

    const lastUser = users[users.length - 1];
    const nextCursor = users.length === batchSize ? (lastUser._id as string) : null;

    return {
      done: nextCursor === null,
      processed,
      nextCursor,
    };
  },
});

/**
 * Backfill leaderboard cache for a batch of users.
 * Processes users in batches to avoid timeout.
 */
export const backfillLeaderboardCacheBatch = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 50;
    
    const users = args.cursor
      ? await ctx.db
          .query("users")
          .filter((q) => q.gt(q.field("_id"), args.cursor as string))
          .take(batchSize)
      : await ctx.db.query("users").take(batchSize);

    if (users.length === 0) {
      return { done: true, processed: 0, nextCursor: null };
    }

    let processed = 0;
    for (const user of users) {
      await ctx.runMutation(internal.statsCache.rebuildLeaderboardCacheForUser, {
        userId: user._id,
      });
      processed++;
    }

    const lastUser = users[users.length - 1];
    const nextCursor = users.length === batchSize ? (lastUser._id as string) : null;

    return {
      done: nextCursor === null,
      processed,
      nextCursor,
    };
  },
});

// Type for batch result
type BatchResult = {
  done: boolean;
  processed: number;
  nextCursor: string | null;
};

/**
 * Action to run the full backfill process.
 * This orchestrates multiple batches until all users are processed.
 * 
 * Run this from the Convex dashboard to populate the cache tables.
 */
export const backfillAllCaches = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Starting cache backfill migration...");
    
    // Phase 1: Backfill user stats cache
    console.log("Phase 1: Backfilling user stats cache...");
    let userStatsCursor: string | null = null;
    let totalUserStats = 0;
    
    while (true) {
      const result: BatchResult = await ctx.runMutation(
        internal.migrations.backfillUserStatsCacheBatch,
        { cursor: userStatsCursor ?? undefined, batchSize: 50 }
      );
      
      totalUserStats += result.processed;
      console.log(`  Processed ${result.processed} users (total: ${totalUserStats})`);
      
      if (result.done) {
        break;
      }
      
      userStatsCursor = result.nextCursor;
    }
    
    console.log(`Phase 1 complete: ${totalUserStats} user stats cached`);
    
    // Phase 2: Backfill leaderboard cache
    console.log("Phase 2: Backfilling leaderboard cache...");
    let leaderboardCursor: string | null = null;
    let totalLeaderboard = 0;
    
    while (true) {
      const result: BatchResult = await ctx.runMutation(
        internal.migrations.backfillLeaderboardCacheBatch,
        { cursor: leaderboardCursor ?? undefined, batchSize: 50 }
      );
      
      totalLeaderboard += result.processed;
      console.log(`  Processed ${result.processed} users (total: ${totalLeaderboard})`);
      
      if (result.done) {
        break;
      }
      
      leaderboardCursor = result.nextCursor;
    }
    
    console.log(`Phase 2 complete: ${totalLeaderboard} users processed for leaderboard`);
    console.log("Migration complete!");
    
    return {
      userStatsProcessed: totalUserStats,
      leaderboardProcessed: totalLeaderboard,
    };
  },
});

/**
 * Quick migration for small datasets - processes all users in one go.
 * Only use this if you have < 100 users.
 */
export const backfillAllCachesQuick = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    let userStatsCount = 0;
    let leaderboardCount = 0;
    
    for (const user of users) {
      // Rebuild user stats
      await ctx.runMutation(internal.statsCache.rebuildUserStatsCacheForUser, {
        userId: user._id,
      });
      userStatsCount++;
      
      // Rebuild leaderboard
      await ctx.runMutation(internal.statsCache.rebuildLeaderboardCacheForUser, {
        userId: user._id,
      });
      leaderboardCount++;
    }
    
    return {
      totalUsers: users.length,
      userStatsProcessed: userStatsCount,
      leaderboardProcessed: leaderboardCount,
    };
  },
});
